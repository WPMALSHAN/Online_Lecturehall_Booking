# 🏫 Smart Campus Management System
### IT3030 — PAF Assignment 2026 | Group XX

A university platform for managing **Facility/Asset Booking** and **Maintenance/Incident Management**, built with Spring Boot and React.

---

## 👥 Team Members

| Name | Module | Branch |
|------|--------|--------|
| Pasindu | Notifications + Role Management + OAuth | `feature/auth-pasindu` |
| Kaveesha | Facilities & Assets Catalogue | `feature/facilities-kaveesha` |
| Himaya | Booking Workflow + Conflict Checking | `feature/booking-himaya` |
| Hiruni | Incident Tickets + Attachments + Technician Updates | `feature/incidents-hiruni` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.x |
| Frontend | React 18 |
| Database | MariaDB |
| Security | Spring Security + JWT |
| Auth | OAuth 2.0 (Google Login) |
| Version Control | Git + GitHub |

---

## 📁 Project Structure

```
it3030-paf-2026-smart-campus-groupXX/
├── smart-campus-backend/        # Spring Boot Backend
│   ├── src/
│   │   └── main/
│   │       ├── java/com/smartcampus/
│   │       │   ├── controller/
│   │       │   ├── service/
│   │       │   ├── repository/
│   │       │   ├── entity/
│   │       │   ├── dto/
│   │       │   ├── exception/
│   │       │   └── security/
│   │       └── resources/
│   │           └── application.properties
│   └── pom.xml
│
└── smart-campus-frontend/       # React Frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── routes/
    │   └── context/
    └── package.json
```

---

## ⚙️ How to Run — Backend (Spring Boot)

### Prerequisites
- Java 17+
- Maven
- MariaDB running on port 3306

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/it3030-paf-2026-smart-campus-groupXX.git
cd it3030-paf-2026-smart-campus-groupXX/smart-campus-backend
```

### 2. Create the database
```sql
CREATE DATABASE smart_campus;
```

### 3. Configure application.properties
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mariadb://localhost:3306/YOUR_DB_NAME
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MariaDBDialect
```

### 4. Run the backend
```bash
mvn spring-boot:run
```
Backend runs on: `http://localhost:8080`

---

## ⚙️ How to Run — Frontend (React)

### Prerequisites
- Node.js 18+
- npm

### 1. Go to frontend folder
```bash
cd smart-campus-frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the app
```bash
npm start
```
Frontend runs on: `http://localhost:3000`

---

## 🔗 API Endpoints Summary

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Facilities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/facilities` | Get all facilities |
| POST | `/api/facilities` | Add new facility (Admin) |
| PUT | `/api/facilities/{id}` | Update facility (Admin) |
| DELETE | `/api/facilities/{id}` | Delete facility (Admin) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | Get all bookings |
| POST | `/api/bookings` | Create new booking |
| PUT | `/api/bookings/{id}/approve` | Approve booking (Admin) |
| PUT | `/api/bookings/{id}/reject` | Reject booking (Admin) |
| DELETE | `/api/bookings/{id}` | Cancel booking |

### Incidents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/incidents` | Report new incident |
| GET | `/api/incidents` | Get all incidents |
| PUT | `/api/incidents/{id}` | Update incident status |
| PUT | `/api/incidents/{id}/assign` | Assign technician (Admin) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/{id}/read` | Mark as read |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (Admin) |
| PUT | `/api/users/{id}/role` | Update user role (Admin) |

---

## 🔐 Roles & Permissions

| Role | Permissions |
|------|------------|
| Student | Login, view facilities, make booking, report incidents |
| Lecturer | All student features + priority booking |
| Technician | View assigned incidents, update status, add repair notes |
| Admin | Full access — approve/reject bookings, manage users, close incidents |

---

## 📊 Database Tables

`users` | `facilities` | `assets` | `bookings` | `incidents` | `technician_updates` | `audit_logs` | `notifications`

---

## 🌿 Git Branch Strategy

```
main        ← final stable code
└── dev     ← integration branch
    ├── feature/auth-pasindu
    ├── feature/facilities-kaveesha
    ├── feature/booking-himaya
    └── feature/incidents-hiruni
```

**Rule:** Never push directly to `main`. Always PR to `dev` first.

---

## ✅ Core Features Implemented

- [x] User Authentication (JWT)
- [x] Role-Based Access Control
- [x] Facility & Asset Management
- [x] Booking with Conflict Prevention
- [x] Incident Reporting & Ticketing
- [x] Technician Assignment & Updates
- [x] Notifications System
- [x] Audit Logging
- [ ] OAuth Google Login
- [ ] Image Upload for Incidents

---

## 📄 License

This project is submitted as academic coursework for IT3030 — Programming & Frameworks, 2026.