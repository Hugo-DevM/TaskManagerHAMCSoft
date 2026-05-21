"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ClientCard } from "@/components/clients/client-card";
import { ClientForm } from "@/components/clients/client-form";
import { deleteClient } from "./actions";
import type { Client, ClientStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type FilterValue = ClientStatus | "todos" | "activos";

const FILTER_TABS: { value: FilterValue; label: string }[] = [
  { value: "todos",              label: "Todos" },
  { value: "activos",            label: "Activos" },
  { value: "prospecto",          label: "Prospecto" },
  { value: "contactado",         label: "Contactado" },
  { value: "reunion_agendada",   label: "Reunión" },
  { value: "en_negociacion",     label: "Negociación" },
  { value: "propuesta_enviada",  label: "Propuesta" },
  { value: "esperando_respuesta",label: "Esperando" },
  { value: "cerrado_ganado",     label: "Ganados" },
  { value: "cerrado_perdido",    label: "Perdidos" },
];

const EMPTY_MESSAGES: Record<FilterValue, string> = {
  todos:               "No hay clientes aún. Crea el primero con el botón de arriba.",
  activos:             "No hay clientes activos en el pipeline.",
  prospecto:           "No hay prospectos.",
  contactado:          "No hay clientes contactados.",
  reunion_agendada:    "No hay reuniones agendadas.",
  en_negociacion:      "No hay negociaciones activas.",
  propuesta_enviada:   "No hay propuestas enviadas.",
  esperando_respuesta: "No hay clientes esperando respuesta.",
  cerrado_ganado:      "No hay clientes cerrados ganados.",
  cerrado_perdido:     "No hay clientes cerrados perdidos.",
};

const ACTIVE_STATUSES: ClientStatus[] = [
  "prospecto", "contactado", "reunion_agendada",
  "en_negociacion", "propuesta_enviada", "esperando_respuesta",
];

interface ClientesViewProps {
  clients: Client[];
  userId: string;
}

export function ClientesView({ clients, userId }: ClientesViewProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("todos");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const stats = useMemo(() => {
    const total = clients.length;
    const activos = clients.filter((c) => ACTIVE_STATUSES.includes(c.status)).length;
    const ganados = clients.filter((c) => c.status === "cerrado_ganado").length;
    const perdidos = clients.filter((c) => c.status === "cerrado_perdido").length;
    const accionesHoy = clients.filter(
      (c) =>
        c.next_action_date === today &&
        c.status !== "cerrado_ganado" &&
        c.status !== "cerrado_perdido"
    ).length;
    const valorPipeline = clients
      .filter((c) => ACTIVE_STATUSES.includes(c.status) && c.estimated_value)
      .reduce((sum, c) => sum + (c.estimated_value ?? 0), 0);
    return { total, activos, ganados, perdidos, accionesHoy, valorPipeline };
  }, [clients, today]);

  const filteredClients = useMemo(() => {
    if (activeFilter === "todos") return clients;
    if (activeFilter === "activos") return clients.filter((c) => ACTIVE_STATUSES.includes(c.status));
    return clients.filter((c) => c.status === activeFilter);
  }, [clients, activeFilter]);

  const handleEdit = (client: Client) => {
    setEditClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este cliente? Esta acción no se puede deshacer.")) return;
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
        subtitle="CRM · Pipeline comercial"
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

      <div className="p-6 space-y-5">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Total"
            value={stats.total}
            color="zinc"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="En pipeline"
            value={stats.activos}
            color="indigo"
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Ganados"
            value={stats.ganados}
            color="emerald"
          />
          <StatCard
            icon={<XCircle className="w-4 h-4" />}
            label="Perdidos"
            value={stats.perdidos}
            color="red"
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Acciones hoy"
            value={stats.accionesHoy}
            color="yellow"
          />
        </div>

        {/* Pipeline value if any */}
        {stats.valorPipeline > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm text-emerald-400 font-medium">
              Valor del pipeline activo:&nbsp;
              <span className="font-bold">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                  maximumFractionDigits: 0,
                }).format(stats.valorPipeline)}
              </span>
            </span>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
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
              {tab.value !== "todos" && (
                <span className="ml-1.5 opacity-60">
                  {tab.value === "activos"
                    ? stats.activos
                    : clients.filter((c) => c.status === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-muted-foreground">
              {EMPTY_MESSAGES[activeFilter]}
            </p>
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
        userId={userId}
      />
    </div>
  );
}

// ---- Stat Card ----

type StatColor = "zinc" | "indigo" | "emerald" | "red" | "yellow";

const STAT_COLOR: Record<StatColor, { bg: string; text: string; icon: string }> = {
  zinc:    { bg: "bg-zinc-500/10 border-zinc-500/20",    text: "text-zinc-300",    icon: "text-zinc-400" },
  indigo:  { bg: "bg-indigo-500/10 border-indigo-500/20", text: "text-indigo-300",  icon: "text-indigo-400" },
  emerald: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-300", icon: "text-emerald-400" },
  red:     { bg: "bg-red-500/10 border-red-500/20",      text: "text-red-300",     icon: "text-red-400" },
  yellow:  { bg: "bg-yellow-500/10 border-yellow-500/20", text: "text-yellow-300",  icon: "text-yellow-400" },
};

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: StatColor;
}) {
  const c = STAT_COLOR[color];
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", c.bg)}>
      <div className={cn("shrink-0", c.icon)}>{icon}</div>
      <div>
        <p className={cn("text-xl font-bold leading-none", c.text)}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}
