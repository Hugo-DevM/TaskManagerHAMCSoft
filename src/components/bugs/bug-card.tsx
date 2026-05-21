"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BugWithRelations, BugStatus } from "@/lib/types";
import {
  cn,
  BUG_SEVERITY_CONFIG,
  BUG_STATUS_CONFIG,
  BUG_STATUS_ORDER,
  getInitials,
} from "@/lib/utils";

interface BugCardProps {
  bug: BugWithRelations;
  onUpdate: (id: string, status: BugStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (bug: BugWithRelations) => void;
}

const SEVERITY_LEFT_BAR: Record<string, string> = {
  Crítico: "bg-red-500",
  Alto: "bg-orange-500",
  Medio: "bg-yellow-500",
  Bajo: "bg-blue-500",
};

export function BugCard({ bug, onUpdate, onDelete, onEdit }: BugCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const severityConfig = BUG_SEVERITY_CONFIG[bug.severity];
  const statusConfig = BUG_STATUS_CONFIG[bug.status];
  const isResolved = bug.status === "Resuelto";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("bugId", bug.id);
        e.dataTransfer.setData("bugStatus", bug.status);
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        "group relative bg-card border rounded-xl p-4 hover:border-border/80 transition-all duration-150 cursor-grab active:cursor-grabbing",
        isResolved
          ? "opacity-60 border-border/40"
          : "border-border hover:shadow-sm",
        isDragging && "opacity-40 scale-95"
      )}
    >
      {/* Severity indicator bar */}
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full",
          SEVERITY_LEFT_BAR[bug.severity]
        )}
      />

      <div className="pl-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className={cn(
              "text-sm font-medium text-foreground leading-snug flex-1",
              isResolved && "line-through text-muted-foreground"
            )}
          >
            {bug.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => onEdit(bug)}>
                <Pencil className="w-3.5 h-3.5 mr-2" />
                Editar bug
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  Mover a...
                </p>
                {BUG_STATUS_ORDER.filter((s) => s !== bug.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdate(bug.id, s)}
                    className="flex items-center gap-2 w-full px-1 py-1 text-xs rounded hover:bg-accent text-foreground"
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        BUG_STATUS_CONFIG[s].color
                          .replace("text-", "bg-")
                          .split(" ")[0]
                      )}
                    />
                    {s}
                  </button>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(bug.id)}
                className="text-red-400 focus:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {bug.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {bug.description}
          </p>
        )}

        {/* Badges row */}
        <div className="flex items-center flex-wrap gap-1.5 mb-3">
          <Badge
            className={cn("text-xs px-1.5 py-0 border", severityConfig.bgColor)}
            variant="outline"
          >
            {bug.severity}
          </Badge>
          <Badge
            className={cn("text-xs px-1.5 py-0 border", statusConfig.bgColor)}
            variant="outline"
          >
            {bug.status}
          </Badge>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2">
          {/* System name */}
          {bug.system_name ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
              <Monitor className="w-3 h-3 shrink-0" />
              <span className="truncate">{bug.system_name}</span>
            </div>
          ) : (
            <div />
          )}

          {/* Assignee */}
          {bug.assignee && (
            <Avatar
              className="w-5 h-5 shrink-0"
              title={bug.assignee.full_name ?? bug.assignee.email}
            >
              <AvatarImage src={bug.assignee.avatar_url ?? undefined} />
              <AvatarFallback className="text-[9px] bg-indigo-600/20 text-indigo-400">
                {getInitials(bug.assignee.full_name, bug.assignee.email)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
