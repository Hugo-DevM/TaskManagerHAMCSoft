"use client";

import Link from "next/link";
import {
  Clock,
  ExternalLink,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  User,
  Building2,
  TrendingUp,
  FolderKanban,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Client } from "@/lib/types";
import {
  cn,
  formatDueDate,
  formatCurrency,
  CLIENT_STATUS_CONFIG,
  CLIENT_PRIORITY_CONFIG,
  CLIENT_ACTION_TYPE_LABEL,
  isDateOverdue,
} from "@/lib/utils";

interface ClientCardProps {
  client: Client & { project_count?: number };
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const statusCfg = CLIENT_STATUS_CONFIG[client.status];
  const priorityCfg = CLIENT_PRIORITY_CONFIG[client.priority ?? "medium"];
  const hasNextAction = !!client.next_action_date;
  const actionOverdue =
    hasNextAction &&
    isDateOverdue(client.next_action_date) &&
    client.status !== "cerrado_ganado" &&
    client.status !== "cerrado_perdido";

  const isClosed =
    client.status === "cerrado_ganado" || client.status === "cerrado_perdido";

  return (
    <div className="group relative bg-card border border-border rounded-xl hover:border-border/60 hover:shadow-md transition-all duration-150 overflow-hidden">
      {/* Status color bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", statusCfg.barColor)} />

      <div className="pl-4 pr-3 pt-3.5 pb-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex-1 min-w-0">
            <Link
              href={`/clientes/${client.id}`}
              className="text-sm font-semibold text-foreground hover:text-indigo-400 transition-colors leading-snug block truncate"
            >
              {client.company_name ?? client.name}
            </Link>
            {client.industry && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{client.industry}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Priority dot */}
            <div
              className={cn("w-2 h-2 rounded-full shrink-0", priorityCfg.dotColor)}
              title={`Prioridad ${priorityCfg.label}`}
            />
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 border whitespace-nowrap", statusCfg.bgColor)}
            >
              {statusCfg.label}
            </Badge>
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
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/clientes/${client.id}`} className="flex items-center">
                    <ExternalLink className="w-3.5 h-3.5 mr-2" />
                    Ver detalle
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(client)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Editar cliente
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(client.id)}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2.5">
          {client.contact_name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate">{client.contact_name}</span>
            </div>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground min-w-0 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate">{client.email}</span>
            </a>
          )}
          {client.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
              <Phone className="w-3 h-3 shrink-0" />
              <span className="truncate">{client.phone}</span>
            </div>
          )}
        </div>

        {/* Mid row: value + projects */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          {client.estimated_value != null && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="font-medium text-emerald-400">
                {formatCurrency(client.estimated_value)}
              </span>
            </div>
          )}
          {(client.project_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <FolderKanban className="w-3 h-3 shrink-0" />
              <span>
                {client.project_count}{" "}
                {client.project_count === 1 ? "proyecto" : "proyectos"}
              </span>
            </div>
          )}
        </div>

        {/* Next action */}
        {hasNextAction && !isClosed && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs",
              actionOverdue ? "text-red-400" : "text-muted-foreground"
            )}
          >
            <Clock className="w-3 h-3 shrink-0" />
            {client.next_action_type && (
              <span className="font-medium">
                {CLIENT_ACTION_TYPE_LABEL[client.next_action_type]}
              </span>
            )}
            <span>{formatDueDate(client.next_action_date)}</span>
            {actionOverdue && (
              <span className="font-medium">· Vencida</span>
            )}
          </div>
        )}

        {/* Notes snippet */}
        {client.notes && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1.5 italic">
            {client.notes.slice(0, 70)}
            {client.notes.length > 70 ? "..." : ""}
          </p>
        )}

        {/* Footer: Ver detalle */}
        <div className="flex items-center justify-end mt-2.5 pt-2.5 border-t border-border/40">
          <Link
            href={`/clientes/${client.id}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-indigo-400 transition-colors"
          >
            Ver detalle
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
