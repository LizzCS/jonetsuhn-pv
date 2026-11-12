"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  delay?: number; // ms
  className?: string;
};

type Phase = "below" | "shown" | "above";

export default function Reveal({ children, delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("below");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPhase("shown");
        else setPhase(entry.boundingClientRect.top < 0 ? "above" : "below");
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: phase === "shown" ? `${delay}ms` : "0ms" }}
      className={`reveal reveal-${phase} ${className}`}
    >
      {children}
    </div>
  );
}