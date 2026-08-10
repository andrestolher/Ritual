# Ritual

Plataforma multiusuario para construir hábitos mediante identidad, sistemas y encadenamiento de rutinas. El proyecto contiene una API Express/Prisma y un cliente React/Vite responsive.

## Requisitos

- Node.js 20 o superior
- PostgreSQL 14 o superior
- Un proyecto OAuth 2.0 de Google

## Configuración

1. Copia `.env.example` a `.env` y completa sus valores.
2. Crea una base de datos PostgreSQL llamada `habits` y ajusta `DATABASE_URL` si es necesario.
3. En Google Cloud Console crea credenciales de tipo **OAuth client ID** para una aplicación web.
4. Agrega `http://localhost:4000/auth/google/callback` como URI de redirección autorizada y asigna el ID y secreto a `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
5. Instala las dependencias y aplica la migración:

```bash
npm install
npm run db:generate
npm run db:migrate
```

6. Inicia API y cliente juntos:

```bash
npm run dev
```

Abre `http://localhost:5173`. La API queda en `http://localhost:4000`.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | URL de conexión de PostgreSQL para Prisma. |
| `SESSION_SECRET` | Secreto largo y aleatorio para firmar las sesiones. |
| `GOOGLE_CLIENT_ID` | ID de cliente OAuth de Google. |
| `GOOGLE_CLIENT_SECRET` | Secreto OAuth de Google. |
| `GOOGLE_CALLBACK_URL` | Callback de OAuth, por defecto `http://localhost:4000/auth/google/callback`. |
| `CLIENT_URL` | Origen del cliente permitido por CORS, por defecto `http://localhost:5173`. |
| `PORT` | Puerto de la API, por defecto `4000`. |

## Estructura

- `server/src`: API, Passport, controladores, rutas, esquema Prisma y frases diarias.
- `server/src/prisma/migrations`: migración inicial lista para aplicar.
- `client/src`: dashboard React, componentes UI y vista de detalle con Recharts.

`completed: true` representa cumplimiento tanto para hábitos de construir como para hábitos de evitar: por ejemplo, en "no comer azúcar" significa que no se consumió azúcar ese día.
