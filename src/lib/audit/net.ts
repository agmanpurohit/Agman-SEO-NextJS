import "server-only";
import { lookup } from "node:dns/promises";
import { lookup as dnsLookup, type LookupAddress, type LookupOptions } from "node:dns";
import { isIP } from "node:net";
import http from "node:http";
import https from "node:https";
import { gunzipSync, brotliDecompressSync, inflateSync } from "node:zlib";
import { auditConfig } from "./config";

/**
 * SSRF-safe fetching for user-submitted URLs.
 * - http/https only, default ports only (80/443)
 * - every hostname is resolved and every resolved address is checked against private,
 *   loopback, link-local, CGNAT, multicast, reserved and cloud-metadata ranges
 * - redirects are followed manually and each hop is re-validated
 * - timeouts and a hard response-size cap; bodies are read as text, never executed
 */

export class UnsafeUrlError extends Error {}

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "metadata", "instance-data", "instance-data.ec2.internal"]);
const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".intranet", ".lan", ".home", ".corp", ".arpa"];

function ipv4ToInt(ip: string) {
  return ip.split(".").reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}
const v4Ranges: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // link-local incl. 169.254.169.254 cloud metadata
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
  ["255.255.255.255", 32],
];

export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const n = ipv4ToInt(ip);
    return v4Ranges.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (ipv4ToInt(base) & mask);
    });
  }
  if (v === 6) {
    const a = ip.toLowerCase();
    if (a === "::" || a === "::1") return true;
    const mapped = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    if (/^::ffff:[0-9a-f]{1,4}:[0-9a-f]{1,4}$/.test(a)) return true; // mapped, hex form — reject
    const first = parseInt(a.split(":")[0] || "0", 16);
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((first & 0xff00) === 0xff00) return true; // multicast
    if (a.startsWith("64:ff9b:")) return true; // NAT64
    if (a.startsWith("2001:db8")) return true; // documentation
    if (a.startsWith("fd00:ec2")) return true; // AWS IMDS v6
    return false;
  }
  return true;
}

/** Normalises user input into a URL and rejects anything that isn't a public http(s) site. */
export function normaliseUrl(input: string): URL {
  let raw = (input || "").trim();
  if (!raw) throw new UnsafeUrlError("Please enter a website URL.");
  if (raw.length > 2048) throw new UnsafeUrlError("That URL is too long.");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new UnsafeUrlError("That doesn't look like a valid website address.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new UnsafeUrlError("Only http and https websites can be audited.");
  if (u.username || u.password) throw new UnsafeUrlError("URLs with login details can't be audited.");
  if (u.port && u.port !== "80" && u.port !== "443") throw new UnsafeUrlError("Only websites on standard ports (80/443) can be audited.");
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || BLOCKED_HOSTS.has(host) || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    throw new UnsafeUrlError("Local and internal addresses can't be audited.");
  }
  if (isIP(host.replace(/^\[|\]$/g, ""))) throw new UnsafeUrlError("Please enter a domain name rather than an IP address.");
  if (!host.includes(".")) throw new UnsafeUrlError("Please enter a full domain, e.g. example.com.");
  u.hash = "";
  return u;
}

/** Resolves the host and throws if any address it points to is non-public. */
export async function assertPublicHost(hostname: string) {
  let addrs: { address: string }[];
  try {
    addrs = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError(`We couldn't find ${hostname}. Check the address and try again.`);
  }
  if (!addrs.length) throw new UnsafeUrlError(`We couldn't find ${hostname}.`);
  for (const a of addrs) {
    if (isPrivateIp(a.address)) throw new UnsafeUrlError("That address points to a private or internal network and can't be audited.");
  }
}

export type FetchResult = {
  requestedUrl: string;
  finalUrl: string;
  status: number; // 0 = network error
  redirects: { url: string; status: number }[];
  headers: Record<string, string>;
  body: string;
  bytes: number;
  truncated: boolean;
  timeMs: number;
  error?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type RawResponse = { status: number; headers: Record<string, string>; body: string; bytes: number; truncated: boolean };

/**
 * DNS lookup hook used for every connection: validates the address the socket will actually
 * connect to, closing the DNS-rebinding gap between "check" and "connect".
 */
function guardedLookup(
  hostname: string,
  options: LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
) {
  dnsLookup(hostname, { ...options, all: true, verbatim: true }, (err, addresses) => {
    if (err) return callback(err, "", 4);
    const list = addresses as LookupAddress[];
    const bad = list.find((a) => isPrivateIp(a.address));
    if (bad || !list.length) return callback(Object.assign(new Error("blocked-address"), { code: "EBLOCKED" }), "", 4);
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

/** Decompresses with an output cap so a compressed "bomb" can't exhaust memory. */
function decompress(buf: Buffer, encoding: string | undefined, maxOut: number): Buffer {
  const opts = { maxOutputLength: maxOut };
  try {
    if (encoding === "gzip" || encoding === "x-gzip") return gunzipSync(buf, opts);
    if (encoding === "br") return brotliDecompressSync(buf, opts);
    if (encoding === "deflate") return inflateSync(buf, opts);
  } catch {
    /* fall back to raw bytes */
  }
  return buf;
}

/** One HTTP request through node:http(s) with the guarded lookup, a timeout and a size cap. */
function rawRequest(
  u: URL,
  o: { method: "GET" | "HEAD"; timeoutMs: number; maxBytes: number; readBody: boolean; accept?: string },
): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const mod = u.protocol === "https:" ? https : http;
    const req = mod.request(
      u,
      {
        method: o.method,
        lookup: guardedLookup as never,
        headers: {
          "User-Agent": auditConfig.userAgent,
          Accept: o.accept ?? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5",
          "Accept-Language": "en",
          "Accept-Encoding": "gzip, deflate, br",
        },
        timeout: o.timeoutMs,
      },
      (res) => {
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) if (v != null) headers[k] = Array.isArray(v) ? v.join(", ") : String(v);
        const status = res.statusCode ?? 0;
        const isRedirect = status >= 300 && status < 400;
        if (!o.readBody || o.method === "HEAD" || isRedirect) {
          res.resume();
          return resolve({ status, headers, body: "", bytes: Number(headers["content-length"] || 0), truncated: false });
        }
        const chunks: Buffer[] = [];
        let bytes = 0;
        let truncated = false;
        res.on("data", (c: Buffer) => {
          bytes += c.length;
          if (bytes > o.maxBytes) {
            truncated = true;
            res.destroy();
            return;
          }
          chunks.push(c);
        });
        const finish = () => {
          clearTimeout(hard);
          const raw = decompress(Buffer.concat(chunks), headers["content-encoding"]?.toLowerCase(), o.maxBytes * 4);
          resolve({ status, headers, body: raw.toString("utf8"), bytes, truncated });
        };
        res.on("end", finish);
        res.on("close", () => truncated && finish());
        res.on("error", () => finish());
      },
    );
    // Hard ceiling for the whole request (socket timeouts alone don't cover slow-drip bodies).
    const hard = setTimeout(() => req.destroy(new Error("timeout")), o.timeoutMs + 2000);
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (e) => {
      clearTimeout(hard);
      if ((e as NodeJS.ErrnoException).code === "EBLOCKED") reject(new UnsafeUrlError("That address points to a private or internal network and can't be audited."));
      else reject(e);
    });
    req.end();
  });
}

/**
 * Fetches a URL safely. Never throws for HTTP errors — returns status and error instead.
 * Throws UnsafeUrlError only when a hop points somewhere unsafe.
 */
export async function safeFetch(
  url: string,
  opts: { method?: "GET" | "HEAD"; maxBytes?: number; timeoutMs?: number; accept?: string; readBody?: boolean } = {},
): Promise<FetchResult> {
  const { method = "GET", maxBytes = auditConfig.maxResponseBytes, timeoutMs = auditConfig.requestTimeoutMs, accept, readBody = true } = opts;
  const started = Date.now();
  const redirects: { url: string; status: number }[] = [];
  let current = url;

  for (let hop = 0; hop <= auditConfig.maxRedirects; hop++) {
    const u = normaliseUrl(current);
    await assertPublicHost(u.hostname);

    let res: RawResponse;
    try {
      res = await rawRequest(u, { method, timeoutMs, maxBytes, readBody, accept });
    } catch (e) {
      if (e instanceof UnsafeUrlError) throw e;
      const msg = (e as Error).message;
      return {
        requestedUrl: url,
        finalUrl: u.toString(),
        status: 0,
        redirects,
        headers: {},
        body: "",
        bytes: 0,
        truncated: false,
        timeMs: Date.now() - started,
        error: msg === "timeout" ? "Timed out" : "Connection failed",
      };
    }
    const headers = res.headers;

    if (res.status >= 300 && res.status < 400 && headers.location) {
      redirects.push({ url: u.toString(), status: res.status });
      let next: string;
      try {
        next = new URL(headers.location, u).toString();
      } catch {
        return { requestedUrl: url, finalUrl: u.toString(), status: res.status, redirects, headers, body: "", bytes: 0, truncated: false, timeMs: Date.now() - started, error: "Invalid redirect" };
      }
      if (redirects.some((r) => r.url === next)) {
        return { requestedUrl: url, finalUrl: next, status: res.status, redirects, headers, body: "", bytes: 0, truncated: false, timeMs: Date.now() - started, error: "Redirect loop" };
      }
      current = next;
      continue;
    }

    return {
      requestedUrl: url,
      finalUrl: u.toString(),
      status: res.status,
      redirects,
      headers,
      body: res.body,
      bytes: res.bytes,
      truncated: res.truncated,
      timeMs: Date.now() - started,
    };
  }

  return { requestedUrl: url, finalUrl: current, status: 0, redirects, headers: {}, body: "", bytes: 0, truncated: false, timeMs: Date.now() - started, error: "Too many redirects" };
}

/** Fetch with one retry for transient failures (network errors, 429, 5xx). */
export async function safeFetchWithRetry(url: string, opts?: Parameters<typeof safeFetch>[1]) {
  let r = await safeFetch(url, opts);
  for (let i = 0; i < auditConfig.maxRetries && (r.status === 0 || r.status === 429 || r.status >= 500) && !r.error?.includes("loop"); i++) {
    await sleep(800);
    r = await safeFetch(url, opts);
  }
  return r;
}
