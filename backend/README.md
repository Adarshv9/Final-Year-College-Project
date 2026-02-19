# College Project — Backend API

Production-ready RESTful backend built with **Node.js**, **Express.js**, **MongoDB** (Mongoose), and **JWT** authentication.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Authentication](#authentication)
  - [Users](#users)
- [Error Response Format](#error-response-format)
- [Security Features](#security-features)

---

## Tech Stack

| Layer           | Technology              |
| --------------- | ----------------------- |
| Runtime         | Node.js (LTS)           |
| Framework       | Express.js 4            |
| Database        | MongoDB + Mongoose 8    |
| Auth            | JWT (access + refresh)  |
| Validation      | Joi                     |
| Security        | Helmet, CORS, Rate Limit, mongo-sanitize |
| Logging         | Winston + Morgan        |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js            # MongoDB connection
│   │   └── env.js           # Environment configuration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   ├── middlewares/
│   │   ├── auth.js          # verifyToken, verifyRole
│   │   ├── errorHandler.js  # Centralised error handler
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── validate.js      # Joi validation middleware
│   ├── models/
│   │   ├── Token.js         # Refresh token model
│   │   └── User.js          # User model
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── index.js         # Route aggregator
│   │   └── user.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── token.service.js
│   │   └── user.service.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── catchAsync.js
│   │   └── logger.js
│   ├── validations/
│   │   ├── auth.validation.js
│   │   └── user.validation.js
│   ├── app.js               # Express app setup
│   └── server.js            # Entry point
├── .env.example
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 (LTS)
- **MongoDB** running locally or a MongoDB Atlas connection string

### Installation

```bash
cd backend
npm install
```

### Configure Environment

Copy the example env file and edit values as needed:

```bash
cp .env.example .env
```

### Run the Server

```bash
# Development (with hot-reload via nodemon)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:5000` by default.

---

## Environment Variables

| Variable                 | Description                     | Default                |
| ------------------------ | ------------------------------- | ---------------------- |
| `NODE_ENV`               | `development` / `production`    | `development`          |
| `PORT`                   | Server port                     | `5000`                 |
| `MONGODB_URI`            | MongoDB connection string       | `mongodb://localhost:27017/college_project` |
| `JWT_ACCESS_SECRET`      | Secret for access tokens        | —                      |
| `JWT_REFRESH_SECRET`     | Secret for refresh tokens       | —                      |
| `JWT_ACCESS_EXPIRY`      | Access token lifetime           | `15m`                  |
| `JWT_REFRESH_EXPIRY`     | Refresh token lifetime          | `7d`                   |
| `CORS_ORIGIN`            | Allowed origin for CORS         | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS`   | Rate limit window (ms)          | `900000` (15 min)      |
| `RATE_LIMIT_MAX_REQUESTS`| Max requests per window         | `100`                  |

---

## API Endpoints

> Base URL: `http://localhost:5000/api/v1`

### Health Check

```
GET /api/health
```

**Response:**
```json
{ "success": true, "message": "Server is running" }
```

---

### Authentication

#### Register

```
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful",
  "data": {
    "user": { "_id": "...", "name": "John Doe", "email": "john@example.com", "role": "user" },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

#### Login

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { "_id": "...", "name": "John Doe", "email": "john@example.com", "role": "user" },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

#### Refresh Token

```
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

#### Logout

```
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "eyJhbG..."
}
```

#### Get Current User

```
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

---

### Users

> All user endpoints require a valid access token.  
> `PUT` and `DELETE` require the **admin** role.

#### List Users

```
GET /api/v1/users?page=1&limit=10&role=user&search=john
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users fetched successfully",
  "data": {
    "users": [ ... ],
    "pagination": { "total": 25, "page": 1, "limit": 10, "totalPages": 3 }
  }
}
```

#### Get User by ID

```
GET /api/v1/users/:id
Authorization: Bearer <accessToken>
```

#### Update User (Admin Only)

```
PUT /api/v1/users/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Jane Doe",
  "role": "admin"
}
```

#### Delete User (Admin Only)

```
DELETE /api/v1/users/:id
Authorization: Bearer <accessToken>
```

---

## Error Response Format

All errors follow a consistent shape:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": ["(optional) array of detailed validation errors"]
}
```

| Status Code | Meaning                  |
| ----------- | ------------------------ |
| 400         | Bad Request              |
| 401         | Unauthorized             |
| 403         | Forbidden                |
| 404         | Not Found                |
| 409         | Conflict (duplicate)     |
| 422         | Validation Error         |
| 429         | Too Many Requests        |
| 500         | Internal Server Error    |

---

## Security Features

- **Helmet** — secure HTTP headers
- **CORS** — configurable cross-origin policy
- **Rate Limiting** — general + stricter auth-specific limits
- **NoSQL Injection Prevention** — `express-mongo-sanitize`
- **Input Validation** — Joi schemas reject malformed data before it hits controllers
- **Password Hashing** — bcrypt with 12 salt rounds
- **JWT Token Rotation** — refresh tokens are single-use and stored server-side
- **Stack Trace Suppression** — hidden in production error responses
