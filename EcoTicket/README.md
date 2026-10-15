# 🌿 EcoTíquet - Sistema de Gestión de Eventos Ecológicos

Bienvenido a la documentación de **EcoTíquet**, una plataforma diseñada para la creación, gestión y reserva de tickets para eventos enfocados en la sostenibilidad y el medio ambiente.

## 🚀 Guía de Implementaciones Recientes (Tutorial)

A continuación, se detallan paso a paso las funcionalidades implementadas recientemente, diseñadas para mejorar la experiencia del Agente y el Administrador.

### 1. Gestión Avanzada de Eventos (Panel del Agente)

El panel del agente ha sido evolucionado para permitir no solo la creación, sino también el control total sobre el ciclo de vida de un evento.

#### A. Edición de Eventos (Página Dedicada)

Se ha migrado la edición de eventos de un modo "inline" a una página independiente para evitar errores y mejorar la claridad.

- **Flujo**: `Panel Agente` $\rightarrow$ `Icono Lápiz` $\rightarrow$ `/edit-event/:id`.
- **Componente**: `src/pages/EditEvent.tsx`.
- **Funcionamiento**:
  1. Al entrar, la página usa el ID de la URL para recuperar los datos del evento mediante la nueva función `getEventById`.
  2. El formulario se pre-rellena con los datos actuales.
  3. Al guardar, se llama a `updateEvent` y el usuario es redirigido al panel principal.

#### B. Eliminación de Eventos

Tanto el Agente como el Administrador pueden ahora eliminar eventos erróneos o cancelados.

- **Acción**: Botón de papelera ($\text{bi-trash}$) en la tabla de eventos.
- **Seguridad**: Se implementó un diálogo de confirmación (`window.confirm`) para evitar borrados accidentales.
- **Lógica de Base de Datos**: El servicio elimina primero todas las reservas asociadas al evento para evitar errores de integridad referencial (Foreign Key) antes de borrar el evento.

#### C. Formato de Horas AM/PM

Para mejorar la lectura de los horarios, se implementó un formateador de tiempo.

- **Utilidad**: `formatTime12h` en `src/utils/date.ts`.
- **Resultado**: Las horas que en base de datos se guardan como `14:30` ahora se muestran en la interfaz como `2:30 PM`.

---

## 🛠️ Arquitectura del Proyecto

### 📁 Estructura de Componentes y Páginas

#### 📄 Páginas (`src/pages/`)

- `Home.tsx`: Portada pública con buscador y eventos destacados.
- `Eventos.tsx`: Catálogo completo de eventos disponibles para el cliente.
- `Login.tsx` / `RegisterEcoTiquet.tsx`: Gestión de acceso y registro de usuarios.
- `Mis_tickets.tsx`: Panel del cliente para ver sus reservas.
- `Carrito.tsx`: Gestión de reservas confirmadas pendientes de pago.
- `Agente.tsx`: Panel de control para agentes (creación, edición y borrado de eventos).
- `EditEvent.tsx`: Página dedicada a la modificación de detalles de un evento existente.
- `Admin.tsx`: Panel de alta jerarquía para reportes y gestión de usuarios.

#### 🧩 Componentes (`src/components/`)

- `Navbar.tsx`: Navegación inteligente que cambia según el rol del usuario (Cliente, Agente, Admin).
- `AdminReports.tsx`: Módulo de analítica con gráficas de barras y circulares sobre eventos y reservas.
- `Slider.tsx`: Carrusel de imágenes destacadas en la página de inicio.
- `Buscador.tsx`: Filtros avanzados por ciudad, categoría y fecha.
- `EventCards.tsx`: Renderizado de la lista de eventos en formato de tarjetas.

#### ⚙️ Servicios y Utilidades

- `src/services/ecoTicketService.ts`: El corazón de la aplicación. Maneja toda la comunicación con **Supabase** (CRUD de eventos, reservas y perfiles).
- `src/utils/date.ts`: Lógica centralizada para el manejo de fechas y horas en la zona horaria de Colombia.
- `src/routes/Routes.tsx`: Configuración de rutas protegidas mediante `RoleRoute`, asegurando que solo usuarios autorizados accedan a paneles administrativos.

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

## 🛡️ Roles de Usuario

- **CLIENTE**: Puede buscar eventos, reservar tickets y gestionar su carrito.
- **AGENTE**: Puede crear, editar y eliminar eventos, además de gestionar el estado de las reservas.
- **ADMINISTRADOR**: Tiene acceso a reportes globales del sistema y gestión de cuentas de usuario.
