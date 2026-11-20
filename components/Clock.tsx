"use client";

import { useEffect, useState } from "react";

const format = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

/** The current time in Kerala. Rendered only after mount to keep hydration stable. */
export default function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(format.format(new Date()));
    tick();
    const timer = window.setInterval(tick, 15000);
    return () => window.clearInterval(timer);
  }, []);

  return <span className="clock">{time ? `${time} IST` : "IST"}</span>;
}
