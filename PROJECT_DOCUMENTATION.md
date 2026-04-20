# Documentación del Proyecto: SpaceDesk (Plataforma Multi-Tenant de Coworking)

## Resumen Ejecutivo
SpaceDesk es una plataforma web (SaaS) orientada a la gestión de espacios de coworking. Su arquitectura principal es **multi-tenant**, lo que significa que el mismo sistema es utilizado por diferentes organizaciones (o sucursales de coworking), y la información está dividida lógica y estrictamente por organización (`tenant`).

## Arquitectura y Navegación
La estructura de navegación se basa en gran medida en el identificador único (`slug`) de cada tenant.
- Rutas públicas: `/login`, `/register`
- Panel global (SuperAdmin): `/superuser/tenants` (Central de control de los coworkings creados en la app).
- Plataforma de Coworking (Tenant): `/t/:tenantSlug/*`
  - Dashboard
  - Reservas
  - Espacios
  - Miembros
  - Membresías
  - Facturación
  - Configuración de Admins
  - Portal (Vista de autogestión para los clientes/miembros)

## Roles y Permisos (Control de Acceso)
El sistema define 4 niveles principales de roles, estructurados jerárquicamente:

1. **`superuser` (Nivel Global)**: Administrador dueño del SaaS. No pertenece a un tenant en particular. Su función es crear y gestionar organizaciones (Tenants) en la plataforma.
2. **`owner` (Nivel Tenant)**: Dueño del coworking comercial. Tiene acceso absoluto a todas las funciones de su Tenant, incluyendo la creación de otros usuarios administradores y la gestión de la facturación.
3. **`admin` (Nivel Tenant)**: Personal u operador del coworking. Puede gestionar reservas, espacios, miembros y facturación. No tiene acceso a los paneles que son exclusivos del propietario.
4. **`member` (Nivel Tenant)**: Cliente del coworking. Accede a través del portal de su organización (`/t/slug/portal`) para visualizar su consumo, planes y generar confirmaciones o reservas.

## Entidades de Negocio y Esquema de Datos
Actualmente, el sistema simula llamadas a base de datos usando un archivo JSON estático (`mockData.json`). A continuación se define la estructura identificada de la base actual:

### 1. `Tenants` (Organizaciones)
Es la tabla principal que aísla los negocios.
- `id` (PK)
- `slug` (Unique, usado para el `t/:slug`)
- `name` 

### 2. `Users` (Usuarios)
Sistema central de usuarios. Maneja a todos por igual (incluyendo al superuser).
- `id` (PK)
- `tenantId` (FK -> Tenants - `null` si el rol es 'superuser')
- `email`, `password` (reemplazable por `auth.uid` de Supabase Auth)
- `name`
- `role` (Enum: `superuser`, `owner`, `admin`, `member`)

### 3. `Spaces` (Espacios Físicos)
Catálogo de los espacios a rentar.
- `id` (PK)
- `tenantId` (FK -> Tenants)
- `name` 
- `type` (Enum: `meeting_room`, `desk`, `office`)
- `capacity`
- `pricing`
- `status` (Enum: `active`, `inactive`)

### 4. `Plans` (Planes de Negocio)
Modelos de suscripción/tarifas que vende el coworking.
- `id` (PK)
- `tenantId` (FK -> Tenants)
- `name` 
- `pricing`
- `roomCredits`
- `accessHours`

### 5. `Memberships` (Suscripciones Activas)
Relación entre un usuario miembro y el plan que ha comprado.
- `id` (PK)
- `userId` (FK -> Users)
- `planId` (FK -> Plans)
- `status` (Enum: `active`, `expired`, `suspended`)
- `startDate`
- `endDate`

### 6. `Reservations` (Reservas)
Historial y registro de la utilización de espacios.
- `id` (PK)
- `tenantId` (FK -> Tenants)
- `userId` (FK -> Users)
- `spaceId` (FK -> Spaces)
- `date`, `startTime`, `endTime`
- `status` (Enum: `confirmed`, `cancelled`)

### 7. `Invoices` (Facturas / Cobros)
Gestión de cobros por consumo de servicios.
- `id` (PK)
- `tenantId` (FK -> Tenants)
- `userId` (FK -> Users)
- `amount` 
- `status` (Enum: `paid`, `pending`, `overdue`)
- `date`
- `dueDate`

---
> [!IMPORTANT]
> **Seguridad y RLS en Supabase**
> Dado que todos los usuarios co-existen en la misma db lógica, la piedra angular de esta migración será **Row Level Security (RLS)**. Cualquier política generada deberá evaluar automáticamente el rol del usuario autenticado (extraído mediante Claims JWT o tablas anexas) para asegurar explícitamente que no exista fuga de información entre Tenants (mediante el `tenant_id`).
