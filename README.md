# Cooperativa E-commerce

E-commerce completo para cooperativa con backend Nest.js y frontend Next.js.

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│    Frontend (Next.js + Tailwind + shadcn/ui)    │             │
│         Responsive, Offline-capable             │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────┐
│            Backend (NestJS + Prisma)            │
│    Auth │ Products │ Cart │ Orders │ Favorites  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         Supabase (PostgreSQL 16)                │
│    Auth │ DB │ Realtime │ Storage │ Edge Fn     │
└─────────────────────────────────────────────────┘
```

## Stack

- **Frontend**: Next.js + Tailwind + shadcn/ui
- **Backend**: NestJS 10.x
- **Database**: Supabase (PostgreSQL 16 managed)
- **Auth**: Supabase Auth + JWT
- **API Docs**: Swagger

## Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run start:dev
```

Backend runs on: `http://localhost:3000`
Swagger docs: `http://localhost:3000/api/docs`

### 2. Database Setup

1. Go to your Supabase dashboard
2. Go to SQL Editor
3. Run the contents of `docs/schema.sql`

### 3. Frontend Setup (coming soon)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (auth required)
- `POST /api/auth/refresh` - Refresh token

### Products
- `GET /api/products` - List products (paginated, filterable)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/barcode/:barcode` - Get product by barcode
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (superadmin)

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/:slug` - Get category by slug

### Cart (auth required)
- `GET /api/cart` - Get cart
- `POST /api/cart/items` - Add item
- `PUT /api/cart/items/:itemId` - Update quantity
- `DELETE /api/cart/items/:itemId` - Remove item
- `DELETE /api/cart` - Clear cart

### Orders (auth required)
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details

### Favorites (auth required)
- `GET /api/favorites` - List favorites
- `POST /api/favorites/:productId` - Add to favorites
- `DELETE /api/favorites/:productId` - Remove from favorites

### Dollar Rate
- `GET /api/dollar-rate` - Get current rate
- `GET /api/dollar-rate/history` - Get rate history
- `POST /api/dollar-rate` - Update rate (admin)

## Project Structure

```
cooperativa-ecommerce/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── cart/
│   │   │   ├── orders/
│   │   │   ├── favorites/
│   │   │   ├── dollar-rate/
│   │   │   └── supabase/
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── enums/
│   │   │   └── guards/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/ (coming soon)
├── docs/
│   └── schema.sql
└── README.md
```

## Environment Variables

See `backend/.env.example` for required configuration.

## License

ISC
