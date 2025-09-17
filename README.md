# Nevados CRM · Fase 2

Mini CRM móvil-first construido con Next.js + Supabase. Esta fase incorpora persistencia real, autenticación OTP, RLS por organización/equipo, tiempo real y adjuntos privados.

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Datos**: Supabase (Postgres + Auth + Realtime + Storage)
- **Estado**: TanStack Query, Zustand (UI), server actions para mutaciones
- **Validación**: zod + react-hook-form
- **Íconos / utilidades**: lucide-react, date-fns, sonner
- **Tests**: Vitest (unidad) + Playwright (e2e)

## Requisitos previos

1. Node.js 18+
2. Supabase CLI (`brew install supabase/tap/supabase` o `npm install -g supabase`)
3. Proyecto Supabase provisionado (o Supabase local con Docker)
4. Variables de entorno configuradas (ver `.env.example`)

## Configuración

1. Copia `.env.example` a `.env.local` y completa:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_JWT_SECRET=...
   ```
   > **Nota**: el service role key solo se usa en acciones de servidor y utilidades de pruebas.

2. Aplica las migraciones de la fase 2:
   ```bash
   supabase link --project-ref <project-ref>  # solo la primera vez
   supabase db push
   ```
   Esto crea tablas (`organizations`, `profiles`, `teams`, `accounts`, `leads`, `opportunities`, `activities`, `attachments`…), enums, triggers y políticas RLS.

3. Verifica que el bucket privado `crm-attachments` exista (la migración lo crea) y que las políticas estén activas.

4. Instala dependencias e inicia el dev server:
   ```bash
   npm install
   npm run dev
   ```

## Autenticación

- Accesos sólo por invitación del admin. Desde `/admin` se envía una invitación por correo.
- El enlace recibido lleva a `/auth/reset-password`, donde el usuario define su primera contraseña.
- En `/login` existen dos modalidades: contraseña (signInWithPassword) y enlace mágico opcional.
- Recuperar contraseña desde el propio `/login` (`resetPasswordForEmail`) también enlaza a `/auth/reset-password`.
- Middleware (`middleware.ts`) protege rutas; si no hay sesión se redirige a `/login` respetando el `redirect` original.

## Datos y RLS

- Todas las tablas tienen Row Level Security habilitado.
- Funciones helper (`app.is_admin`, `app.current_org`, `app.has_team_access`) restringen operaciones a la organización y equipo del usuario.
- Servidor usa server actions para mutaciones críticas con checks adicionales y revalidación de rutas (leads, actividades, oportunidades, adjuntos).
- Realtime: los hooks de leads, actividades y oportunidades se suscriben a cambios por `org_id`, invalidando caches de TanStack Query.

## Adjuntos

- Bucket privado `crm-attachments` con políticas que exigen rutas `{org_id}/...`.
- El UI (Lead detail) sube archivos desde el navegador mediante Supabase Storage y registra metadatos en la tabla `attachments`.
- Las descargas se realizan vía signed URLs temporales (5 minutos).

## Scripts & pruebas

| Acción | Comando |
| --- | --- |
| Linter / typecheck | `npm run lint` (ESLint) |
| Tests unitarios | `npm run test` |
| Tests E2E (Playwright) | `npm run test:e2e` |

### Playwright

Los tests E2E requieren un proyecto Supabase accesible y las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) cargadas al ejecutar `npm run test:e2e`. El flujo automatiza:

1. Generación de usuario vía service role.
2. Login mediante magic link (`/auth/callback`).
3. Creación de lead (sheet lateral).
4. Registro y cierre de actividad en el timeline del lead.
5. Subida de un adjunto y verificación de acceso.
6. Drag & drop de una oportunidad en el tablero Kanban.

> Los tests limpian los datos creados (leads, cuentas, oportunidades, adjuntos y usuario) después de cada ejecución.

## Despliegue (Vercel + Supabase)

1. Configura los mismos valores de `.env.local` en Variables de entorno de Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`).
2. Ejecuta las migraciones en el proyecto Supabase de producción (`supabase db push`).
3. Verifica que el bucket `crm-attachments` exista y que Storage tenga las políticas declaradas en la migración.
4. Conecta el repositorio en Vercel y despliega.

## Estructura relevante

```
app/
  (auth)/login          → login con contraseña + OTP opcional
  auth/reset-password   → pantalla para definir/actualizar contraseña (desde enlaces de invitación o recovery)
  (app)/layout          → obtiene sesión/perfil y monta AppShell
  (app)/actions         → server actions (leads, actividades, oportunidades, adjuntos)
components/
  attachments/          → lista & uploader de adjuntos
  leads/                → listado, detalle, sheet de lead
  opportunities/        → tablero Kanban con dnd-kit
  accounts/             → tabla y diálogo para crear cuentas
  contacts/             → tabla y diálogo para crear contactos
hooks/
  use-*/                → TanStack Query + realtime Supabase
lib/
  auth/                 → contextos de sesión
  supabase/             → clientes browser/server/admin y tipos generados
supabase/migrations/    → esquema SQL + RLS + triggers + storage policies
```

- El tablero de oportunidades permite crear tarjetas con probabilidad (%) y fecha de cierre; las tablas de cuentas y contactos incluyen formularios rápidos desde la propia vista.

## Próximos pasos sugeridos

- Ampliar gestión de equipos (`teams`/`team_members`) y dashboards por rol.
- Consolidar preferencias de usuario (idioma, notificaciones) enlazando la opción pendiente del menú.
- Automatizar seeds opcionales para demos o ambientes QA.
- Integrar webhooks/automatizaciones (Slack, correo) usando Realtime.
