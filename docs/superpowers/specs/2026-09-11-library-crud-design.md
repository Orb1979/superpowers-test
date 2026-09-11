# Library CRUD App — Design Spec

Date: 2026-09-11

## Goal

Build a simple library management app: Spring Boot REST API (Gradle) + Angular frontend + Postgres in Docker Compose. Full CRUD for books, authors, and publishers. No authentication.

## Architecture

Monorepo layout:

```
/
├── docker-compose.yml          # Postgres only
├── backend/                    # Spring Boot 3 + Gradle + Java 21
├── frontend/                   # Angular (standalone components)
├── docs/superpowers/
└── README.md                   # How to start DB, backend, frontend
```

| Piece | Responsibility |
|-------|----------------|
| Postgres (Docker) | Persistence on port 5432, named volume |
| Backend (`:8080`) | REST API, JPA, Flyway migrations, CORS for local Angular |
| Frontend (`:4200`) | CRUD UI calling the API |

Local development: start Postgres via Compose; run backend with Gradle `bootRun`; run frontend with `ng serve`.

## Data model

### Tables

**publisher**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| country | VARCHAR(100) | |

**author**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| birth_date | DATE | |

**book**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| title | VARCHAR(255) | NOT NULL |
| sub_title | VARCHAR(500) | NOT NULL |
| description | TEXT | |
| pages | INTEGER | NOT NULL |
| isbn | VARCHAR(20) | UNIQUE |

**author_book** (many-to-many)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| author_id | UUID | NOT NULL, FK → author(id) ON DELETE CASCADE |
| book_id | UUID | NOT NULL, FK → book(id) ON DELETE CASCADE |
| | | UNIQUE (author_id, book_id) |

**book_publisher** (many-to-many; replaces original `book.publisher_id`)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| book_id | UUID | NOT NULL, FK → book(id) ON DELETE CASCADE |
| publisher_id | UUID | NOT NULL, FK → publisher(id) ON DELETE CASCADE |
| | | UNIQUE (book_id, publisher_id) |

### Relationship rules

- A book may have **0..N authors**.
- A book may have **0..N publishers**.
- Deleting an **author** removes `author_book` rows only; books remain (possibly with zero authors).
- Deleting a **publisher** removes `book_publisher` rows only; books remain (possibly with zero publishers).
- Deleting a **book** cascades join-row cleanup.

Schema is applied with **Flyway** migrations (not Hibernate `ddl-auto` for schema ownership).

## REST API

Base path: `/api`

| Resource | Methods |
|----------|---------|
| `/api/publishers` | GET (list), POST (create) |
| `/api/publishers/{id}` | GET, PUT, DELETE |
| `/api/authors` | GET (list), POST (create) |
| `/api/authors/{id}` | GET, PUT, DELETE |
| `/api/books` | GET (list), POST (create) |
| `/api/books/{id}` | GET, PUT, DELETE |

### Book payloads

Create/update body includes book fields plus:

- `authorIds`: UUID[] (optional, default empty)
- `publisherIds`: UUID[] (optional, default empty)

List/detail responses embed author and publisher summaries so the UI does not need extra round-trips for display.

### Supporting reads for delete warnings

Before confirming delete, the UI loads linked books via:

- `GET /api/authors/{id}/books` → list of books linked to that author (id + title)
- `GET /api/publishers/{id}/books` → list of books linked to that publisher (id + title)

### Errors

| Situation | HTTP |
|-----------|------|
| Unknown id | 404 |
| Validation failure (required fields, pages &lt; 1, invalid UUID refs) | 400 |
| Duplicate ISBN | 409 |
| Clear JSON error body for Angular to show a short message | — |

## Angular frontend

### Routes

| Route | Purpose |
|-------|---------|
| `/books` | List books (title, subtitle, authors, publishers) |
| `/books/new`, `/books/:id/edit` | Book form: fields + multi-select authors + multi-select publishers |
| `/authors` | List authors |
| `/authors/new`, `/authors/:id/edit` | Author form |
| `/publishers` | List publishers |
| `/publishers/new`, `/publishers/:id/edit` | Publisher form |

### UX

- Nav: Books | Authors | Publishers
- List pages: create button; row actions edit / delete
- Delete confirmation dialogs:
  - **Author:** “This author is linked to the following books. Removing the author will unlink them from those books: …”
  - **Publisher:** “This publisher is used in the following books. Removing the publisher will unlink it from those books: …”
- Affected book titles loaded before confirming delete
- Minimal functional styling (default Angular look)
- API base URL via environment (`http://localhost:8080`)

## Testing (v1)

- Backend: focused tests for book create with author/publisher ids, and unlink-on-delete for author and publisher
- Frontend: no automated e2e in v1; manual verification via README

## README

Root README must document:

1. Prerequisites: Docker, JDK 21, Node.js (compatible with chosen Angular version)
2. Start Postgres: `docker compose up -d`
3. Start backend: Gradle `bootRun` (from `backend/`)
4. Start frontend: `ng serve` (from `frontend/`)
5. URLs: API `http://localhost:8080`, UI `http://localhost:4200`

## Out of scope (v1)

- Authentication / authorization
- Pagination, search, sorting beyond simple full lists
- Dockerizing backend or frontend
- Production deployment config
- Heavy frontend e2e suite
