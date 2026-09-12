# Section 01: POS Order & Inventory System

This repository contains Section 01 of the **Techloom.ai Software Engineer Intern Assessment**.

A full-stack foundation built with Node.js, Express, MongoDB Atlas, React, Vite, and Tailwind CSS.

---

## Architecture & Tech Stack

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB Atlas via Mongoose with connection pooling and event listeners
- **Security**: Helmet headers, CORS configuration, Rate limiting (`express-rate-limit`), and Request validation (`express-validator`)
- **Authentication Ready**: JWT utility functions, token verification middleware, and password hashing (`bcryptjs`)
- **Logging**: Morgan HTTP access logger piped into a structured Winston logger
- **Error Handling**: Central error handler with custom `ApiError` class and standard `ApiResponse` envelope
- **Health Check**: `GET /api/v1/health` reporting uptime, memory, environment, and database state

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom SaaS color palette and Google Font *Plus Jakarta Sans*
- **Routing**: React Router v6 with responsive layout shell, sidebar drawer, and 404 handler
- **HTTP Client**: Axios instance with automatic JWT header injection and unified error interceptors
- **Design System**: SaaS components including clean metric cards, status badges, loading pulse skeletons, and ErrorAlert component

---

## Directory Structure

```
task-01/pos-order-inventory-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & environment configurations
│   │   ├── controllers/     # Health and authentication controllers
│   │   ├── models/          # User & foundation Mongoose schemas
│   │   ├── routes/          # API v1 routes
│   │   ├── services/        # Business logic services
│   │   ├── middleware/      # Auth, security, rate limit, validation, & error handlers
│   │   ├── utils/           # Winston logger, ApiError, & ApiResponse
│   │   ├── app.js           # Express application setup
│   │   └── server.js        # Entrypoint with graceful shutdown
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/      # Button, Card, Badge, Loader, ErrorAlert
    │   │   └── layout/      # AppLayout, Sidebar, Navbar, MobileNav
    │   ├── context/         # AppContext with live backend health state
    │   ├── pages/           # Dashboard, NotFound, ErrorPage
    │   ├── services/        # Axios api client & healthService
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    ├── .env.example
    └── package.json
```

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

Backend will run at: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/v1/health`

### 2. Frontend Setup

```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env

# Start Vite dev server
npm run dev
```

Frontend will run at: `http://localhost:5173`
