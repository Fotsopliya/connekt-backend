# Connekt Backend

<p align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
  <a href="https://typeorm.io/" target="_blank" style="margin: 0 20px;">
    <img src="https://typeorm.io/typeorm-logo.svg" width="120" alt="TypeORM Logo" />
  </a>
  <a href="https://www.postgresql.org/" target="_blank">
    <img src="https://www.postgresql.org/media/img/about/press/elephant.png" width="100" alt="PostgreSQL Logo" />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nestjs/core" target="_blank">
    <img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NestJS Version" />
  </a>
  <a href="https://www.npmjs.com/package/typeorm" target="_blank">
    <img src="https://img.shields.io/npm/v/typeorm.svg" alt="TypeORM Version" />
  </a>
  <a href="https://www.docker.com/" target="_blank">
    <img src="https://img.shields.io/badge/Docker-✓-blue.svg" alt="Docker" />
  </a>
  <a href="https://clerk.com/" target="_blank">
    <img src="https://img.shields.io/badge/Auth-Clerk-000000.svg" alt="Clerk Auth" />
  </a>
  <a href="#license" target="_blank">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
  </a>
</p>

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [Environment Setup](#environment-setup)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
  - [Docker Setup](#-docker-setup)
- [Project Structure](#-project-structure)
- [Authentication](#-authentication)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

Connekt is a modern ride-sharing platform built with NestJS, TypeORM, and PostgreSQL. This backend service provides a robust API for managing users, trips, reservations, and real-time communication between drivers and passengers.

## ✨ Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication with Clerk
  - Role-based access control (Admin, Driver, Passenger)
  - KYC/Verification workflow

- 🚗 **Trip Management**
  - Create and manage trips
  - Real-time trip tracking
  - Trip search and filtering

- 📅 **Reservation System**
  - Book and manage reservations
  - Real-time booking updates
  - Payment integration

- 👥 **User Management**
  - User profiles with verification
  - Rating and review system
  - Admin dashboard for user management

- 💬 **Real-time Communication**
  - WebSocket support for real-time updates
  - In-app messaging
  - Trip status notifications

- 🛡️ **Admin Features**
  - User management (block/unblock)
  - Trip validation
  - Support ticket system
  - Message moderation
  - KYC verification workflow

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: PostgreSQL with [TypeORM](https://typeorm.io/)
- **Authentication**: [Clerk](https://clerk.com/) (JWT + Webhooks)
- **Real-time**: WebSockets with `@nestjs/websockets`
- **API Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose
- **Package Manager**: pnpm
- **Testing**: Jest (Unit & E2E)

## 📋 Prerequisites

- Node.js 18 or later
- pnpm
- Docker & Docker Compose
- PostgreSQL 14+
- Clerk account (for authentication)

## 🚀 Getting Started

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:
   ```env
   # App
   NODE_ENV=development
   PORT=3000
   
   # Database
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=connekt
   POSTGRES_PASSWORD=connekt123
   POSTGRES_DB=connekt
   
   # Auth
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
   
   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1d
   
   # API
   API_PREFIX=/api
   FRONTEND_URL=http://localhost:3001
   ```

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   # Start database
   docker-compose up -d db
   
   # Run migrations
   pnpm run migration:run
   
   # Start the application
   pnpm run start:dev
   ```

### Running the App

```bash
# Development mode with hot-reload
$ pnpm run start:dev

# Production build
$ pnpm run build
$ pnpm run start:prod

# Run database migrations
$ pnpm run migration:run

# Generate new migration
$ pnpm run migration:generate src/database/migrations/NameOfMigration
```

## 🐳 Docker Setup

Run the entire stack with Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- pgAdmin (available at http://localhost:5050)
- The Connekt API (available at http://localhost:3000)

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/               # Authentication module (Clerk integration)
│   ├── users/              # User management
│   ├── trips/              # Trip management
│   ├── reservations/       # Reservation system
│   ├── messages/           # Real-time messaging
│   ├── notifications/      # Notification system
│   ├── admin/              # Admin features
│   ├── common/             # Shared modules and utilities
│   │   ├── decorators/     # Custom decorators
│   │   ├── filters/        # Exception filters
│   │   ├── guards/         # Authentication & authorization guards
│   │   ├── interceptors/   # Response interceptors
│   │   └── middleware/     # Global middleware
│   ├── config/             # Configuration files
│   ├── database/           # Database configuration & migrations
│   ├── app.module.ts       # Root module
│   └── main.ts             # Application entry point
├── test/                   # Test files
├── .env.example            # Example environment variables
├── .eslintrc.js            # ESLint config
├── .prettierrc             # Prettier config
├── nest-cli.json           # NestJS CLI config
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript config
└── docker-compose.yml      # Docker Compose config
```

## 🔐 Authentication

Authentication is handled by Clerk. The system uses JWT tokens for API authentication and webhooks for user synchronization.

### User Flow
1. User signs up via Clerk
2. Clerk webhook creates/updates the user in the database
3. JWT tokens are used for subsequent API requests
4. Role-based guards control access to protected routes

### Required Environment Variables
```
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
JWT_SECRET=your_jwt_secret
```

## 📚 API Documentation

API documentation is available via Swagger UI when running in development mode:

```
http://localhost:3000/api/docs
```

## 🧪 Testing

```bash
# Unit tests
$ pnpm run test

# E2E tests
$ pnpm run test:e2e

# Test coverage
$ pnpm run test:cov
```

## 🚀 Deployment

### Prerequisites
- Docker & Docker Compose
- Production database credentials
- SSL certificates (for HTTPS)

### Steps
1. Set up production environment variables
2. Build Docker images:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```
3. Run migrations:
   ```bash
   docker-compose -f docker-compose.prod.yml run --rm api pnpm run migration:run
   ```
4. Start services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by the Connekt Team
</p>
