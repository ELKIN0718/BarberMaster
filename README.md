# BarberMaster 🪒

Plataforma web de comercio electrónico para reservas de barberías.
Proyecto académico - Universidad de Cartagena, Colombia.

## Stack Tecnológico

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla
- **Backend:** Node.js + Express.js
- **Base de datos:** PostgreSQL 16 (Docker)
- **Auth:** JWT + bcryptjs
- **Driver DB:** pg (node-postgres, sin ORM)

## Requisitos

- Node.js 18+
- Docker y Docker Compose
- npm

## Configuración rápida

### Opción A: Todo con Docker (recomendado)

```bash
# Iniciar todos los servicios (PostgreSQL, Backend, pgAdmin)
docker compose up --build

# El schema.sql se ejecuta automáticamente al iniciar PostgreSQL
# Si necesitas resetear la BD, borra el volumen:
# docker compose down -v && docker compose up --build
```

Luego abre la aplicación en:

- **App:**     http://localhost:3000
- **pgAdmin:** http://localhost:5050

### Opción B: Desarrollo local (backend fuera de Docker)

```bash
# 1. Iniciar solo bases de datos
docker compose up -d postgres pgadmin

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Ejecutar schema SQL
docker exec -i barbermaster_db psql -U barbermaster -d barbermaster_db < backend/db/schema.sql

# 4. Iniciar servidor en modo desarrollo
npm run dev
```

Luego abre la aplicación en:

- **App:**     http://localhost:3000
- **pgAdmin:** http://localhost:5050

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@barbermaster.com | admin123 |
| Barbería | barberia@gmail.com | admin123 |

**pgAdmin:** admin@barbermaster.com / admin123

## Flujo de demo completo

Para probar el sistema de principio a fin:

### Como administrador:
1. Ve a http://localhost:3000/#login
2. Inicia sesión con `admin@barbermaster.com` / `admin123`
3. En el panel Admin, crea una cuenta de barbería (o revisa la existente)
4. Gestiona comisiones desde el botón 💰 Comisión

### Como barbería:
1. Cierra sesión del admin
2. Inicia sesión con `barberia@gmail.com` / `admin123`
3. Completa el perfil de la barbería (nombre, dirección, horarios)
4. Crea servicios (corte, barba, etc.)
5. Revisa las reservas entrantes

### Como cliente (sin cuenta):
1. Ve a http://localhost:3000/#barbershops
2. Selecciona una barbería
3. Elige un servicio
4. Selecciona fecha y horario disponible
5. Ingresa tus datos personales
6. En el paso de pago:
   - Usa **cualquier tarjeta que NO empiece con 0000** → Pago exitoso ✅
   - Usa una tarjeta que **empiece con 0000** → Pago rechazado ❌
7. ¡Reserva confirmada! Copia tu código de seguimiento (BM-XXXXXXXX)
8. Ve a http://localhost:3000/#track y pega el código para rastrear

### Estados automáticos:
- **30 min antes** de la cita → estado cambia a "En espera"
- **5 min después** de la cita → estado cambia a "Perdido"
- La barbería puede marcar como **"Completado"** manualmente

## Estructura del proyecto

```
barbermaster/
├── .env                    # Variables de entorno
├── docker-compose.yml      # PostgreSQL + pgAdmin
├── README.md
├── backend/
│   ├── package.json
│   ├── server.js           # Express server + scheduler de estados
│   ├── db/
│   │   ├── pool.js         # Conexión a PostgreSQL
│   │   └── schema.sql      # Schema + seed data
│   ├── middleware/
│   │   └── auth.js         # JWT authentication
│   └── routes/
│       ├── auth.js         # Login / Register
│       ├── barbershops.js   # CRUD barberías + disponibilidad
│       ├── services.js     # CRUD servicios
│       ├── reservations.js # Reservas + pago simulado + tracking
│       └── admin.js        # Admin: stats, gestión barberías
└── frontend/
    └── public/
        ├── index.html      # SPA con hash routing
        ├── favicon.svg
        ├── css/style.css   # Diseño responsive + dark mode
        └── js/
            ├── api.js      # API client
            ├── auth.js     # Auth state management
            ├── router.js   # SPA hash router
            ├── app.js      # App principal + helpers globales
            └── pages/
                ├── home.js              # Landing page
                ├── barbershops.js       # Grid de barberías
                ├── booking.js           # Flujo de 4 pasos
                ├── track.js             # Seguimiento de reservas
                ├── login.js             # Inicio de sesión
                ├── barbershop-dashboard.js  # Panel barbería
                └── admin-dashboard.js       # Panel admin
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar barbería

### Barberías (público)
- `GET /api/barbershops` - Lista barberías activas
- `GET /api/barbershops/:id` - Detalle + servicios
- `GET /api/barbershops/:id/availability?date=YYYY-MM-DD` - Slots disponibles

### Barberías (auth)
- `GET /api/barbershops/me/profile` - Perfil propio
- `POST /api/barbershops/me/profile` - Crear/Actualizar perfil

### Servicios (auth barbería)
- `GET /api/services/my` - Mis servicios
- `POST /api/services` - Crear servicio
- `PUT /api/services/:id` - Actualizar servicio
- `DELETE /api/services/:id` - Eliminar servicio (soft)

### Reservas (público)
- `POST /api/reservations/initiate` - Iniciar reserva
- `POST /api/reservations/:id/pay` - Simular pago
- `GET /api/reservations/track/:code` - Rastrear reserva

### Reservas (auth barbería)
- `GET /api/reservations/barbershop/mine` - Mis reservas
- `PATCH /api/reservations/:id/complete` - Marcar completada

### Admin
- `GET /api/admin/stats` - Estadísticas
- `GET /api/admin/barbershops` - Lista barberías
- `POST /api/admin/barbershops/create-account` - Crear cuenta
- `PATCH /api/admin/barbershops/:id/commission` - Editar comisión
- `PATCH /api/admin/barbershops/:id/toggle` - Activar/Desactivar
- `DELETE /api/admin/barbershops/:id` - Eliminar barbería
- `GET /api/admin/reservations` - Todas las reservas

## Funcionalidades

- ✂️ **Reserva en 4 pasos:** Servicio → Fecha/Hora → Datos → Pago simulado
- 🔍 **Código de seguimiento:** BM-XXXXXXXX para rastrear el estado
- ⏱ **Estados automáticos:** waiting (30min antes) y lost (5min después)
- 💳 **Pago simulado:** Tarjetas 0000 son rechazadas, cualquier otra funciona
- 🌙 **Modo oscuro:** Toggle sol/luna con persistencia
- 📱 **Responsive:** Diseño mobile-first desde 375px
- 🎨 **Skeleton loaders** y estados vacíos en todas las vistas
