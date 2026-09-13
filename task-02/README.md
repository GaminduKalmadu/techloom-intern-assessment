# Section 02: E-Commerce Checkout & Payment System

This directory contains **Section 02** of the **Techloom.ai Software Engineer Intern Assessment**.

A full-stack foundation built with **Node.js**, **Express.js**, **MongoDB Atlas (Mongoose)**, **Next.js (App Router)**, **React**, and **Tailwind CSS**.

---

## Architecture & Tech Stack

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB Atlas via Mongoose
- **Security & Headers**: Helmet, CORS (configured with `CLIENT_URL`)
- **Logging**: Morgan HTTP access logger
- **Environment**: Dotenv
- **Health Check**: `GET /api/health`

### Frontend
- **Framework**: Next.js (App Router) with React & JavaScript
- **Styling**: Tailwind CSS
- **API Communication**: Unified API client communicating with Express backend
- **UI Primitives**: Reusable `Navbar`, `Footer`, `Button`, `Input`, `Loading`, and `PageContainer`

---

## Directory Structure

```text
task-02/
├── backend/
│   ├── src/
│   │   ├── config/          # DB & env configuration
│   │   ├── controllers/     # Route controllers (Health)
│   │   ├── models/          # Mongoose models (ready for schemas)
│   │   ├── routes/          # Express API routes
│   │   ├── services/        # Business logic services
│   │   ├── middleware/      # Centralized error & 404 handlers
│   │   ├── utils/           # ApiError & ApiResponse helpers
│   │   ├── jobs/            # Scheduled tasks / background workers
│   │   └── app.js           # Express app setup
│   ├── server.js            # Server entrypoint with DB connection
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── app/                 # Next.js App Router (layout, page, globals)
│   ├── components/
│   │   ├── common/          # Button, Input, Loading, PageContainer
│   │   └── layout/          # Navbar, Footer
│   ├── services/            # API helper & health service
│   ├── hooks/               # Custom React hooks
│   ├── context/             # Global React context providers
│   ├── utils/               # Frontend utility helpers
│   ├── public/              # Static assets
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
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
