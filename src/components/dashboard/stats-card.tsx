import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: "default" | "indigo" | "red" | "yellow" | "emerald" | "purple";
  description?: string;
}

const COLOR_MAP = {
  default: {
    bg: "bg-zinc-500/10",
    icon: "text-zinc-400",
    value: "text-foreground",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    icon: "text-indigo-400",
    value: "text-indigo-400",
  },
  red: {
    bg: "bg-red-500/10",
    icon: "text-red-400",
    value: "text-red-400",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    icon: "text-yellow-400",
    value: "text-yellow-400",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    value: "text-emerald-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    icon: "text-purple-400",
    value: "text-purple-400",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: StatsCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={cn("p-2.5 rounded-lg shrink-0", colors.bg)}>
        <Icon className={cn("w-5 h-5", colors.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium truncate">
          {title}
        </p>
        <p className={cn("text-2xl font-bold mt-0.5", colors.value)}>
          {value}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}
