# Final Year College Project

A full-stack placement and recruitment platform built with React on the frontend and Node.js/Express on the backend. The project supports three main roles, `job_seeker`, `recruiter`, and `admin`, and includes job discovery, resume handling, application tracking, recruiter workflows, admin review tools, email notifications, and AI-assisted scoring utilities.

## Overview

This repository is split into two main apps:

- `frontend/` for the user interface
- `backend/` for the REST API, business logic, and data access

Together they provide:

- Public job browsing
- Authentication and OTP verification
- Role-based dashboards
- Resume upload and management
- Job posting and application workflows
- Recruiter approval and moderation flows
- Admin management screens
- Email-driven user notifications
- AI or hybrid scoring support for resumes and applications

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- React Query
- Tailwind CSS
- Axios
- React Hook Form
- Zod

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT Authentication
- Joi Validation
- Nodemailer
- Cloudinary

## Frontend

The frontend is a React single-page application organized by feature and role. It uses lazy-loaded routes, shared UI building blocks, and route guards for authenticated and role-specific flows.

### Main frontend areas

- Public pages for browsing jobs and viewing job details
- Auth pages for login, registration, and OTP verification
- Job seeker pages for dashboard, profile, resume, recommended jobs, and applications
- Recruiter pages for dashboard, job creation, job management, applicant review, and profile
- Admin pages for recruiter approvals, users, resumes, and admin dashboard metrics

### Frontend structure

```text
frontend/
|-- src/
|   |-- context/      # Auth and app-level state
|   |-- features/     # Role-based and domain feature pages
|   |-- lib/          # API, query client, and shared helpers
|   |-- router/       # Main route definitions and guards
|   |-- shared/       # Shared layout and reusable UI components
|   |-- App.jsx
|   |-- main.jsx
|   `-- index.css
|-- package.json
`-- vite.config.js
```

### Frontend development

- Dev server runs on `http://localhost:5173`
- API requests to `/api/v1` and `/api/health` are proxied to the backend
- Frontend dependencies are installed and run separately from the backend

## Backend

The backend exposes a REST API for authentication, users, jobs, resumes, applications, recruiter operations, and admin workflows. It is structured around controllers, services, models, routes, middleware, and validations.

### Backend API areas

Base URL: `http://localhost:5000/api/v1`

- `/auth`
- `/jobseeker`
- `/recruiter`
- `/admin`
- `/jobs`
- `/applications`
- `/resumes`
- `/users`

Health check: `http://localhost:5000/api/health`

### Backend structure

```text
backend/
|-- src/
|   |-- config/       # Environment, DB, Cloudinary config
|   |-- controllers/  # Request handlers
|   |-- middlewares/  # Auth, error handling, rate limiting, validation
|   |-- models/       # Mongoose models
|   |-- queues/       # Queue-related logic
|   |-- routes/       # API route modules
|   |-- services/     # Core business logic
|   |-- utils/        # Shared utilities
|   |-- validations/  # Joi validation schemas
|   |-- workers/      # Background workers
|   |-- app.js
|   `-- server.js
|-- .env.example
|-- package.json
`-- README.md
```

## Repository Structure

```text
Final-Year-College-Project/
|-- backend/
|-- frontend/
|-- _scripts/
|-- .gitignore
|-- package-lock.json
`-- README.md
```

## User Roles

### Job seeker

- Create an account and verify access
- Browse and apply for jobs
- Upload and manage resume data
- Track submitted applications
- View recommended opportunities

### Recruiter

- Manage recruiter profile
- Create and update job postings
- Review applications and applicants
- Work with recruiter-side dashboards and listings

### Admin

- Review recruiter requests
- Manage users
- View resumes
- Access admin dashboards and moderation tools

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB local instance or MongoDB Atlas

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Final-Year-College-Project
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment

Copy the sample env file:

```bash
cp .env.example .env
```

Then update the values in `backend/.env`.

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

## Environment Variables

Backend configuration is loaded from `backend/.env`.

### Required variables

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

### Common variables

- `NODE_ENV=development`
- `PORT=5000`
- `JWT_ACCESS_EXPIRY=15m`
- `JWT_REFRESH_EXPIRY=7d`
- `CORS_ORIGIN=http://localhost:3000`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX_REQUESTS=100`

### Optional integrations

- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `CLOUDINARY_URL`
- `OPENROUTER_API_KEY`

## Running the Project

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

### Default local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Available Scripts

### Backend scripts

- `npm run dev` to start the backend with nodemon
- `npm start` to run the backend with Node.js
- `npm run create:admin` to create an admin user

### Frontend scripts

- `npm run dev` to start the Vite dev server
- `npm run build` to build the frontend for production
- `npm run preview` to preview the production build
- `npm run lint` to run ESLint

## Documentation Notes

- The root README is the project-level guide
- [backend/README.md](./backend/README.md) contains backend-specific details
- [frontend/README.md](./frontend/README.md) contains frontend-specific details
- Backend and frontend are managed as separate apps inside the same repository
