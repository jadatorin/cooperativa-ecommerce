# Cooperativa E-commerce

E-commerce completo para Cooperativa 5 de Julio con NestJS y Next.js.

## 🏗️ Arquitectura

- **Frontend**: Next.js 16 + Tailwind v4 + shadcn/ui • Lazy loading • Bundle analyzer
- **Backend**: NestJS 10 • Redis • Monitoring • 16 DB indexes
- **Database**: Supabase (PostgreSQL 16) • Realtime • Storage
- **Cache**: Redis (con fallback in-memory)

## ⚡ Performance

| Métrica | Estado |
|---|---|
| Bundle inicial | ~941 KB (Next.js 16 + React 19) |
| Lazy loading | 7 páginas optimizadas |
| Índices DB | 16 índices creados |
| Endpoints | Monitoreados con `/api/health` |

### Scripts disponibles

```bash
# Development
cd backend; npm run start:dev    # API en http://localhost:3000
cd frontend; npm run dev        # Frontend en http://localhost:5173

# Performance
cd frontend; npm run analyze    # Análisis de bundle (abre en navegador)

# Tests
cd backend; npm run test        # Jest tests
cd frontend; npm run test       # Vitest tests
```

## 🐋 Con Docker (recomendado para producción)

```bash
# 1. Levantar Redis + Backend + Frontend
docker compose up -d

# 2. O configurar Redis manualmente
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Backend con Redis

```bash
# 1. Copiar variables de entorno
cd backend
cp .env.example .env

# 2. Agregar Redis (opcional - funciona sin él)
REDIS_URL=redis://localhost:6379

# 3. Instalar y correr
npm install
npm run start:dev
```

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind v4, shadcn/ui |
| **Backend** | NestJS 10, TypeScript, ioredis |
| **Database** | Supabase (PostgreSQL 16) |
| **Cache** | Redis (opcional, fallback in-memory) |
| **Testing** | Vitest + React Testing Library (frontend) • Jest + Supertest (backend) |

## 📡 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil (auth requerido)
- `POST /api/auth/refresh` - Refresh token

### Productos
- `GET /api/products` - Listado (paginado, filtrable)
- `GET /api/products/:id` - Por ID
- `GET /api/products/barcode/:barcode` - Por código
- `POST /api/products` - Crear (admin)
- `PUT /api/products/:id` - Actualizar (admin)
- `DELETE /api/products/:id` - Eliminar (superadmin)

### Carrito (auth)
- `GET /api/cart` - Obtener carrito
- `POST /api/cart/items` - Agregar ítem
- `DELETE /api/cart` - Vaciar carrito

### Órdenes (auth)
- `POST /api/orders` - Crear pedido
- `GET /api/orders` - Mis órdenes
- `GET /api/orders/:id` - Detalle

### Favoritos (auth)
- `GET /api/favorites` - Lista
- `POST /api/favorites/:productId` - Agregar
- `DELETE /api/favorites/:productId` - Remover

### Tasa de Dólar
- `GET /api/dollar-rate` - Tasa actual
- `GET /api/dollar-rate/history` - Histórico
- `POST /api/dollar-rate` - Actualizar (admin)

### Health Check
- `GET /api/health` - Status completo (cache, métricas)

## 📦 Variables de Entorno

### Backend (`backend/.env.example`)

```env
# Base
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Supabase
VITE_SUPABASE_URL=https://vrhgqiyamkipgatzvvjw.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aquí
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aquí

# Redis (opcional - funciona sin él)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=tu_secreto_aqui_cambiar_produccion
JWT_EXPIRES_IN=15m
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://vrhgqiyamkipgatzvvjw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aquí
```

## 🚀 Despliegue

| Entorno | Backend | Frontend |
|---|---|---|
| **Desarrollo** | `localhost:3000` | `localhost:5173` |
| **Producción** | Render (`coop-backend-9d7x`) | Vercel (`cooperativa-ecommerce`) |
| **Cache** | Redis (managed o Docker) | — |

## 🧪 Testing

### Backend

```bash
# Todas las pruebas
cd backend; npm test

# Ver cobertura
cd backend; npm run test:cov
```

### Frontend

```bash
# Todas las pruebas
cd frontend; npm run test

# Con cobertura
cd frontend; npm run test:cov
```

## 📚 Scripts SDD (Spec-Driven Development)

```bash
# Flujo completo: propose → spec → design → tasks
# Ya implementado en la rama master

# Índices de base de datos
cd backend; npm run db:generate  # (personalizar según setup)
```

## 📄 Licencia

ISC

---

### 🆕 Novedades en esta versión

- ✅ **Redis cache** con fallback in-memory
- ✅ **Monitoring** en `/api/health` (métricas de tiempo de respuesta)
- ✅ **16 índices de base de datos** para queries optimizadas
- ✅ **Lazy loading** en 7 páginas del frontend
- ✅ **Bundle analyzer** configurado (`npm run analyze`)
- ✅ Health check completo con status de cache y métricas
