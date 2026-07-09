# 🛠️ FixItNow Backend - Home Service Marketplace API

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-v22-008CFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

Welcome to **FixItNow Backend**, a highly scalable, robust, and feature-rich home service marketplace server built using **Node.js (ES Modules)**, **Express.js**, **Prisma ORM**, and **PostgreSQL**. 

This system supports role-based features for **Customers**, **Technicians**, and **Administrators**, and includes a fully integrated **Stripe Payment Gateway** for secure bookings, detailed validation schemas, custom logging, and seamless deployment on **Vercel**.

---

## 🚀 Key Features Implemented

- 🛡️ **Advanced Authentication & Security**: Secure token-based session tracking using **JWT** and standard password encryption via **bcryptjs**.
- 👥 **Multi-Role System (RBAC)**: Role-based access control guarding routes and controllers for `CUSTOMER`, `TECHNICIAN`, and `ADMIN` roles.
- ⚙️ **Prisma Multi-File Schema Structure**: Utilizes the modern Prisma **Schema Folder** feature (`previewFeatures = ["prismaSchemaFolder"]`) to keep database structures organized into separate domain files (`user.prisma`, `technician.prisma`, `booking.prisma`, etc.).
- 📦 **Layered MVC/Routes-Controllers Architecture**: Features clean separation of routing, authentication verification, body validations, business logic, and database layer calls.
- 💳 **Stripe Payment Gateway Integration**: Creates secure online checkout sessions dynamically based on booking price and processes secure checkout redirect verifications (`confirm` API endpoint) using transactional operations.
- 📈 **Admin Dashboard & Management**: Enables stats summaries (total users, total technicians, total bookings, total earnings), user ban/unban controls, user deletion, booking listings, and service category creations.
- 👨‍🔧 **Technician Portal Management**: Allows updating profile bios, skills arrays, pricing values, location fields, weekly availability slots, viewing assigned bookings, and changing booking statuses.
- 📅 **Customer Bookings**: Supports booking service requests, scheduling slots, viewing personal booking histories, and canceling pending bookings (before they go `IN_PROGRESS`).
- 🌟 **Rating & Review System**: Allows customers to rate technicians (1 to 5 stars) and write comments upon completed bookings, automatically updating average technician ratings.
- 🛠️ **Unified Middleware Suite**: Custom middlewares for JSON body validations, token authentication parsing, route guard restrictions, and global application error mappings.

---

## 📂 Project Directory Structure

```text
level_2-assignment-4/
├── prisma/
│   ├── migrations/               # PostgreSQL Database schema migrations history
│   ├── schema/                   # Split Prisma Schema Files (Prisma v5+ Feature)
│   │   ├── booking.prisma        # Booking model
│   │   ├── category.prisma       # Category model
│   │   ├── enum.prisma           # Schema enums (Role, BookingStatus, etc.)
│   │   ├── payment.prisma        # Stripe transaction and payment model
│   │   ├── review.prisma         # Reviews & ratings model
│   │   ├── schema.prisma         # Central datasource/generator settings
│   │   ├── service.prisma        # Available services model
│   │   ├── technician.prisma     # Technician details & profile settings
│   │   └── user.prisma           # Master user registration details
│   └── seed.js                   # Database seeding script (admin, tech, categories, services)
├── src/
│   ├── app.js                    # Express app initialization, CORS, global middlewares & base routing
│   ├── server.js                 # Server entry point (starts listener & hooks system rejects/uncaughts)
│   ├── config/
│   │   └── prisma.js             # Singleton Prisma Client provider
│   ├── controllers/              # Business logic handlers matching route endpoints
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── paymentController.js
│   │   ├── reviewController.js
│   │   ├── serviceController.js
│   │   └── technicianController.js
│   ├── middlewares/              # Interceptor middleware modules
│   │   ├── authMiddleware.js     # Extracts JWT token and checks if user exists/banned
│   │   ├── roleMiddleware.js     # Validates user authorization credentials
│   │   └── validationMiddleware.js # Input payload validators for registration, login, bookings, etc.
│   └── routes/                   # Router blueprint definitions
│       ├── adminRoutes.js
│       ├── authRoutes.js
│       ├── bookingRoutes.js
│       ├── paymentRoutes.js
│       ├── reviewRoutes.js
│       ├── serviceRoutes.js
│       └── technicianRoutes.js
├── .env.example                  # Environment Variables template
├── postman_collection.json       # Complete Postman REST collection API test file
├── vercel.json                   # Serverless deployment configuration for Vercel
└── package.json                  # Dependencies registry and command scripts
```

---

## 🛢️ Database Schema Representation

### 1. Enums
* **Role**: `CUSTOMER`, `TECHNICIAN`, `ADMIN`
* **BookingStatus**: `REQUESTED`, `ACCEPTED`, `DECLINED`, `PAID`, `IN_PROGRESS`, `COMPLETED`
* **PaymentProvider**: `STRIPE`, `SSLCOMMERZ`
* **PaymentStatus**: `PENDING`, `COMPLETED`, `FAILED`

### 2. Models & Relations
* **User**: Connects one-to-one with `TechnicianProfile` (if role is `TECHNICIAN`), one-to-many with `Booking` (as customer), and one-to-many with `Review`.
* **TechnicianProfile**: Holds custom skills list, experience years, location, pricing, rating, availability array. Connects to `User`, and has one-to-many relationships with `Service`, `Booking`, and `Review`.
* **Category**: Groups services (e.g., Plumbing, Electrical, Cleaning). Connects one-to-many with `Service`.
* **Service**: Belongs to a Category and a Technician. Has one-to-many relationships with `Booking`.
* **Booking**: Connects a Customer, a Technician, and a Service. Has one-to-many relationships with `Payment`.
* **Payment**: Holds amount, unique transaction ID, status, and paid date. Belongs to a specific `Booking`.
* **Review**: Stores numeric rating (1-5), customer ID, technician ID, and comment.

---

## 📡 API Endpoints Reference

### 1. Authentication (`/api/auth`)

| Method | Path | Auth Required | Role | Description |
| :--- | :--- | :---: | :---: | :--- |
| **`POST`** | `/register` | ❌ No | Public | Registers a new user and returns a JWT token. Creates an empty profile if the role is `TECHNICIAN`. |
| **`POST`** | `/login` | ❌ No | Public | Authenticates credentials and returns a JWT token. Banned users cannot log in. |
| **`GET`** | `/me` |   Customer / Tech / Admin | Fetches profile information for the authenticated user (including `TechnicianProfile` details if applicable). |

#### Request Formats:
* **Register Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123",
    "role": "CUSTOMER" 
  }
  ```
* **Login Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "password123"
  }
  ```

---

### 2. Services & Directory (`/api/services` & `/api/technicians`)

| Method | Path | Auth Required | Role | Description |
| :--- | :--- | :---: | :---: | :--- |
| **`GET`** | `/services` | ❌ No | Public | Fetch all services. Supports filters: `location`, `minRating`, `minPrice`, `maxPrice`. |
| **`GET`** | `/services/:id` | ❌ No | Public | Fetch detailed information of a single service by ID. |
| **`POST`** | `/services` |   Technician / Admin | Creates a new service offering in the marketplace. |
| **`PATCH`** | `/services/:id` |   Technician / Admin | Updates details of a specific service. |
| **`DELETE`** | `/services/:id` |   Technician / Admin | Permanently deletes a service offering. |
| **`GET`** | `/technicians` | ❌ No | Public | List all active technicians. Supports filters: `location`, `minRating`. |
| **`GET`** | `/technicians/:id` | ❌ No | Public | Fetch public details of a technician profile, including associated reviews. |

---

### 3. Bookings Management (`/api/bookings`)

| Method | Path | Auth Required | Role | Description |
| :--- | :--- | :---: | :---: | :--- |
| **`POST`** | `/` |   Customer | Requests a booking slot for a service. |
| **`GET`** | `/` |   Customer / Tech / Admin | Gets bookings list (Customer sees theirs, Tech sees assigned ones, Admin sees all). |
| **`GET`** | `/:id` |   Customer / Tech / Admin | View specific details of a booking if authorized. |
| **`PATCH`** | `/:id/status` |   Customer / Tech / Admin | Update booking status. Customer can only cancel (`DECLINED`) if status is not `IN_PROGRESS`/`COMPLETED`. |

#### Request Formats:
* **Create Booking Request Body**:
  ```json
  {
    "serviceId": "service-uuid-here",
    "scheduledTime": "2026-07-20T10:00:00.000Z"
  }
  ```
* **Update Booking Status Request Body**:
  ```json
  {
    "status": "DECLINED"
  }
  ```

---

### 4. Payments Integration (`/api/payments`)

| Method | Path | Auth Required | Role | Description |
| :--- | :--- | :---: | :---: | :--- |
| **`POST`** | `/create-checkout-session` |   Customer | Generates a Stripe Checkout Session for an `ACCEPTED` booking and logs a `PENDING` payment. |
| **`GET`** | `/confirm` | ❌ No | Public | Payment verification callback for Stripe. Confirms payment, records transaction ID, updates booking status to `PAID`. |
| **`GET`** | `/history` |   Customer / Admin | Returns history of payments (Customers see theirs, Admin sees all). |
| **`GET`** | `/:id` |   Customer / Admin | Fetches single transaction receipt details. |

---

### 5. Technician Dashboard Operations (`/api/technician`)

| Method | Path | Auth Required | Role | Description |
| :--- | :--- | :---: | :---: | :--- |
| **`PUT`** | `/profile` |   Technician | Update profile details (skills, experience, pricing, location). |
| **`PUT`** | `/availability` |   Technician | Update weekly availability slot strings. |
| **`GET`** | `/bookings` |   Technician | Fetch bookings list assigned to the technician. |
| **`PATCH`** | `/bookings/:id` |   Technician | Update status of assigned bookings (e.g., set to `ACCEPTED`, `DECLINED`, `IN_PROGRESS`, `COMPLETED`). |

---

### 6. Ratings & Reviews (`/api/reviews`)

| Method | Path | Auth Required | Role | Description |
| :--- | :--- | :---: | :---: | :--- |
| **`POST`** | `/` |   Customer | Submits a technician review (rating between 1 and 5 stars, optional comment) for a booking. |

---

### 7. Administrator Controls (`/api/admin`)

| Method | Path | Auth Required | Role | Description |
| :--- | :--- | :---: | :---: | :--- |
| **`GET`** | `/stats` |   Admin | Get system statistics (total users, total technicians, total bookings, total earnings). |
| **`GET`** | `/users` |   Admin | List all registered users in the database. |
| **`PATCH`** | `/users/:id/ban` |   Admin | Toggle suspension status (`isBanned`) of a user. |
| **`DELETE`** | `/users/:id` |   Admin | Hard deletes a user from the system. |
| **`GET`** | `/bookings` |   Admin | View details of all active bookings in the marketplace. |
| **`GET`** | `/categories` |   Admin | Lists all existing service categories. |
| **`POST`** | `/categories` |   Admin | Create a new service category. |

---

## 🛠️ Getting Started & Setup

### Prerequisites
* **Node.js** (v18.0.0 or higher is recommended)
* **PostgreSQL** database instance (local or hosted e.g., Supabase, Neon, etc.)
* **Stripe Account** (Optional, for processing payments in Test Mode)

### Step 1: Install Dependencies
Clone this repository to your local system, open the directory in a terminal, and install the required modules:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Fill out the parameters inside `.env` correctly:
| Key | Description | Example / Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/dbname?schema=public` |
| `JWT_SECRET` | Secret key used to sign session tokens | `your_long_random_secure_jwt_secret_phrase` |
| `PORT` | Local server listener port | `5000` |
| `STRIPE_SECRET_KEY` | Stripe developer dashboard private key | `sk_test_51P...` |

### Step 3: Run Database Migrations
Run the Prisma migration tool to set up tables and schema relationships in your database:
```bash
npm run prisma:migrate
```

### Step 4: Seed the Database
Run the pre-configured database seeder. This will create test accounts for each role (`CUSTOMER`, `TECHNICIAN`, `ADMIN`), set up categories, and populate sample services:
```bash
npx prisma db seed
```

**Seeded Account Credentials:**
- 👑 **Admin**: Email: `admin@fixitnow.com` \| Password: `admin123`
- 👨‍🔧 **Technician**: Email: `technician@fixitnow.com` \| Password: `tech123`
- 👤 **Customer**: Email: `customer@fixitnow.com` \| Password: `customer123`

### Step 5: Start the Server
* **Development Mode (with hot-reload using Nodemon)**:
  ```bash
  npm run dev
  ```
* **Production Mode**:
  ```bash
  npm run start
  ```

---

## 🧪 Postman API Testing
To test these endpoints directly, import the [postman_collection.json](file:///f:/amdad-islam/next-level-batch-7/level_2-assingment-4/postman_collection.json) file included in the root folder into your Postman client application.
1. Update the environment variables in Postman to set the server base URL (e.g. `http://localhost:5000` or your Vercel deployment URL).
2. Use the **Login User** or **Register User** endpoints to generate a JWT token.
3. Postman is configured to capture this token and assign it to the `jwt_token` environment variable automatically, which will authenticate subsequent protected endpoints.

---

## 🌐 Deployment to Vercel
The project is pre-configured for Vercel Serverless Functions deployment. The routing configurations are specified inside the [vercel.json](file:///f:/amdad-islam/next-level-batch-7/level_2-assingment-4/vercel.json) file.
To deploy:
1. Push your code to GitHub.
2. Connect the repository in your Vercel Dashboard.
3. Configure the environment variables (`DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`) under Vercel project settings.
4. Click **Deploy**. Vercel will build the Prisma client automatically via the `build` script command.
