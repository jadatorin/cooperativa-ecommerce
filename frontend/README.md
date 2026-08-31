# Cooperativa E-commerce - Frontend

Frontend para el e-commerce de la cooperativa, construido con Next.js, Tailwind CSS y shadcn/ui.

## Stack

- **Framework**: Next.js 16.3 (App Router + Turbopack)
- **Estilos**: Tailwind CSS v4
- **Componentes**: shadcn/ui
- **Iconos**: Lucide React
- **Backend**: NestJS + Supabase (en `../backend`)

## Estructura

```
frontend/src/
├── app/
│   ├── layout.tsx          # Layout principal (header + footer)
│   ├── page.tsx            # Página de inicio
│   ├── products/
│   │   └── page.tsx        # Listado de productos
│   └── cart/
│       └── page.tsx        # Carrito de compras
├── components/
│   ├── layout/
│   │   ├── header.tsx      # Header con navegación y búsqueda
│   │   └── footer.tsx      # Footer con información
│   ├── products/
│   │   └── product-card.tsx # Tarjeta de producto
│   └── ui/                 # Componentes shadcn/ui
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
└── lib/
    └── utils.ts            # Utilidades (cn, formatPrice)
```

## Inicio Rápido

### 1. Instalar dependencias

```bash
cd frontend
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Frontend disponible en: `http://localhost:5173`

### 4. Build de producción

```bash
npm run build
npm start
```

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Inicio con categorías y productos destacados |
| `/products` | Listado completo con filtros por categoría |
| `/products/[id]` | Detalle de producto (próximamente) |
| `/cart` | Carrito de compras |

## Componentes

### shadcn/ui

Componentes instalados:
- **Button** — Botones con variantes (default, outline, ghost, etc.)
- **Card** — Tarjetas para productos y contenido
- **Input** — Campos de entrada
- **Badge** — Etiquetas (disponible, agotado, por peso)

### Personalización

- Colores: editar `src/app/globals.css`
- Componentes: seguir guía de [shadcn/ui](https://ui.shadcn.com)

## API Backend

El frontend consume la API del backend NestJS:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/products` | GET | Listar productos |
| `/api/products/:id` | GET | Obtener producto |
| `/api/categories` | GET | Listar categorías |
| `/api/cart` | GET | Obtener carrito |
| `/api/cart/items` | POST | Agregar item |
| `/api/orders` | POST | Crear orden |

Documentación Swagger: `http://localhost:3000/api/docs`

## Próximos Pasos

- [ ] Conectar frontend a la API del backend
- [ ] Página de detalle de producto
- [ ] Autenticación de usuarios
- [ ] Checkout y pasarela de pago
- [ ] Panel de administración
