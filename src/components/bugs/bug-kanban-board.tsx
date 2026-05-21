"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BugCard } from "./bug-card";
import { BugForm } from "./bug-form";
import { updateBug, deleteBug } from "@/app/(dashboard)/bugs/actions";
import type { BugWithRelations, BugStatus, Profile } from "@/lib/types";
import { BUG_STATUS_CONFIG, BUG_STATUS_ORDER, cn } from "@/lib/utils";

const COLUMN_COLORS: Record<BugStatus, string> = {
  Reportado: "border-t-zinc-500",
  "En análisis": "border-t-blue-500",
  "En corrección": "border-t-orange-500",
  "En pruebas": "border-t-purple-500",
  Resuelto: "border-t-emerald-500",
};

interface BugKanbanBoardProps {
  bugs: BugWithRelations[];
  profiles: Profile[];
  userId: string;
}

export function BugKanbanBoard({ bugs, profiles, userId }: BugKanbanBoardProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editBug, setEditBug] = useState<BugWithRelations | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<BugStatus>("Reportado");
  const [dragOverStatus, setDragOverStatus] = useState<BugStatus | null>(null);
  const [expandedColumns, setExpandedColumns] = useState<Set<BugStatus>>(new Set());

  const VISIBLE_LIMIT = 5;

  const toggleColumn = (status: BugStatus) => {
    setExpandedColumns((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  const bugsByStatus = BUG_STATUS_ORDER.reduce<Record<BugStatus, BugWithRelations[]>>(
    (acc, status) => {
      acc[status] = bugs.filter((b) => b.status === status);
      return acc;
    },
    { Reportado: [], "En análisis": [], "En corrección": [], "En pruebas": [], Resuelto: [] }
  );

  const handleStatusUpdate = async (id: string, status: BugStatus) => {
    await updateBug({ id, status });
    router.refresh();
  };

  const handleDragOver = (e: React.DragEvent, status: BugStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: BugStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const bugId = e.dataTransfer.getData("bugId");
    const currentStatus = e.dataTransfer.getData("bugStatus") as BugStatus;
    if (bugId && currentStatus !== targetStatus) {
      await handleStatusUpdate(bugId, targetStatus);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar este bug?")) {
      await deleteBug(id);
      router.refresh();
    }
  };

  const handleEdit = (bug: BugWithRelations) => {
    setEditBug(bug);
    setIsFormOpen(true);
  };

  const handleAddToColumn = (status: BugStatus) => {
    setEditBug(null);
    setDefaultStatus(status);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 h-full">
        {BUG_STATUS_ORDER.map((status) => {
          const columnBugs = bugsByStatus[status];
          const config = BUG_STATUS_CONFIG[status];
          const isExpanded = expandedColumns.has(status);
          const hasMore = columnBugs.length > VISIBLE_LIMIT;
          const visibleBugs = hasMore && !isExpanded ? columnBugs.slice(0, VISIBLE_LIMIT) : columnBugs;
          const hiddenCount = columnBugs.length - VISIBLE_LIMIT;

          return (
            <div
              key={status}
              className="flex flex-col min-h-0"
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-t-xl bg-card border border-border border-t-2",
                  COLUMN_COLORS[status]
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{status}</span>
                  <Badge variant="outline" className={cn("text-xs border", config.bgColor)}>
                    {columnBugs.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => handleAddToColumn(status)}
                  title={`Reportar bug en ${status}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div
                className={cn(
                  "border border-t-0 rounded-b-xl p-2 space-y-2 min-h-[200px] transition-colors duration-150",
                  dragOverStatus === status
                    ? "bg-accent/50 border-orange-500/40"
                    : "bg-accent/20 border-border"
                )}
              >
                {columnBugs.length === 0 ? (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                    Sin bugs
                  </div>
                ) : (
                  <>
                    {visibleBugs.map((bug) => (
                      <BugCard
                        key={bug.id}
                        bug={bug}
                        onUpdate={handleStatusUpdate}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                      />
                    ))}
                    {hasMore && (
                      <button
                        onClick={() => toggleColumn(status)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <><ChevronUp className="w-3.5 h-3.5" />Ver menos</>
                        ) : (
                          <><ChevronDown className="w-3.5 h-3.5" />Ver {hiddenCount} más</>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BugForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditBug(null);
        }}
        editBug={editBug}
        defaultStatus={defaultStatus}
        profiles={profiles}
        userId={userId}
      />
    </>
  );
}
