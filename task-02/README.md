# Section 02: E-Commerce Checkout & Payment System

This directory contains **Section 02** of the **Techloom.ai Software Engineer Intern Assessment**.

A full-stack foundation built with **Node.js**, **Express.js**, **MongoDB Atlas (Mongoose)**, **Next.js (App Router)**, **React**, and **Tailwind CSS**.

---

## Architecture & Tech Stack

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB Atlas via Mongoose
- **Authentication**: JWT & bcryptjs
- **Role-Based Authorization**:
  - `protect` middleware: token validation & active user hydration
  - `requireAdmin` middleware: strict role checking (`ADMIN`), returning `403 Forbidden` for customers
- **Security & Headers**: Helmet, CORS (configured with `CLIENT_URL`)
- **Logging**: Morgan HTTP access logger
- **Environment**: Dotenv
- **Health Check**: `GET /api/health`

### Frontend
- **Framework**: Next.js 16 (App Router) with React 19 & JavaScript
- **Styling**: Tailwind CSS v4
- **State Management**: React `AuthContext` with session persistence
- **Authentication Pages**:
  - `/login`: Form validation, inline errors, quick-fill test accounts
  - `/register`: Full name, normalized email, password, confirm password validation
- **Role-Based Navigation**:
  - **Customer**: Home, Products (placeholder), Cart (placeholder), My Orders (placeholder), Profile/Logout
  - **Admin**: Dashboard, Products, Inventory, Orders, Payments, Refunds, Admin Badge, Logout
  - **Guest**: Home, Sign In, Create Account

---

## Authentication Endpoints

| Method | Endpoint | Access | Description | Status Codes |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Registers a new customer (role forced to `CUSTOMER`) | `201`, `400`, `409` |
| `POST` | `/api/auth/login` | Public | Authenticates user & returns JWT token | `200`, `400`, `401` |
| `GET` | `/api/auth/me` | Protected | Returns current authenticated user profile | `200`, `401` |
| `GET` | `/api/auth/admin-check` | Admin | Validates admin role privileges | `200`, `401`, `403` |

---

## Seeded Admin Account

The system includes an idempotent admin seeder that runs on startup and via `npm run seed:admin`:
- **Email**: `admin@gmail.com`
- **Password**: `123456`
- **Role**: `ADMIN`

*(Production credentials can be safely overridden via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`)*

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Run automated auth & RBAC test suite (8 test cases)
npm run test:auth

# Seed/verify admin account
npm run seed:admin

# Start development server
npm run dev
```

- Default port: `http://localhost:5001`
- Health check: `http://localhost:5001/api/health`

### 2. Frontend Setup

```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env.local

# Start Next.js development server
npm run dev
```

- Frontend URL: `http://localhost:3000`
- Login URL: `http://localhost:3000/login`
- Register URL: `http://localhost:3000/register`
