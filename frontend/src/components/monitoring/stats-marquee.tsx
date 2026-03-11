"use client";

import { Marquee } from "@/components/ui/marquee";

interface StatItem {
  label: string;
  value: string;
}

interface StatsMarqueeProps {
  stats: StatItem[];
}

function StatPill({ label, value }: StatItem) {
  return (
    <div className="glass-card flex items-center gap-2 rounded-full px-4 py-1.5 whitespace-nowrap">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xs font-semibold text-accent-cyan">{value}</span>
    </div>
  );
}

export function StatsMarquee({ stats }: StatsMarqueeProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/50 bg-inset/50">
      <Marquee pauseOnHover className="py-2 [--duration:30s]">
        {stats.map((stat) => (
          <StatPill key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </Marquee>
    </div>
  );
}
