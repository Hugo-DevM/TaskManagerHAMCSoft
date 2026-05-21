# Vistas de Proyectos y Clientes — V2 (Reestructurada)

> Última actualización: 2026-05-21 · Migración V2 aplicada

---

## Separación de dominio

| Módulo    | Función                                       |
|-----------|-----------------------------------------------|
| Clientes  | CRM ligero · Pipeline comercial · Seguimiento |
| Proyectos | Producción · Ejecución técnica · Entregables  |

La relación de datos cambió de:

```
clients.project_id → projects   (1 cliente, 1 proyecto)
```

a:

```
projects.client_id → clients    (1 cliente, N proyectos)
```

---

## Estructura de archivos

```
src/
├── app/(dashboard)/
│   ├── projects/
│   │   ├── page.tsx                  # Server Component
│   │   ├── ProjectsView.tsx          # Client Component + filtros
│   │   ├── actions.ts                # CRUD + activities + files
│   │   └── [id]/
│   │       ├── page.tsx              # Server Component (detalle)
│   │       └── ProjectDetailView.tsx # Tabs: Overview/Tasks/Bugs/Timeline/Files/Deploy
│   └── clientes/
│       ├── page.tsx                  # Server Component
│       ├── ClientesView.tsx          # Client Component + stats + pipeline
│       ├── actions.ts                # CRUD + activities + documents
│       └── [id]/
│           ├── page.tsx              # Server Component (detalle)
│           └── ClientDetailView.tsx  # Tabs: Resumen/Actividad/Proyectos/Docs/Notas
├── components/
│   ├── projects/
│   │   ├── project-card.tsx          # Card con stripe de color, deadline, client
│   │   └── project-form.tsx          # Formulario completo (URLs, fechas, presupuesto)
│   └── clients/
│       ├── client-card.tsx           # CRM card con pipeline status y valor
│       └── client-form.tsx           # Formulario CRM (lead source, service interest)
└── hooks/
    ├── use-projects.ts               # Realtime + stats + client relation
    ├── use-clients.ts                # Realtime con nuevo schema
    ├── use-client-activities.ts      # Realtime por client_id
    └── use-project-activities.ts     # Realtime por project_id
```

---

## Migración SQL

**Archivo:** `supabase/migration_v2_restructure.sql`

**Ejecutar en Supabase SQL Editor.**

### Cambios en `clients`

| Columna nueva        | Tipo            | Descripción              |
|----------------------|-----------------|--------------------------|
| `company_name`       | TEXT NOT NULL   | Nombre principal (era `name`) |
| `whatsapp`           | TEXT            | Número WhatsApp          |
| `website`            | TEXT            | Sitio web                |
| `industry`           | TEXT            | Rubro / industria        |
| `estimated_value`    | DECIMAL(12,2)   | Valor estimado del deal  |
| `service_interest`   | TEXT            | Servicio de interés      |
| `lead_source`        | TEXT            | Origen del lead          |
| `priority`           | TEXT            | low / medium / high      |
| `last_contact_at`    | TIMESTAMPTZ     | Último contacto          |

**Statuses migrados:**
- `cerrado` → `cerrado_ganado`
- `perdido` → `cerrado_perdido`

**Nuevos statuses:** `reunion_agendada`, `esperando_respuesta`

### Cambios en `projects`

| Columna nueva      | Tipo           | Descripción              |
|--------------------|----------------|--------------------------|
| `client_id`        | UUID FK        | Cliente dueño del proyecto |
| `type`             | TEXT           | Tipo de proyecto         |
| `priority`         | TEXT           | low / medium / high      |
| `start_date`       | DATE           | Fecha de inicio          |
| `due_date`         | DATE           | Fecha límite             |
| `estimated_hours`  | DECIMAL(8,2)   | Horas estimadas          |
| `tracked_hours`    | DECIMAL(8,2)   | Horas registradas        |
| `budget`           | DECIMAL(12,2)  | Presupuesto              |
| `final_cost`       | DECIMAL(12,2)  | Costo final real         |
| `progress`         | INTEGER 0-100  | Progreso manual          |
| `repository_url`   | TEXT           | URL del repo             |
| `staging_url`      | TEXT           | URL de staging/preview   |
| `production_url`   | TEXT           | URL de producción        |

**Statuses migrados:**
- `activo` → `desarrollo`
- `completado` → `finalizado`
- `archivado` → `finalizado`

**Nuevos statuses:** `planeacion`, `diseno`, `desarrollo`, `testing`, `correcciones`, `deploy`, `mantenimiento`, `finalizado`, `pausado`

### Nuevas tablas

| Tabla                 | Descripción                        |
|-----------------------|------------------------------------|
| `client_activities`   | Timeline comercial del cliente     |
| `client_documents`    | Documentos del cliente             |
| `project_activities`  | Timeline técnico del proyecto      |
| `project_files`       | Archivos del proyecto              |

**También:** `bugs.project_id` agregado para vincular bugs a proyectos.

---

## Modelos TypeScript

### `Client` (nuevo)

```typescript
Client {
  id, company_name, contact_name, email, phone, whatsapp, website, industry,
  status: ClientStatus,       // 8 estados pipeline
  priority: ClientPriority,   // low | medium | high
  estimated_value,
  service_interest: ClientServiceInterest | null,
  lead_source: ClientLeadSource | null,
  next_action_type, next_action_date, next_action_notes,
  last_contact_at, notes,
  created_by, created_at, updated_at
  // legacy: name, project_id, requirements
}
```

### `Project` (nuevo)

```typescript
Project {
  id, client_id, name, description,
  type: ProjectType | null,
  status: ProjectStatus,        // 9 estados producción
  priority: ProjectPriority,    // low | medium | high
  start_date, due_date,
  estimated_hours, tracked_hours, budget, final_cost,
  progress: number,             // 0-100
  repository_url, staging_url, production_url,
  created_by, created_at, updated_at
}
```

### Nuevos tipos de actividad

```typescript
ClientActivityType =
  "nota" | "llamada" | "reunion" | "propuesta_enviada" | "seguimiento" |
  "estado_cambiado" | "proyecto_vinculado" | "documento_agregado" | "otro"

ProjectActivityType =
  "nota" | "deploy" | "bug_resuelto" | "feature_completada" | "estado_cambiado" |
  "cliente_aprobo" | "entrega" | "reunion" | "otro"
```

---

## Vista de Clientes `/clientes`

### Stats dashboard

| Tarjeta         | Criterio                                          |
|-----------------|---------------------------------------------------|
| Total           | Todos los clientes                                |
| En pipeline     | statuses activos (prospecto → esperando_respuesta)|
| Ganados         | `cerrado_ganado`                                  |
| Perdidos        | `cerrado_perdido`                                 |
| Acciones hoy    | `next_action_date == hoy` + status activo         |

**Valor del pipeline:** suma de `estimated_value` de clientes activos.

### Filtros

Tabs: Todos · Activos · Prospecto · Contactado · Reunión · Negociación · Propuesta · Esperando · Ganados · Perdidos

Cada tab muestra conteo dinámico.

### Client Card

- **Barra de color** izquierda según estado pipeline
- **Nombre empresa** + industria
- **Punto de prioridad** (rojo/amarillo/zinc)
- **Badge de estado** con color por etapa
- **Info de contacto:** persona, email, teléfono
- **Valor estimado** (si existe)
- **Cantidad de proyectos** vinculados
- **Próxima acción** con indicador de vencimiento
- **Snippet de notas**
- **"Ver detalle" →** link al detalle del cliente

---

## Vista de Clientes detalle `/clientes/[id]`

### Tabs

| Tab        | Contenido                                          |
|------------|----------------------------------------------------|
| Resumen    | Info empresa, contacto, pipeline, próxima acción   |
| Actividad  | Timeline realtime con formulario de registro       |
| Proyectos  | Cards de proyectos vinculados + crear nuevo        |
| Documentos | Lista de documentos con tipo y URL                 |
| Notas      | Notas internas + requerimientos legacy             |

### Timeline de actividad

- Formulario inline: tipo + mensaje
- Enter o botón "Agregar" para guardar
- Realtime via `useClientActivities(clientId)`
- Botón eliminar (solo propio, hover)

---

## Vista de Proyectos `/projects`

### Filtros

Tabs: Todos · Activos · Planeación · Diseño · Desarrollo · Testing · Correcciones · Deploy · Mantenimiento · Finalizado · Pausado

### Project Card

- **Stripe superior** de color según estado
- **Emoji del tipo** de proyecto
- **Nombre** del proyecto
- **Cliente vinculado** (link)
- **Badge de estado** + punto de prioridad
- **Descripción** (2 líneas)
- **Barra de progreso** (verde al 100%)
- **Conteo de tareas** completadas
- **Fecha límite** (rojo si vencida, amarillo si próxima)

---

## Vista de Proyectos detalle `/projects/[id]`

### Tabs

| Tab      | Contenido                                          |
|----------|----------------------------------------------------|
| Overview | Info general, progreso, stats de tareas, fechas    |
| Tasks    | TaskList filtrado por `project_id`                 |
| Bugs     | Bugs vinculados por `project_id` (open/resolved)   |
| Timeline | Timeline técnico realtime con formulario           |
| Archivos | Gestión de archivos del proyecto                   |
| Deploy   | URLs de repo, staging, producción + estado         |

---

## Server Actions

### Clientes (`clientes/actions.ts`)

- `createClient(input)` — incluye todos los nuevos campos
- `updateClient(input)` — mantiene `name` sincronizado con `company_name`
- `deleteClient(id)`
- `createClientActivity(input)` — registra en timeline
- `deleteClientActivity(id, clientId)`
- `createClientDocument(input)`
- `deleteClientDocument(id, clientId)`

### Proyectos (`projects/actions.ts`)

- `createProject(input)` — incluye `client_id`, URLs, fechas, presupuesto
- `updateProject(input)` — incluye `tracked_hours`, `final_cost`
- `deleteProject(id)`
- `createProjectActivity(input)` — registra en timeline técnico
- `deleteProjectActivity(id, projectId)`
- `createProjectFile(input)`
- `deleteProjectFile(id, projectId)`

---

## Hooks Realtime

| Hook                         | Tabla              | Uso                            |
|------------------------------|--------------------|--------------------------------|
| `useClients()`               | clients            | Lista principal de clientes    |
| `useProjects()`              | projects + tasks   | Lista con stats de tareas      |
| `useClientActivities(id)`    | client_activities  | Timeline de cliente (por ID)   |
| `useProjectActivities(id)`   | project_activities | Timeline de proyecto (por ID)  |

Todos mantienen: debounce 400ms · retry 3x · backoff exponencial · refetch on focus.

---

## Relaciones

```
profiles (1) ──< clients (1) ──< projects (1) ──< tasks
                    │                  │
                    └── client_activities   └── tasks
                    └── client_documents    └── bugs (project_id)
                                           └── project_activities
                                           └── project_files
```

---

## Tech stack

Next.js 16 · Supabase (Postgres + Realtime) · TypeScript 5 · Tailwind CSS · shadcn/ui · Lucide React · date-fns (es)
