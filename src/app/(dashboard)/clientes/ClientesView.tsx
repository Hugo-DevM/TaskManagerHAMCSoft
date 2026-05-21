"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ClientCard } from "@/components/clients/client-card";
import { ClientForm } from "@/components/clients/client-form";
import { deleteClient } from "./actions";
import type { ClientStatus, ClientWithRelations, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

type FilterValue = ClientStatus | "todos";
const FILTER_TABS = [
  { value: "todos" as FilterValue, label: "Todos" },
  { value: "prospecto" as FilterValue, label: "Prospecto" },
  { value: "contactado" as FilterValue, label: "Contactado" },
  { value: "en_negociacion" as FilterValue, label: "En negociación" },
  { value: "propuesta_enviada" as FilterValue, label: "Propuesta enviada" },
  { value: "cerrado" as FilterValue, label: "Cerrado" },
  { value: "perdido" as FilterValue, label: "Perdido" },
];
const EMPTY_MESSAGES: Record<FilterValue, string> = {
  todos: "No hay clientes aún. Crea el primero con el botón de arriba.",
  prospecto: "No hay clientes en estado Prospecto.",
  contactado: "No hay clientes en estado Contactado.",
  en_negociacion: "No hay clientes en negociación.",
  propuesta_enviada: "No hay propuestas enviadas pendientes.",
  cerrado: "No hay clientes cerrados.",
  perdido: "No hay clientes perdidos.",
};

type StatColor = "zinc" | "indigo" | "emerald" | "red" | "yellow";
const STAT_COLOR_CLASS: Record<StatColor, { bg: string; text: string; value: string }> = {
  zinc: { bg: "bg-zinc-500/10 border-zinc-500/20", text: "text-zinc-400", value: "text-zinc-300" },
  indigo: { bg: "bg-indigo-500/10 border-indigo-500/20", text: "text-indigo-400", value: "text-indigo-300" },
  emerald: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", value: "text-emerald-300" },
  red: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", value: "text-red-300" },
  yellow: { bg: "bg-yellow-500/10 border-yellow-500/20", text: "text-yellow-400", value: "text-yellow-300" },
};

function StatCard({ label, value, color }: { label: string; value: number; color: StatColor }) {
  const c = STAT_COLOR_CLASS[color];
  return (
    <div className={cn("flex flex-col items-center justify-center px-5 py-3 rounded-xl border min-w-[110px]", c.bg)}>
      <span className={cn("text-2xl font-bold leading-none", c.value)}>{value}</span>
      <span className={cn("text-xs mt-1", c.text)}>{label}</span>
    </div>
  );
}

interface ClientesViewProps {
  clients: ClientWithRelations[];
  projects: Project[];
  userId: string;
}

export function ClientesView({ clients, projects, userId }: ClientesViewProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("todos");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientWithRelations | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const stats = useMemo(() => {
    const total = clients.length;
    const enConversacion = clients.filter((c) =>
      ["contactado", "en_negociacion", "propuesta_enviada"].includes(c.status)
    ).length;
    const cerrados = clients.filter((c) => c.status === "cerrado").length;
    const perdidos = clients.filter((c) => c.status === "perdido").length;
    const accionesHoy = clients.filter(
      (c) => c.next_action_date === today && c.status !== "cerrado" && c.status !== "perdido"
    ).length;
    return { total, enConversacion, cerrados, perdidos, accionesHoy };
  }, [clients, today]);

  const filteredClients = useMemo(() => {
    if (activeFilter === "todos") return clients;
    return clients.filter((c) => c.status === activeFilter);
  }, [clients, activeFilter]);

  const handleEdit = (client: ClientWithRelations) => {
    setEditClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteClient(id);
    router.refresh();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditClient(null);
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Clientes"
        subtitle="Gestión de clientes y pipeline de ventas"
        action={
          <Button
            onClick={() => { setEditClient(null); setIsFormOpen(true); }}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary stats bar */}
        <div className="flex flex-wrap gap-3">
          <StatCard label="Total" value={stats.total} color="zinc" />
          <StatCard label="En conversación" value={stats.enConversacion} color="indigo" />
          <StatCard label="Cerrados" value={stats.cerrados} color="emerald" />
          <StatCard label="Perdidos" value={stats.perdidos} color="red" />
          <StatCard label="Acciones hoy" value={stats.accionesHoy} color="yellow" />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                activeFilter === tab.value
                  ? "bg-indigo-600 text-white"
                  : "bg-accent/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Client grid */}
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-muted-foreground">{EMPTY_MESSAGES[activeFilter]}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <ClientForm
        open={isFormOpen}
        onClose={handleFormClose}
        editClient={editClient}
        projects={projects}
        userId={userId}
      />
    </div>
  );
}
