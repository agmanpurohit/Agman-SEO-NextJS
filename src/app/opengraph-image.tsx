import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { logo_mark } from "@/components/brand/logo-paths";

export const alt = "Agman Rajpurohit — SEO & Digital Marketing Specialist, Dubai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card: portrait on the right, name and tagline on the left. */
export default async function OpengraphImage() {
  const photo = await readFile(join(process.cwd(), "public/images/agman-rajpurohit.png"));
  const src = `data:image/png;base64,${photo.toString("base64")}`;
  const [, , vw, vh] = logo_mark.viewBox.split(" ").map(Number);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a0b", color: "#ece8e1", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={504} height={630} style={{ position: "absolute", right: 0, top: 0, width: 504, height: 630, objectFit: "cover" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 504, height: 630, background: "linear-gradient(90deg, #0a0a0b 0%, rgba(10,10,11,0) 45%)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, width: 760 }}>
          <svg width={96} height={(96 * vh) / vw} viewBox={logo_mark.viewBox}>
            <path d={logo_mark.light} fill="#ece8e1" fillRule="evenodd" />
            <path d={logo_mark.accent} fill="#ff5a1f" fillRule="evenodd" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 0.9, letterSpacing: -3, textTransform: "uppercase" }}>Visibility,</div>
            <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 0.9, letterSpacing: -3, textTransform: "uppercase", display: "flex" }}>
              engineered<span style={{ color: "#ff5a1f" }}>.</span>
            </div>
            <div style={{ marginTop: 36, fontSize: 30, fontWeight: 600 }}>Agman Rajpurohit</div>
            <div style={{ marginTop: 8, fontSize: 22, color: "#aca79e" }}>SEO & Digital Marketing Specialist · Dubai, UAE</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
