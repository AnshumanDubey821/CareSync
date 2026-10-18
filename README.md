# CareSync — Healthcare Appointment & Consultation Platform

CareSync is a full-stack SaaS application designed for healthcare appointment scheduling, dynamic doctor availability slot management, digital prescription issuance, and admin platform governance.

---

## Features

### Patient Portal
- User registration and JWT authentication.
- Search doctors by name, medical specialization, and location.
- View doctor profile details, qualifications, experience, and consultation fees.
- Real-time dynamic available time slot generation.
- Book appointments with reason and patient notes.
- Instant race-condition protection (HTTP 409 Conflict handling if a slot is booked concurrently).
- View upcoming and historical appointments with status tracking.
- Access issued digital prescriptions.

### Doctor Portal
- Manage availability schedules for specific dates or recurring weekdays.
- Configure slot durations (15, 30, 45, 60 minutes).
- View consultation appointment calendar and patient queue.
- Issue digital prescriptions linked to appointments (diagnosis, medicines, dosage, frequency, duration, instructions, and notes).
- Update professional doctor profile details.

### Admin Portal
- Platform metrics overview (total doctors, total patients, total appointments, completed, cancelled, and scheduled visits).
- View full doctor and patient management directories.
- Audit system-wide appointments and override appointment statuses (`SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).

---

## Technology Stack

### Backend
- **Framework:** Java 21, Spring Boot 3.3.x
- **Security:** Spring Security 6, JWT (JSON Web Tokens)
- **Database & Persistence:** MySQL 8.x, Spring Data JPA / Hibernate
- **Migrations:** Flyway Database Migrations
- **Email & Scheduling:** Spring Boot Starter Mail, Spring Scheduling (`@EnableScheduling`)
- **Testing:** JUnit 5, Spring Boot Test, MockMvc

### Frontend
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Icons:** Lucide React

---

## Prerequisites

- **Java JDK 21** or higher
- **Node.js 18+** and `npm`
- **MySQL Server 8.0+**
- **MailHog** or local SMTP server (optional, for testing email notifications)

---

## Environment Variables

Copy `.env.example` to `.env` or set the following environment variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `SERVER_PORT` | Backend HTTP server port | `8080` |
| `DB_HOST` | MySQL database host | `localhost` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_NAME` | MySQL database name | `caresync_db` |
| `DB_USERNAME` | MySQL database username | `root` |
| `DB_PASSWORD` | MySQL database password | `root` |
| `JWT_SECRET` | Secret key for signing JWT tokens | *(Default provided in application.yml)* |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:5173,http://localhost:3000` |
| `MAIL_HOST` | SMTP server host | `localhost` |
| `MAIL_PORT` | SMTP server port | `1025` |
| `VITE_API_BASE_URL` | Frontend API endpoint URL | `http://localhost:8080/api` |

---

## Database & MySQL Setup

1. Start your local MySQL server.
2. Create the database (optional if auto-creation is enabled in database connection string):
   ```sql
   CREATE DATABASE IF NOT EXISTS caresync_db;
   ```
3. Flyway will automatically execute migrations located in `backend/src/main/resources/db/migration/` upon application startup.

---

## Getting Started

### 1. Backend Startup

Navigate to the `backend` directory and build/run using Maven:

```bash
cd backend
./mvnw clean spring-boot:run
```

The backend server will start on `http://localhost:8080`.

### 2. Frontend Startup

Navigate to the `frontend` directory, install dependencies, and launch Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will be available at `http://localhost:5173`.

---

## Email Configuration

For local development email testing, MailHog can be run via Docker:

```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Access the MailHog web interface at `http://localhost:8025` to inspect appointment confirmation emails and 24-hour reminder messages.

---

## Running Tests

### Backend Unit & Integration Tests

Run the full backend test suite:

```bash
cd backend
./mvnw test
```

Test coverage includes:
- Authentication & JWT token security
- Doctor search & profile updates
- Dynamic slot generation algorithms
- Concurrency race conditions (simultaneous multi-patient slot booking latch tests)
- Prescription IDOR security audits
- Email service & scheduled reminder execution

### Frontend Production Build Test

```bash
cd frontend
npm run build
```

---

## Demo Accounts

Upon initial registration, demo users can be created with the following roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@caresync.com` | `adminPass123` |
| **Doctor** | `doctor@caresync.com` | `docPass123` |
| **Patient** | `patient@caresync.com` | `patPass123` |

---

## Troubleshooting

- **Database Connection Error:** Verify MySQL service is running on port 3306 and credentials match `DB_USERNAME` and `DB_PASSWORD`.
- **CORS Error:** Ensure `ALLOWED_ORIGINS` in `application.yml` matches your frontend port (default `http://localhost:5173`).
- **409 Slot Conflict:** Indicates a race condition was caught and prevented by database constraints when two requests attempted to reserve the exact same slot.
