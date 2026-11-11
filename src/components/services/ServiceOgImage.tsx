import { ImageResponse } from "next/og";
import { logo_mark } from "@/components/brand/logo-paths";

/** 1200×630 share card for service pages: brand mark, market label, page title, service list. */
export function serviceOgImage({ eyebrow, title, line, chips }: { eyebrow: string; title: string; line: string; chips: string[] }) {
  const [, , vw, vh] = logo_mark.viewBox.split(" ").map(Number);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0a0a0b", color: "#ece8e1", padding: 64, position: "relative" }}>
        <div style={{ position: "absolute", right: -160, top: -160, width: 620, height: 620, borderRadius: 620, background: "radial-gradient(circle, rgba(255,90,31,0.28) 0%, rgba(255,90,31,0) 65%)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <svg width={84} height={(84 * vh) / vw} viewBox={logo_mark.viewBox}>
            <path d={logo_mark.light} fill="#ece8e1" fillRule="evenodd" />
            <path d={logo_mark.accent} fill="#ff5a1f" fillRule="evenodd" />
          </svg>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#ff5a1f" }}>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: title.length > 34 ? 70 : 84, fontWeight: 800, lineHeight: 0.98, letterSpacing: -2.5, maxWidth: 1000 }}>{title}</div>
          <div style={{ marginTop: 26, fontSize: 28, color: "#aca79e", maxWidth: 980, lineHeight: 1.3 }}>{line}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {chips.slice(0, 4).map((c, i) => (
              <div key={c} style={{ display: "flex", padding: "10px 20px", borderRadius: 40, border: `2px solid ${i === 0 ? "#ff5a1f" : "#3a3a40"}`, fontSize: 20, color: i === 0 ? "#ff5a1f" : "#ece8e1" }}>
                {c}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#7d786f" }}>agmanrajpurohit.com</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
