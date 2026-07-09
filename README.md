# FixItNow Backend Starter Project

A home service marketplace backend built using Node.js, Express.js, Prisma ORM, and PostgreSQL.

## Features

- **Standard ES Modules (ES6)**: Modern JavaScript syntax (`import`/`export`).
- **Prisma ORM**: Robust schema design with relationships for users, categories, services, bookings, payments, and reviews.
- **Layered MVC/Routes-Controllers Architecture**: Organized code layout separating routing, logic, configurations, and database actions.
- **Security & Authorization**: Middleware placeholders for JWT token validation and role-based access control.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (running locally or remotely)

### Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```
   Modify `DATABASE_URL` with your PostgreSQL database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
   ```

3. **Database Migration & Client Generation**:
   Sync your database schema and generate the Prisma client:
   ```bash
   # Run migrations
   npm run prisma:migrate
   
   # Or validate/generate prisma client manually
   npx prisma generate
   ```

4. **Run the Server**:
   - In Development Mode (with hot-reload):
     ```bash
     npm run dev
     ```
   - In Production Mode:
     ```bash
     npm run start
     ```

## Folder Structure

```text
level_2-assingment_4/
├── prisma/
│   └── schema.prisma        # Prisma Database Schema
├── src/
│   ├── app.js               # Express Application setup & global middleware
│   ├── server.js            # Server entry point
│   ├── config/
│   │   └── prisma.js        # PrismaClient instance
│   ├── controllers/         # Request handlers
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── paymentController.js
│   │   └── serviceController.js
│   ├── middlewares/         # Auth & Role verification middlewares
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   └── routes/              # Express API Routes
│       ├── adminRoutes.js
│       ├── authRoutes.js
│       ├── bookingRoutes.js
│       ├── paymentRoutes.js
│       └── serviceRoutes.js
```
