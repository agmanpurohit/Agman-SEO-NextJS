"use client";

import { useEffect, useState } from "react";

/** Live local time for a city. Rendered client-side only to avoid hydration mismatches. */
export function LocalTime({ timeZone, className }: { timeZone: string; className?: string }) {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" });
    const update = () => setTime(fmt.format(new Date()));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [timeZone]);
  return (
    <span className={className} suppressHydrationWarning>
      {time ? `${time} local` : " "}
    </span>
  );
}
