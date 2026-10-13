# Eco Ticket

Aplicación web para consultar eventos, solicitar reservas y gestionar pagos de
entradas. Está construida con React, TypeScript, Vite, React Router y Bootstrap.

## Requisitos

- Node.js 20.19+ o 22.12+.
- pnpm. Si no está habilitado, ejecuta `corepack enable`.

## Instalación y ejecución

```bash
pnpm install
pnpm run dev
```

Vite mostrará la URL local, normalmente `http://localhost:5173`.

## Cuentas de demostración

| Perfil        | Usuario     | Contraseña |
| ------------- | ----------- | ----------- |
| Cliente       | `cliente` | `1234`    |
| Agente        | `agente`  | `1234`    |
| Administrador | `admin`   | `1234`    |

## Funcionalidades por perfil

### Cliente

- Consultar y filtrar los eventos disponibles.
- Solicitar una reserva desde las tarjetas de eventos.
- Consultar sus reservas y el estado de cada una en `/mis_tickets`.
- Cuando el Agente confirma una reserva, agregarla al carrito, quitarla o
  continuar con el pago desde `/carrito`.
- Consultar el total y confirmar el pago simulado. La reserva cambia a estado
  `PAGADA` y se elimina del carrito.

### Agente

- Registrar eventos con nombre, ciudad, categoría, fecha, precio, imagen y
  descripción.
- Consultar los eventos registrados.
- Consultar las reservas solicitadas y cambiar su estado a `SOLICITADA`,
  `CONFIRMADA` o `RECHAZADA`.
- Las reservas pagadas aparecen como estado final y no se pueden modificar.

### Administrador

- Consultar estadísticas sobre eventos, precios, ciudades y reservas.
- Revisar gráficas de eventos por ciudad y reservas por estado.
- Consultar las tablas de eventos y reservas.

## Estados de reserva

`SOLICITADA` → el Cliente pidió la reserva. El Agente puede confirmarla o
rechazarla. Una reserva `CONFIRMADA` puede agregarse al carrito y pagarse;
después queda como `PAGADA`.

## Persistencia y pagos

Los eventos, las reservas y el carrito se guardan en `localStorage` del
navegador. Los datos no se comparten entre navegadores o dispositivos y no hay
un backend conectado. El checkout es una simulación local: no procesa cargos
reales ni almacena información financiera.

## Comandos

```bash
pnpm run dev      # Inicia el servidor de desarrollo
pnpm run build    # Comprueba TypeScript y genera la versión de producción
pnpm run lint     # Ejecuta ESLint
pnpm run preview  # Sirve localmente la compilación de producción
```

## Estructura principal

```text
src/
├── auth/        # Sesión y perfiles de demostración
├── components/  # Componentes compartidos y reportes
├── hooks/       # Acceso reactivo a los datos locales
├── pages/       # Vistas de Cliente, Agente, Administrador y carrito
├── routes/      # Rutas y control de acceso por perfil
├── services/    # Persistencia de eventos, reservas y carrito
└── types/       # Tipos compartidos
```

## Verific

```bash
pnpm run lint
pnpm run build
```
