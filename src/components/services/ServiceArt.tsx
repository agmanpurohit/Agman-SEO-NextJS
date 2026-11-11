import type { ArtId } from "@/content/services";

/**
 * Illustrations for each service, drawn in the site's palette. Inline SVG: sharp at any
 * size, tiny, themeable and readable by screen readers (role="img" + title/desc).
 * Light motion (pulses, rising lines) is CSS-only and stops for reduced-motion users.
 */
const C = { ink: "#0a0a0b", card: "#111113", card2: "#17171a", line: "#26262b", line2: "#3a3a40", bone: "#ece8e1", dim: "#aca79e", mute: "#7d786f", ember: "#ff5a1f", soft: "#ff8a5c", good: "#7fd6a4" };
const MONO = "var(--font-jetbrains), ui-monospace, monospace";
const SANS = "var(--font-archivo), system-ui, sans-serif";

const DESC: Record<ArtId, { title: string; desc: string }> = {
  seo: { title: "SEO illustration", desc: "A Google results page where a business website climbs from fourth to first position, with organic traffic rising." },
  digital: { title: "Digital marketing illustration", desc: "A business at the centre, connected to search, Google Maps, Google Ads, Meta Ads, AI search and email." },
  technical: { title: "Technical SEO illustration", desc: "A website's page structure as a crawl map, with status codes and a Core Web Vitals score." },
  local: { title: "Local SEO illustration", desc: "A Google Maps view with a highlighted business pin and the business listed first in the local pack with five-star reviews." },
  geo: { title: "GEO illustration", desc: "An AI assistant answering a question and citing the business website as its source." },
  aeo: { title: "AEO illustration", desc: "A question in search answered by a featured snippet from the business website, with People Also Ask questions and voice search." },
  "google-ads": { title: "Google Ads illustration", desc: "A sponsored Google search ad for a clinic, with the average click-through rate, cost per click and conversion rate from Agman's freelance accounts, and leads rising week by week." },
  "meta-ads": { title: "Meta Ads illustration", desc: "A sponsored Instagram ad on a phone with a Book now button, audience targeting by city and interest, and the $3–8 average cost per lead from Agman's freelance accounts." },
  web: { title: "Web development illustration", desc: "A responsive business website in a browser, with clean HTML and a performance score of 98." },
};

export function ServiceArt({ id, className = "" }: { id: ArtId; className?: string }) {
  const d = DESC[id];
  const tid = `art-${id}-t`;
  const did = `art-${id}-d`;
  return (
    <svg viewBox="0 0 520 400" role="img" aria-labelledby={`${tid} ${did}`} className={`service-art h-auto w-full ${className}`}>
      <title id={tid}>{d.title}</title>
      <desc id={did}>{d.desc}</desc>
      <defs>
        <radialGradient id={`glow-${id}`} cx="70%" cy="20%" r="80%">
          <stop offset="0" stopColor={C.ember} stopOpacity="0.18" />
          <stop offset="1" stopColor={C.ember} stopOpacity="0" />
        </radialGradient>
        <pattern id={`dots-${id}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={C.line2} />
        </pattern>
      </defs>
      <rect x="0.5" y="0.5" width="519" height="399" rx="20" fill={C.card} stroke={C.line} />
      <rect x="0.5" y="0.5" width="519" height="399" rx="20" fill={`url(#dots-${id})`} opacity="0.35" />
      <rect x="0.5" y="0.5" width="519" height="399" rx="20" fill={`url(#glow-${id})`} />
      {ART[id]()}
    </svg>
  );
}

const Line = ({ x, y, w, c = C.line2, h = 7 }: { x: number; y: number; w: number; c?: string; h?: number }) => <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={c} />;
const Txt = ({ x, y, children, size = 12, fill = C.dim, mono, weight, anchor }: { x: number; y: number; children: React.ReactNode; size?: number; fill?: string; mono?: boolean; weight?: number; anchor?: "start" | "middle" | "end" }) => (
  <text x={x} y={y} fontSize={size} fill={fill} fontFamily={mono ? MONO : SANS} fontWeight={weight} textAnchor={anchor}>
    {children}
  </text>
);
const Stars = ({ x, y, n = 5, size = 11 }: { x: number; y: number; n?: number; size?: number }) => (
  <g>
    {Array.from({ length: n }, (_, i) => (
      <path key={i} transform={`translate(${x + i * (size + 3)} ${y}) scale(${size / 24})`} d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.5l7.1-.6z" fill={C.ember} />
    ))}
  </g>
);

const ART: Record<ArtId, () => React.ReactNode> = {
  seo: () => (
    <g>
      <rect x="36" y="34" width="448" height="44" rx="22" fill={C.card2} stroke={C.line2} />
      <circle cx="62" cy="56" r="8" fill="none" stroke={C.dim} strokeWidth="2" />
      <path d="M68 62l6 6" stroke={C.dim} strokeWidth="2" strokeLinecap="round" />
      <Txt x={84} y={61} size={14} fill={C.bone}>seo specialist in india</Txt>
      {[0, 1, 2, 3].map((i) => {
        const y = 100 + i * 66;
        const top = i === 0;
        return (
          <g key={i}>
            <rect x="36" y={y} width="330" height="54" rx="12" fill={top ? "rgba(255,90,31,0.08)" : C.card2} stroke={top ? C.ember : C.line} />
            <Txt x={52} y={y + 22} size={11} fill={top ? C.soft : C.mute} mono>{top ? "yourbusiness.in" : ["competitor.com", "directory.in", "blog.example"][i - 1]}</Txt>
            <Line x={52} y={y + 32} w={top ? 230 : 180 - i * 18} c={top ? C.bone : C.line2} h={8} />
            {top && (
              <g>
                <rect x="318" y={y + 13} width="36" height="28" rx="8" fill={C.ember} />
                <Txt x={336} y={y + 32} size={13} fill={C.ink} weight={800} anchor="middle">#1</Txt>
              </g>
            )}
          </g>
        );
      })}
      <path d="M352 318 C 392 300, 392 150, 352 128" fill="none" stroke={C.ember} strokeWidth="2" strokeDasharray="4 6" className="art-dash" />
      <path d="M346 136l6-9 6 9" fill="none" stroke={C.ember} strokeWidth="2" strokeLinecap="round" />
      <rect x="392" y="100" width="92" height="252" rx="12" fill={C.card2} stroke={C.line} />
      <Txt x={404} y={122} size={10} mono>CLICKS</Txt>
      <polyline points="404,330 420,318 436,322 452,290 468,262 476,214" fill="none" stroke={C.ember} strokeWidth="3" strokeLinejoin="round" className="art-draw" />
      <circle cx="476" cy="214" r="5" fill={C.ember} className="art-pulse" />
      <Txt x={404} y={160} size={22} fill={C.bone} weight={700}>+120%</Txt>
      <Txt x={404} y={178} size={9} mono>~3 MONTHS</Txt>
    </g>
  ),

  digital: () => {
    const nodes = [
      { a: -90, l: "SEO" },
      { a: -30, l: "Maps" },
      { a: 30, l: "Google Ads" },
      { a: 90, l: "Meta Ads" },
      { a: 150, l: "AI search" },
      { a: 210, l: "Email" },
    ];
    const cx = 260, cy = 186, r = 126;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line2} strokeDasharray="3 7" />
        <circle cx={cx} cy={cy} r={r - 50} fill="none" stroke={C.line} />
        {nodes.map((n) => {
          const x = cx + r * Math.cos((n.a * Math.PI) / 180);
          const y = cy + r * Math.sin((n.a * Math.PI) / 180);
          return <line key={`l${n.l}`} x1={cx} y1={cy} x2={x} y2={y} stroke={C.line2} strokeWidth="1.5" />;
        })}
        {nodes.map((n, i) => {
          const x = cx + r * Math.cos((n.a * Math.PI) / 180);
          const y = cy + r * Math.sin((n.a * Math.PI) / 180);
          const w = n.l.length * 8 + 26;
          return (
            <g key={n.l}>
              <rect x={x - w / 2} y={y - 17} width={w} height="34" rx="17" fill={i === 0 ? C.ember : C.card2} stroke={i === 0 ? C.ember : C.line2} />
              <Txt x={x} y={y + 5} size={13} fill={i === 0 ? C.ink : C.bone} weight={600} anchor="middle">{n.l}</Txt>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="52" fill={C.card2} stroke={C.ember} strokeWidth="2" />
        <circle cx={cx} cy={cy} r="62" fill="none" stroke={C.ember} strokeOpacity="0.35" className="art-pulse-ring" />
        <Txt x={cx} y={cy - 4} size={13} fill={C.bone} weight={700} anchor="middle">Your</Txt>
        <Txt x={cx} y={cy + 14} size={13} fill={C.bone} weight={700} anchor="middle">business</Txt>
        <rect x="36" y="350" width="448" height="30" rx="15" fill={C.card2} stroke={C.line} />
        <Txt x={52} y={369} size={11} mono>ONE PLAN · ONE REPORT · LEADS BY CHANNEL</Txt>
      </g>
    );
  },

  technical: () => (
    <g>
      <rect x="215" y="34" width="90" height="38" rx="10" fill={C.ember} />
      <Txt x={260} y={58} size={14} fill={C.ink} weight={800} anchor="middle" mono>/</Txt>
      {[
        { x: 70, l: "/services" },
        { x: 260, l: "/blog" },
        { x: 450, l: "/locations" },
      ].map((n, i) => (
        <g key={n.l}>
          <path d={`M260 72 C 260 98, ${n.x} 92, ${n.x} 118`} fill="none" stroke={C.line2} strokeWidth="1.5" />
          <rect x={n.x - 58} y="118" width="116" height="34" rx="9" fill={C.card2} stroke={C.line2} />
          <Txt x={n.x} y={140} size={12} fill={C.bone} anchor="middle" mono>{n.l}</Txt>
          {[0, 1].map((j) => (
            <g key={j}>
              <path d={`M${n.x} 152 L ${n.x - 30 + j * 60} 182`} stroke={C.line2} strokeWidth="1.2" />
              <rect x={n.x - 52 + j * 60} y="182" width="44" height="26" rx="6" fill={C.card2} stroke={i === 2 && j === 1 ? C.ember : C.line} />
              <Line x={n.x - 44 + j * 60} y={192} w={28} c={i === 2 && j === 1 ? C.ember : C.line2} h={6} />
            </g>
          ))}
        </g>
      ))}
      <path d="M260 72 C 300 100, 420 90, 450 118 L 478 182" fill="none" stroke={C.ember} strokeWidth="2" strokeDasharray="4 6" className="art-dash" />
      <circle cx="478" cy="182" r="5" fill={C.ember} className="art-pulse" />
      {[
        { x: 36, code: "200", label: "OK", c: C.good },
        { x: 132, code: "301", label: "Redirect", c: C.soft },
        { x: 252, code: "404", label: "Fixed", c: C.ember },
      ].map((s) => (
        <g key={s.code}>
          <rect x={s.x} y="244" width={s.code === "301" ? 110 : 106} height="34" rx="17" fill={C.card2} stroke={C.line2} />
          <circle cx={s.x + 18} cy="261" r="5" fill={s.c} />
          <Txt x={s.x + 30} y={265} size={12} fill={C.bone} mono>{s.code}</Txt>
          <Txt x={s.x + 60} y={265} size={11}>{s.label}</Txt>
        </g>
      ))}
      <rect x="36" y="298" width="300" height="70" rx="12" fill={C.card2} stroke={C.line} />
      <Txt x={52} y={322} size={10} mono>CORE WEB VITALS</Txt>
      {[
        { x: 52, l: "LCP", v: "1.8s" },
        { x: 146, l: "INP", v: "120ms" },
        { x: 250, l: "CLS", v: "0.02" },
      ].map((m) => (
        <g key={m.l}>
          <Txt x={m.x} y={352} size={18} fill={C.bone} weight={700}>{m.v}</Txt>
          <Txt x={m.x + (m.v.length > 4 ? 64 : 44)} y={352} size={10} fill={C.good} mono>{m.l}</Txt>
        </g>
      ))}
      <rect x="356" y="244" width="128" height="124" rx="12" fill={C.card2} stroke={C.line} />
      <Txt x={372} y={268} size={10} mono>schema.org</Txt>
      {["Organization", "Service", "FAQPage", "Breadcrumb"].map((t, i) => (
        <g key={t}>
          <circle cx="378" cy={290 + i * 20} r="4" fill={C.good} />
          <Txt x={390} y={294 + i * 20} size={11} fill={C.bone}>{t}</Txt>
        </g>
      ))}
    </g>
  ),

  local: () => (
    <g>
      <rect x="36" y="34" width="448" height="200" rx="14" fill={C.card2} stroke={C.line} />
      <g stroke={C.line2} strokeWidth="1">
        {[70, 110, 150, 190].map((y) => <line key={y} x1="36" y1={y} x2="484" y2={y} />)}
        {[110, 200, 290, 380].map((x) => <line key={x} x1={x} y1="34" x2={x} y2="234" />)}
      </g>
      <path d="M36 200 C 160 170, 260 120, 484 70" stroke={C.line2} strokeWidth="9" fill="none" opacity="0.7" />
      <rect x="300" y="150" width="70" height="44" rx="10" fill="rgba(127,214,164,0.12)" />
      {[
        [120, 92],
        [205, 176],
        [410, 120],
      ].map(([x, y]) => (
        <path key={`${x}`} transform={`translate(${x - 9} ${y - 22})`} d="M9 0C4 0 0 4 0 9c0 7 9 15 9 15s9-8 9-15c0-5-4-9-9-9z" fill={C.mute} />
      ))}
      <circle cx="268" cy="118" r="26" fill={C.ember} opacity="0.18" className="art-pulse-ring" />
      <path transform="translate(254 78)" d="M14 0C6 0 0 6 0 14c0 11 14 26 14 26s14-15 14-26C28 6 22 0 14 0z" fill={C.ember} />
      <circle cx="268" cy="92" r="5" fill={C.ink} />
      {[0, 1, 2].map((i) => {
        const y = 248 + i * 42;
        const top = i === 0;
        return (
          <g key={i}>
            <rect x="36" y={y} width="448" height="36" rx="10" fill={top ? "rgba(255,90,31,0.08)" : C.card2} stroke={top ? C.ember : C.line} />
            <Txt x={52} y={y + 15} size={12} fill={top ? C.bone : C.dim} weight={top ? 700 : 400}>{top ? "Your Clinic · Ahmedabad" : i === 1 ? "Competitor A" : "Competitor B"}</Txt>
            {top ? <Stars x={52} y={y + 21} size={9} /> : <Line x={52} y={y + 22} w={90 - i * 10} h={6} />}
            {top && <Txt x={124} y={y + 30} size={10} fill={C.soft} mono>Open now · 2.1 km</Txt>}
            {top && (
              <g>
                <rect x="400" y={y + 8} width="70" height="20" rx="10" fill={C.ember} />
                <Txt x={435} y={y + 22} size={11} fill={C.ink} weight={700} anchor="middle">Call</Txt>
              </g>
            )}
          </g>
        );
      })}
    </g>
  ),

  geo: () => (
    <g>
      <rect x="36" y="30" width="448" height="340" rx="16" fill={C.card2} stroke={C.line} />
      <rect x="196" y="52" width="268" height="40" rx="20" fill={C.line} />
      <Txt x={214} y={77} size={13} fill={C.bone}>Best physiotherapist in Pune?</Txt>
      <path transform="translate(58 118)" d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill={C.ember} className="art-twinkle" />
      <Txt x={88} y={134} size={11} mono>AI ANSWER</Txt>
      <Line x={58} y={152} w={360} />
      <Line x={58} y={168} w={300} />
      <g>
        <Line x={58} y={190} w={70} />
        <rect x="136" y="183" width="118" height="22" rx="11" fill="rgba(255,90,31,0.14)" stroke={C.ember} />
        <Txt x={195} y={198} size={12} fill={C.bone} weight={700} anchor="middle">YourClinic</Txt>
        <Line x={262} y={190} w={140} />
      </g>
      <Line x={58} y={214} w={330} />
      <Line x={58} y={230} w={250} />
      <Txt x={58} y={268} size={10} mono>SOURCES</Txt>
      {[
        { x: 58, l: "yourclinic.in", on: true },
        { x: 190, l: "google.com/maps" },
        { x: 336, l: "practo.com" },
      ].map((s, i) => (
        <g key={s.l}>
          <rect x={s.x} y="280" width={s.l.length * 7.4 + 34} height="30" rx="15" fill={s.on ? C.ember : C.card} stroke={s.on ? C.ember : C.line2} />
          <Txt x={s.x + 14} y={299} size={11} fill={s.on ? C.ink : C.dim} weight={s.on ? 700 : 400} mono>{`${i + 1} ${s.l}`}</Txt>
        </g>
      ))}
      <rect x="58" y="326" width="404" height="28" rx="14" fill={C.card} stroke={C.line2} />
      <Txt x={74} y={344} size={11} fill={C.mute}>Ask a follow-up…</Txt>
    </g>
  ),

  aeo: () => (
    <g>
      <rect x="36" y="34" width="372" height="44" rx="22" fill={C.card2} stroke={C.line2} />
      <Txt x={58} y={61} size={14} fill={C.bone}>how long does seo take?</Txt>
      <rect x="36" y="94" width="372" height="122" rx="14" fill="rgba(255,90,31,0.07)" stroke={C.ember} />
      <Txt x={54} y={118} size={10} fill={C.soft} mono>FEATURED ANSWER · yourbusiness.in</Txt>
      <Line x={54} y={134} w={300} c={C.bone} h={9} />
      <Line x={54} y={152} w={250} c={C.bone} h={9} />
      <Line x={54} y={174} w={320} />
      <Line x={54} y={190} w={210} />
      <Txt x={36} y={246} size={10} mono>PEOPLE ALSO ASK</Txt>
      {["Is SEO worth it for small business?", "What does an SEO specialist do?", "How much does SEO cost in India?"].map((q, i) => (
        <g key={q}>
          <rect x="36" y={258 + i * 40} width="372" height="32" rx="8" fill={C.card2} stroke={C.line} />
          <Txt x={50} y={278 + i * 40} size={12} fill={C.bone}>{q}</Txt>
          <path d={`M386 ${270 + i * 40}l5 5 5-5`} stroke={C.dim} strokeWidth="1.6" fill="none" />
        </g>
      ))}
      <circle cx="456" cy="140" r="30" fill={C.card2} stroke={C.ember} strokeWidth="2" />
      <rect x="449" y="124" width="14" height="22" rx="7" fill={C.ember} />
      <path d="M443 140c0 7 6 12 13 12s13-5 13-12M456 152v8" stroke={C.ember} strokeWidth="2" fill="none" />
      <g className="art-wave">
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={432 + i * 11} y={200 - [8, 18, 28, 16, 10][i] / 2} width="5" height={[8, 18, 28, 16, 10][i]} rx="2.5" fill={i === 2 ? C.ember : C.dim} />
        ))}
      </g>
      <Txt x={456} y={238} size={10} mono anchor="middle">VOICE</Txt>
    </g>
  ),

  "google-ads": () => (
    <g>
      <rect x="36" y="34" width="448" height="44" rx="22" fill={C.card2} stroke={C.line2} />
      <Txt x={58} y={61} size={14} fill={C.bone}>dentist in ahmedabad</Txt>
      <rect x="36" y="94" width="448" height="128" rx="14" fill={C.card2} stroke={C.ember} />
      <Txt x={54} y={120} size={11} fill={C.bone} weight={700}>Sponsored</Txt>
      <Txt x={54} y={138} size={11} fill={C.mute} mono>yourclinic.in/implants</Txt>
      <Txt x={54} y={164} size={17} fill={C.soft} weight={600}>Dental Implants in Ahmedabad | Book a Free Consult</Txt>
      <Line x={54} y={176} w={360} />
      {["Our Doctors", "Prices", "Reviews", "Call now"].map((s, i) => (
        <g key={s}>
          <rect x={54 + i * 100} y="192" width="90" height="20" rx="10" fill={C.card} stroke={C.line2} />
          <Txt x={99 + i * 100} y={206} size={10} fill={C.bone} anchor="middle">{s}</Txt>
        </g>
      ))}
      {[
        { x: 36, l: "AVG CTR", v: "4–7%" },
        { x: 190, l: "AVG CPC", v: "$0.8–1.5" },
        { x: 344, l: "CONV. RATE", v: "5–8%" },
      ].map((m) => (
        <g key={m.l}>
          <rect x={m.x} y="238" width="140" height="56" rx="12" fill={C.card2} stroke={C.line} />
          <Txt x={m.x + 14} y={258} size={10} mono>{m.l}</Txt>
          <Txt x={m.x + 14} y={283} size={20} fill={C.bone} weight={700}>{m.v}</Txt>
        </g>
      ))}
      <g className="art-bars">
        {[28, 36, 32, 46, 52, 60, 66].map((h, i) => (
          <rect key={i} x={36 + i * 66} y={366 - h} width="44" height={h} rx="6" fill={i === 6 ? C.ember : C.line2} />
        ))}
      </g>
      <Txt x={484} y={316} size={10} mono anchor="end">LEADS / WEEK</Txt>
    </g>
  ),

  "meta-ads": () => (
    <g>
      <rect x="176" y="22" width="168" height="356" rx="26" fill={C.ink} stroke={C.line2} strokeWidth="2" />
      <rect x="236" y="32" width="48" height="6" rx="3" fill={C.line2} />
      <circle cx="200" cy="62" r="10" fill={C.ember} />
      <Txt x={216} y={60} size={10} fill={C.bone} weight={700}>yourstudio</Txt>
      <Txt x={216} y={73} size={9} fill={C.mute}>Sponsored</Txt>
      <rect x="186" y="86" width="148" height="160" rx="6" fill={C.card2} />
      <circle cx="260" cy="158" r="48" fill={C.ember} opacity="0.85" />
      <circle cx="292" cy="128" r="22" fill={C.soft} opacity="0.6" />
      <rect x="206" y="196" width="108" height="34" rx="8" fill={C.bone} opacity="0.9" />
      <Txt x={260} y={218} size={11} fill={C.ink} weight={800} anchor="middle">20% OFF</Txt>
      <rect x="186" y="254" width="148" height="30" rx="6" fill={C.ember} />
      <Txt x={260} y={274} size={12} fill={C.ink} weight={800} anchor="middle">Book now</Txt>
      <path d="M196 300c0-5 7-7 8-1 1-6 8-4 8 1 0 5-8 9-8 9s-8-4-8-9z" fill={C.ember} className="art-pulse" />
      <circle cx="232" cy="304" r="7" fill="none" stroke={C.dim} strokeWidth="1.6" />
      <Line x={196} y={322} w={110} h={6} />
      <Line x={196} y={336} w={80} h={6} />
      {[
        { x: 28, y: 92, l: "Ahmedabad +25 km" },
        { x: 28, y: 152, l: "Age 25–44" },
        { x: 28, y: 212, l: "Interest: skincare" },
        { x: 360, y: 120, l: "Lookalike 1%" },
        { x: 360, y: 180, l: "Site visitors" },
      ].map((c) => (
        <g key={c.l}>
          <rect x={c.x} y={c.y} width="132" height="30" rx="15" fill={C.card2} stroke={C.line2} />
          <circle cx={c.x + 16} cy={c.y + 15} r="4" fill={C.ember} />
          <Txt x={c.x + 26} y={c.y + 19} size={11} fill={C.bone}>{c.l}</Txt>
        </g>
      ))}
      <rect x="360" y="246" width="132" height="70" rx="12" fill={C.card2} stroke={C.line} />
      <Txt x={374} y={268} size={10} mono>COST PER LEAD</Txt>
      <Txt x={374} y={298} size={22} fill={C.bone} weight={700}>$3–8</Txt>
    </g>
  ),

  web: () => (
    <g>
      <rect x="36" y="30" width="448" height="300" rx="14" fill={C.card2} stroke={C.line2} />
      <rect x="36" y="30" width="448" height="36" rx="14" fill={C.line} />
      <rect x="36" y="52" width="448" height="14" fill={C.line} />
      {[56, 74, 92].map((x, i) => <circle key={x} cx={x} cy="48" r="5" fill={i === 0 ? C.ember : C.line2} />)}
      <rect x="120" y="38" width="240" height="20" rx="10" fill={C.card} />
      <Txt x={240} y={52} size={10} fill={C.dim} mono anchor="middle">https://yourbusiness.in</Txt>
      <Line x={56} y={84} w={60} c={C.bone} h={8} />
      {[0, 1, 2].map((i) => <Line key={i} x={300 + i * 52} y={85} w={40} h={6} />)}
      <rect x="56" y="108" width="408" height="96" rx="10" fill={C.card} stroke={C.line} />
      <Line x={76} y={130} w={220} c={C.bone} h={14} />
      <Line x={76} y={154} w={170} c={C.bone} h={14} />
      <rect x="76" y="176" width="92" height="18" rx="9" fill={C.ember} />
      <circle cx="390" cy="156" r="34" fill={C.ember} opacity="0.2" />
      <circle cx="390" cy="156" r="20" fill={C.ember} opacity="0.5" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={56 + i * 140} y="218" width="128" height="94" rx="10" fill={C.card} stroke={C.line} />
          <rect x={68 + i * 140} y="230" width="28" height="28" rx="7" fill={i === 1 ? C.ember : C.line2} />
          <Line x={68 + i * 140} y={270} w={90} c={C.bone} h={7} />
          <Line x={68 + i * 140} y={284} w={70} h={6} />
        </g>
      ))}
      <rect x="24" y="270" width="206" height="104" rx="12" fill={C.ink} stroke={C.line2} />
      <Txt x={40} y={296} size={11} fill={C.soft} mono>{"<title>Dentist in Pune</title>"}</Txt>
      <Txt x={40} y={316} size={11} fill={C.dim} mono>{"<h1>Painless implants</h1>"}</Txt>
      <Txt x={40} y={336} size={11} fill={C.dim} mono>{'<link rel="canonical">'}</Txt>
      <Txt x={40} y={356} size={11} fill={C.good} mono>{"✓ schema · sitemap"}</Txt>
      <circle cx="430" cy="320" r="46" fill={C.ink} stroke={C.line2} strokeWidth="2" />
      <circle cx="430" cy="320" r="38" fill="none" stroke={C.line} strokeWidth="7" />
      <circle cx="430" cy="320" r="38" fill="none" stroke={C.good} strokeWidth="7" strokeDasharray="234 239" strokeLinecap="round" transform="rotate(-90 430 320)" className="art-draw" />
      <Txt x={430} y={328} size={24} fill={C.bone} weight={800} anchor="middle">98</Txt>
      <Txt x={430} y={384} size={10} mono anchor="middle">PERFORMANCE</Txt>
    </g>
  ),
};
