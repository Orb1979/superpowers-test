# Library CRUD

Spring Boot + Angular library manager.

## Prerequisites

- Docker
- JDK 21
- Node.js 20+

## Start Postgres

```bash
docker compose up -d
```

## Start backend

```bash
cd backend
./gradlew bootRun
```

API: http://localhost:8080

## Start frontend

```bash
cd frontend
npm install
npm start
```

UI: http://localhost:4200

> **Note:** Open the UI at `http://localhost:4200`, not `http://127.0.0.1:4200`. The backend CORS config only allows `http://localhost:4200`.

## Tests

```bash
cd backend && ./gradlew test
```
