"use client";

import { Clock, FolderOpen, Mail, MoreHorizontal, Pencil, Phone, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClientStatus, ClientWithRelations } from "@/lib/types";
import { cn, formatDueDate } from "@/lib/utils";
import { parseISO, isPast, isToday } from "date-fns";

interface ClientCardProps {
  client: ClientWithRelations;
  onEdit: (client: ClientWithRelations) => void;
  onDelete: (id: string) => void;
}

const STATUS_BAR_COLOR: Record<ClientStatus, string> = {
  prospecto: "bg-zinc-400",
  contactado: "bg-blue-400",
  en_negociacion: "bg-yellow-400",
  propuesta_enviada: "bg-indigo-400",
  cerrado: "bg-emerald-400",
  perdido: "bg-red-400",
};

const STATUS_BADGE_COLOR: Record<ClientStatus, string> = {
  prospecto: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  contactado: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  en_negociacion: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  propuesta_enviada: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  cerrado: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  perdido: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_LABEL: Record<ClientStatus, string> = {
  prospecto: "Prospecto",
  contactado: "Contactado",
  en_negociacion: "En negociación",
  propuesta_enviada: "Propuesta enviada",
  cerrado: "Cerrado",
  perdido: "Perdido",
};

const ACTION_TYPE_LABEL: Record<string, string> = {
  llamada: "Llamada",
  reunion: "Reunión",
  entrega: "Entrega",
  seguimiento: "Seguimiento",
  propuesta: "Propuesta",
  otro: "Otro",
};

function isActionOverdue(dateStr: string, status: ClientStatus): boolean {
  if (status === "cerrado" || status === "perdido") return false;
  const date = parseISO(dateStr);
  return isPast(date) && !isToday(date);
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const hasContactInfo = client.contact_name || client.email || client.phone;
  const hasNextAction = !!client.next_action_date;
  const actionOverdue = hasNextAction
    ? isActionOverdue(client.next_action_date!, client.status)
    : false;

  return (
    <div className="group relative bg-card border border-border rounded-xl hover:border-border/80 hover:shadow-sm transition-all duration-150 overflow-hidden">
      {/* Status color bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px] rounded-r-none",
          STATUS_BAR_COLOR[client.status]
        )}
      />

      <div className="pl-4 pr-4 pt-4 pb-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-medium text-foreground leading-snug flex-1">
            {client.name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0 border",
                STATUS_BADGE_COLOR[client.status]
              )}
            >
              {STATUS_LABEL[client.status]}
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
              <DropdownMenuContent align="end" className="w-44">
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

        {/* Contact info row */}
        {hasContactInfo && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2.5">
            {client.contact_name && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate">{client.contact_name}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                <Phone className="w-3 h-3 shrink-0" />
                <span className="truncate">{client.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Next action row */}
        {hasNextAction && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs mb-2",
              actionOverdue ? "text-red-400" : "text-muted-foreground"
            )}
          >
            <Clock className="w-3 h-3 shrink-0" />
            {client.next_action_type && (
              <span className="font-medium">
                {ACTION_TYPE_LABEL[client.next_action_type]}
              </span>
            )}
            <span>{formatDueDate(client.next_action_date)}</span>
          </div>
        )}

        {/* Linked project */}
        {client.project && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <FolderOpen className="w-3 h-3 shrink-0" />
            <span className="truncate">{client.project.name}</span>
          </div>
        )}

        {/* Requirements */}
        {client.requirements && (
          <p className="text-xs text-muted-foreground italic mb-1.5 line-clamp-1">
            {client.requirements.length > 60
              ? client.requirements.slice(0, 60) + "..."
              : client.requirements}
          </p>
        )}

        {/* Notes */}
        {client.notes && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {client.notes.length > 60
              ? client.notes.slice(0, 60) + "..."
              : client.notes}
          </p>
        )}
      </div>
    </div>
  );
}
