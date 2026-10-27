# 🌿 EcoTíquet - Sistema de Gestión de Eventos Ecológicos

Bienvenido a la documentación de **EcoTíquet**, una plataforma diseñada para la creación, gestión y reserva de tickets para eventos enfocados en la sostenibilidad y el medio ambiente.

## 📖 Guía de la Aplicación

EcoTíquet es una aplicación web robusta que conecta a organizadores de eventos (Agentes), supervisores (Administradores) y asistentes (Clientes) en un ecosistema centrado en el medio ambiente.

### 🔌 Conexión con Supabase
La aplicación utiliza **Supabase** como Backend-as-a-Service (BaaS), lo que permite una integración fluida y en tiempo real:
- **Autenticación**: Gestión de sesiones, registro y login mediante `supabase.auth`.
- **Base de Datos**: Almacenamiento relacional de eventos, perfiles de usuario y reservas.
- **Seguridad (RLS)**: Se implementan *Row Level Security* policies para asegurar que, por ejemplo, un Agente solo pueda editar sus propios eventos.
- **Lógica del Servidor**: Uso de funciones RPC (Remote Procedure Calls) para operaciones complejas y seguras (como el borrado de usuarios por administradores).

### ⚙️ ¿Cómo funciona el código? (Arquitectura)

El proyecto sigue una arquitectura modular basada en React y Vite:

#### 1. Capa de Servicio (`src/services/ecoTicketService.ts`)
Es el **cerebro de la aplicación**. En lugar de hacer llamadas a la base de datos en cada componente, todo se centraliza aquí. 
- **CRUD de Eventos**: Funciones para crear, leer, actualizar y eliminar eventos.
- **Sistema de Reservas**: Lógica para validar la capacidad del evento antes de permitir una reserva y gestionar el flujo de estados (`SOLICITADA` $\rightarrow$ `CONFIRMADA` $\rightarrow$ `PAGADA`).
- **Gestión de Asientos**: Lógica avanzada para manejar planos de asientos y categorías de precios.

#### 2. Capa de Interfaz (`src/pages/` y `src/components/`)
- **Páginas**: Vistas completas como el catálogo de eventos, el panel de administración y el flujo de reserva.
- **Componentes**: Elementos reutilizables como la `Navbar` (que adapta sus opciones según el rol del usuario) y las `EventCards`.

#### 3. Utilidades y Tipado (`src/utils/` y `src/types/`)
- **Fechas**: Manejo centralizado de horarios y formatos AM/PM para evitar inconsistencias regionales.
- **TypeScript**: Definiciones estrictas de interfaces para `Event`, `Profile` y `Reservation`, asegurando que los datos que fluyen desde Supabase sean siempre correctos.

---

## 🛡️ Roles de Usuario

| Rol | Capacidades Principales |
| :--- | :--- |
| **CLIENTE** | Buscar eventos, elegir asientos, reservar tickets y gestionar su carrito de compras. |
| **AGENTE** | Crear, editar y eliminar sus propios eventos; gestionar el estado de las reservas. |
| **ADMINISTRADOR** | Acceso a reportes globales, gestión de perfiles de usuario y supervisión total del sistema. |

## 🚀 Guía de Implementaciones Recientes

### 1. Gestión Avanzada de Eventos (Panel del Agente)
El panel del agente permite el control total sobre el ciclo de vida de un evento.
- **Edición Dedicada**: Migración a `/edit-event/:id` para mayor claridad.
- **Borrado Seguro**: Eliminación de eventos con limpieza previa de reservas asociadas para mantener la integridad de la base de datos.
- **Formateo de Tiempo**: Transformación de formato 24h a 12h (AM/PM) mediante `formatTime12h`.

---

## 🛠️ Instalación y Ejecución

1. **Instalar dependencias**:
   ```bash
   pnpm install
   ```
2. **Ejecutar en modo desarrollo**:
   ```bash
   pnpm run dev
   ```
3. **Acceso**: Abrir el navegador en `http://localhost:5173`.
