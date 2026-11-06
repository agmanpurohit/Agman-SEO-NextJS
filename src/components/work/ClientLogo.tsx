import Image from "next/image";
import type { Client } from "@/content/work";

/**
 * A client's logo on the plate it needs (white for dark-on-light marks, ink for light marks).
 * Logos are shown as supplied: never recoloured, cropped or distorted.
 */
export function ClientLogo({ client, className = "", size = "md" }: { client: Client; className?: string; size?: "sm" | "md" | "lg" }) {
  const { logo } = client;
  const h = { sm: "h-12", md: "h-20", lg: "h-28" }[size];
  const pad = { sm: "px-3", md: "px-5", lg: "px-7" }[size];
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden ${h} ${pad} ${logo.plate === "light" ? "bg-white" : "border border-line-2 bg-ink"} ${className}`}
    >
      <Image
        src={logo.src}
        alt={`${client.name} logo`}
        width={logo.w}
        height={logo.h}
        sizes="240px"
        className="h-[62%] w-auto max-w-[min(14rem,100%)] object-contain"
        style={logo.scale ? { transform: `scale(${logo.scale})` } : undefined}
      />
    </span>
  );
}
