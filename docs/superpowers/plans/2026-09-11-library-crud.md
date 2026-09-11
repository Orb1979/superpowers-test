# Library CRUD App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Spring Boot (Gradle) + Angular library CRUD app with Postgres, many-to-many books↔authors and books↔publishers, and unlink-on-delete with UI warnings.

**Architecture:** Monorepo with `docker-compose.yml` (Postgres only), `backend/` Spring Boot 3 REST API (JPA + Flyway), and `frontend/` Angular standalone app. Local API on `:8080`, UI on `:4200`, CORS enabled for local Angular.

**Tech Stack:** Java 21, Spring Boot 3.4.x, Gradle, Spring Data JPA, Flyway, PostgreSQL 16, Angular 19 (standalone), Docker Compose.

## Global Constraints

- No authentication
- Schema owned by Flyway only (`spring.jpa.hibernate.ddl-auto=validate`)
- Book may have 0..N authors and 0..N publishers
- Delete author/publisher unlinks join rows only; books remain
- Delete warnings must list linked book titles before confirm
- Root README must document how to start DB, backend, and frontend
- Backend tests cover book create with links + unlink-on-delete; no frontend e2e in v1

---

## File Structure

```
/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/V1__init.sql
│   └── src/main/java/com/library/
│       ├── LibraryApplication.java
│       ├── config/WebConfig.java
│       ├── common/ApiExceptionHandler.java
│       ├── common/ErrorResponse.java
│       ├── common/NotFoundException.java
│       ├── common/ConflictException.java
│       ├── publisher/
│       │   ├── Publisher.java
│       │   ├── PublisherRepository.java
│       │   ├── PublisherRequest.java
│       │   ├── PublisherResponse.java
│       │   ├── PublisherService.java
│       │   └── PublisherController.java
│       ├── author/
│       │   ├── Author.java
│       │   ├── AuthorRepository.java
│       │   ├── AuthorRequest.java
│       │   ├── AuthorResponse.java
│       │   ├── AuthorService.java
│       │   └── AuthorController.java
│       └── book/
│           ├── Book.java
│           ├── BookRepository.java
│           ├── BookRequest.java
│           ├── BookResponse.java
│           ├── BookSummaryResponse.java
│           ├── BookService.java
│           └── BookController.java
│   └── src/test/java/com/library/book/BookIntegrationTest.java
└── frontend/
    ├── package.json
    ├── src/environments/environment.ts
    └── src/app/
        ├── app.routes.ts
        ├── app.config.ts
        ├── app.component.ts
        ├── models/
        ├── services/
        │   ├── publisher.service.ts
        │   ├── author.service.ts
        │   └── book.service.ts
        ├── publishers/
        ├── authors/
        └── books/
```

Join tables `author_book` and `book_publisher` are mapped as JPA `@ManyToMany` with `@JoinTable` (no separate entity classes). DB still owns surrogate `id` columns on join tables via Flyway; Hibernate can use the join table without mapping those ids.

---

### Task 1: Postgres Compose + Flyway migration SQL

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/src/main/resources/db/migration/V1__init.sql`
- Create: `backend/src/main/resources/application.yml` (minimal DB + Flyway placeholders; full Spring app in Task 2)

**Interfaces:**
- Produces: Postgres on `localhost:5432`, db/user/password `library`/`library`/`library`; Flyway `V1__init.sql` matching the design schema

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: library-postgres
    environment:
      POSTGRES_DB: library
      POSTGRES_USER: library
      POSTGRES_PASSWORD: library
    ports:
      - "5432:5432"
    volumes:
      - library_pgdata:/var/lib/postgresql/data

volumes:
  library_pgdata:
```

- [ ] **Step 2: Create Flyway V1 migration**

Create `backend/src/main/resources/db/migration/V1__init.sql`:

```sql
CREATE TABLE publisher (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100)
);

CREATE TABLE author (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE
);

CREATE TABLE book (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    sub_title VARCHAR(500) NOT NULL,
    description TEXT,
    pages INTEGER NOT NULL,
    isbn VARCHAR(20) UNIQUE
);

CREATE TABLE author_book (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL,
    book_id UUID NOT NULL,
    CONSTRAINT uq_author_book UNIQUE (author_id, book_id),
    CONSTRAINT fk_author_book_author
        FOREIGN KEY (author_id) REFERENCES author (id) ON DELETE CASCADE,
    CONSTRAINT fk_author_book_book
        FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE
);

CREATE TABLE book_publisher (
    id UUID PRIMARY KEY,
    book_id UUID NOT NULL,
    publisher_id UUID NOT NULL,
    CONSTRAINT uq_book_publisher UNIQUE (book_id, publisher_id),
    CONSTRAINT fk_book_publisher_book
        FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE,
    CONSTRAINT fk_book_publisher_publisher
        FOREIGN KEY (publisher_id) REFERENCES publisher (id) ON DELETE CASCADE
);
```

- [ ] **Step 3: Start Postgres and verify**

Run:

```bash
docker compose up -d
docker compose ps
docker exec library-postgres psql -U library -d library -c '\dt'
```

Expected: container healthy/running; `\dt` may show no tables yet (Flyway runs with the app). Connection works.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml backend/src/main/resources/db/migration/V1__init.sql
git commit -m "chore: add Postgres compose and Flyway V1 schema"
```

---

### Task 2: Spring Boot Gradle scaffold

**Files:**
- Create: `backend/settings.gradle.kts`
- Create: `backend/build.gradle.kts`
- Create: `backend/gradle.properties` (optional)
- Create: `backend/src/main/java/com/library/LibraryApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: Gradle wrapper via `gradle wrapper` (or Spring Initializr equivalent)

**Interfaces:**
- Consumes: Postgres from Task 1; `V1__init.sql`
- Produces: Runnable app on `:8080` that applies Flyway on startup

- [ ] **Step 1: Create Gradle project files**

`backend/settings.gradle.kts`:

```kotlin
rootProject.name = "library-api"
```

`backend/build.gradle.kts`:

```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.4.3"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.library"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

- [ ] **Step 2: Create application entrypoint and config**

`backend/src/main/java/com/library/LibraryApplication.java`:

```java
package com.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryApplication {
    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

`backend/src/main/resources/application.yml`:

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/library
    username: library
    password: library
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    properties:
      hibernate:
        jdbc:
          time_zone: UTC
  flyway:
    enabled: true
```

- [ ] **Step 3: Generate Gradle wrapper and boot the app**

From `backend/`:

```bash
gradle wrapper --gradle-version 8.12.1
./gradlew bootRun
```

Expected: app starts; Flyway applies `V1__init.sql`; logs show started on 8080.

Verify tables:

```bash
docker exec library-postgres psql -U library -d library -c '\dt'
```

Expected: `publisher`, `author`, `book`, `author_book`, `book_publisher`, `flyway_schema_history`.

Stop the app (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add backend/
git commit -m "chore: scaffold Spring Boot Gradle backend with Flyway"
```

---

### Task 3: Publisher CRUD API

**Files:**
- Create: `backend/src/main/java/com/library/common/NotFoundException.java`
- Create: `backend/src/main/java/com/library/common/ErrorResponse.java`
- Create: `backend/src/main/java/com/library/common/ApiExceptionHandler.java`
- Create: `backend/src/main/java/com/library/publisher/Publisher.java`
- Create: `backend/src/main/java/com/library/publisher/PublisherRepository.java`
- Create: `backend/src/main/java/com/library/publisher/PublisherRequest.java`
- Create: `backend/src/main/java/com/library/publisher/PublisherResponse.java`
- Create: `backend/src/main/java/com/library/publisher/PublisherService.java`
- Create: `backend/src/main/java/com/library/publisher/PublisherController.java`
- Test: `backend/src/test/java/com/library/publisher/PublisherIntegrationTest.java`
- Create: `backend/src/test/resources/application-test.yml` (if needed; prefer Testcontainers DynamicPropertySource)

**Interfaces:**
- Produces:
  - `PublisherResponse(UUID id, String name, String country)`
  - `POST/GET/PUT/DELETE /api/publishers[/{id}]`
  - `NotFoundException` → 404 via `ApiExceptionHandler`

- [ ] **Step 1: Write failing integration test**

`backend/src/test/java/com/library/publisher/PublisherIntegrationTest.java`:

```java
package com.library.publisher;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class PublisherIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("library")
            .withUsername("library")
            .withPassword("library");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mockMvc;

    @Test
    void createAndGetPublisher() throws Exception {
        String body = """
            {"name":"Penguin","country":"UK"}
            """;

        String locationJson = mockMvc.perform(post("/api/publishers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Penguin"))
                .andReturn().getResponse().getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(locationJson, "$.id");

        mockMvc.perform(get("/api/publishers/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.country").value("UK"));
    }
}
```

Add to `build.gradle.kts` dependencies if JsonPath not transitive:

```kotlin
testImplementation("com.jayway.jsonpath:json-path")
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && ./gradlew test --tests com.library.publisher.PublisherIntegrationTest
```

Expected: FAIL (missing controller/mapping or context failure).

- [ ] **Step 3: Implement common errors + publisher stack**

`NotFoundException.java`:

```java
package com.library.common;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
```

`ErrorResponse.java`:

```java
package com.library.common;

public record ErrorResponse(String message) {}
```

`ApiExceptionHandler.java`:

```java
package com.library.common;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> notFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + " " + err.getDefaultMessage())
                .orElse("Validation failed");
        return ResponseEntity.badRequest().body(new ErrorResponse(msg));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> conflict(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("Data conflict (e.g. duplicate ISBN)"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }
}
```

`Publisher.java`:

```java
package com.library.publisher;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "publisher")
public class Publisher {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String country;

    protected Publisher() {}

    public Publisher(UUID id, String name, String country) {
        this.id = id;
        this.name = name;
        this.country = country;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getCountry() { return country; }

    public void setName(String name) { this.name = name; }
    public void setCountry(String country) { this.country = country; }
}
```

`PublisherRepository.java`:

```java
package com.library.publisher;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PublisherRepository extends JpaRepository<Publisher, UUID> {}
```

`PublisherRequest.java`:

```java
package com.library.publisher;

import jakarta.validation.constraints.NotBlank;

public record PublisherRequest(
        @NotBlank String name,
        String country
) {}
```

`PublisherResponse.java`:

```java
package com.library.publisher;

import java.util.UUID;

public record PublisherResponse(UUID id, String name, String country) {
    public static PublisherResponse from(Publisher p) {
        return new PublisherResponse(p.getId(), p.getName(), p.getCountry());
    }
}
```

`PublisherService.java`:

```java
package com.library.publisher;

import com.library.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PublisherService {

    private final PublisherRepository repository;

    public PublisherService(PublisherRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PublisherResponse> findAll() {
        return repository.findAll().stream().map(PublisherResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PublisherResponse findById(UUID id) {
        return PublisherResponse.from(get(id));
    }

    public PublisherResponse create(PublisherRequest request) {
        Publisher publisher = new Publisher(UUID.randomUUID(), request.name(), request.country());
        return PublisherResponse.from(repository.save(publisher));
    }

    public PublisherResponse update(UUID id, PublisherRequest request) {
        Publisher publisher = get(id);
        publisher.setName(request.name());
        publisher.setCountry(request.country());
        return PublisherResponse.from(publisher);
    }

    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Publisher not found: " + id);
        }
        repository.deleteById(id);
    }

    Publisher get(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Publisher not found: " + id));
    }
}
```

`PublisherController.java`:

```java
package com.library.publisher;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/publishers")
public class PublisherController {

    private final PublisherService service;

    public PublisherController(PublisherService service) {
        this.service = service;
    }

    @GetMapping
    public List<PublisherResponse> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public PublisherResponse get(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PublisherResponse create(@Valid @RequestBody PublisherRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public PublisherResponse update(@PathVariable UUID id, @Valid @RequestBody PublisherRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && ./gradlew test --tests com.library.publisher.PublisherIntegrationTest
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/library/common backend/src/main/java/com/library/publisher backend/src/test backend/build.gradle.kts
git commit -m "feat: add publisher CRUD API"
```

---

### Task 4: Author CRUD API

**Files:**
- Create: `backend/src/main/java/com/library/author/Author.java`
- Create: `backend/src/main/java/com/library/author/AuthorRepository.java`
- Create: `backend/src/main/java/com/library/author/AuthorRequest.java`
- Create: `backend/src/main/java/com/library/author/AuthorResponse.java`
- Create: `backend/src/main/java/com/library/author/AuthorService.java`
- Create: `backend/src/main/java/com/library/author/AuthorController.java`
- Test: `backend/src/test/java/com/library/author/AuthorIntegrationTest.java`

**Interfaces:**
- Produces: `AuthorResponse(UUID id, String firstName, String lastName, LocalDate birthDate)` mapped from JSON `firstName`/`lastName`/`birthDate`
- Endpoints: `/api/authors` CRUD (same shape as publishers)

- [ ] **Step 1: Write failing test**

`backend/src/test/java/com/library/author/AuthorIntegrationTest.java` — same Testcontainers/`MockMvc` setup as `PublisherIntegrationTest`, with:

```java
@Test
void createAndGetAuthor() throws Exception {
    String body = """
        {"firstName":"Ada","lastName":"Lovelace","birthDate":"1815-12-10"}
        """;

    String json = mockMvc.perform(post("/api/authors")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.firstName").value("Ada"))
            .andExpect(jsonPath("$.lastName").value("Lovelace"))
            .andReturn().getResponse().getContentAsString();

    String id = com.jayway.jsonpath.JsonPath.read(json, "$.id");

    mockMvc.perform(get("/api/authors/" + id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.birthDate").value("1815-12-10"));
}
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && ./gradlew test --tests com.library.author.AuthorIntegrationTest
```

Expected: FAIL (no `/api/authors` mapping).

- [ ] **Step 3: Implement author package**

`Author.java`:

```java
package com.library.author;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "author")
public class Author {
    @Id
    private UUID id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    protected Author() {}

    public Author(UUID id, String firstName, String lastName, LocalDate birthDate) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.birthDate = birthDate;
    }

    public UUID getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public LocalDate getBirthDate() { return birthDate; }

    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
}
```

`AuthorRepository.java`:

```java
package com.library.author;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AuthorRepository extends JpaRepository<Author, UUID> {}
```

`AuthorRequest.java`:

```java
package com.library.author;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record AuthorRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        LocalDate birthDate
) {}
```

`AuthorResponse.java`:

```java
package com.library.author;

import java.time.LocalDate;
import java.util.UUID;

public record AuthorResponse(UUID id, String firstName, String lastName, LocalDate birthDate) {
    public static AuthorResponse from(Author a) {
        return new AuthorResponse(a.getId(), a.getFirstName(), a.getLastName(), a.getBirthDate());
    }
}
```

`AuthorService.java`:

```java
package com.library.author;

import com.library.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AuthorService {
    private final AuthorRepository repository;

    public AuthorService(AuthorRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AuthorResponse> findAll() {
        return repository.findAll().stream().map(AuthorResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AuthorResponse findById(UUID id) {
        return AuthorResponse.from(get(id));
    }

    public AuthorResponse create(AuthorRequest request) {
        Author author = new Author(UUID.randomUUID(), request.firstName(), request.lastName(), request.birthDate());
        return AuthorResponse.from(repository.save(author));
    }

    public AuthorResponse update(UUID id, AuthorRequest request) {
        Author author = get(id);
        author.setFirstName(request.firstName());
        author.setLastName(request.lastName());
        author.setBirthDate(request.birthDate());
        return AuthorResponse.from(author);
    }

    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Author not found: " + id);
        }
        repository.deleteById(id);
    }

    Author get(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Author not found: " + id));
    }
}
```

`AuthorController.java`:

```java
package com.library.author;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/authors")
public class AuthorController {
    private final AuthorService service;

    public AuthorController(AuthorService service) {
        this.service = service;
    }

    @GetMapping
    public List<AuthorResponse> list() { return service.findAll(); }

    @GetMapping("/{id}")
    public AuthorResponse get(@PathVariable UUID id) { return service.findById(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AuthorResponse create(@Valid @RequestBody AuthorRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public AuthorResponse update(@PathVariable UUID id, @Valid @RequestBody AuthorRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { service.delete(id); }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd backend && ./gradlew test --tests com.library.author.AuthorIntegrationTest
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/library/author backend/src/test/java/com/library/author
git commit -m "feat: add author CRUD API"
```

---

### Task 5: Book CRUD with author/publisher links

**Files:**
- Create: `backend/src/main/java/com/library/book/Book.java`
- Create: `backend/src/main/java/com/library/book/BookRepository.java`
- Create: `backend/src/main/java/com/library/book/BookRequest.java`
- Create: `backend/src/main/java/com/library/book/BookResponse.java`
- Create: `backend/src/main/java/com/library/book/BookService.java`
- Create: `backend/src/main/java/com/library/book/BookController.java`
- Modify: `backend/src/main/java/com/library/author/Author.java` (add books ManyToMany inverse optional — prefer owning side only on Book)
- Modify: `backend/src/main/java/com/library/publisher/Publisher.java` (same)
- Test: `backend/src/test/java/com/library/book/BookIntegrationTest.java`

**Interfaces:**
- Consumes: `AuthorRepository`, `PublisherRepository`
- Produces:
  - `BookRequest(String title, String subTitle, String description, Integer pages, String isbn, List<UUID> authorIds, List<UUID> publisherIds)`
  - `BookResponse` with nested `List<AuthorResponse> authors` and `List<PublisherResponse> publishers`
  - CRUD `/api/books`

**Join table mapping note:** Flyway join tables have an `id` column. Map with `@JoinTable` using only FK columns; add DB default for `id` so inserts from Hibernate work:

Amend migration (new file `V2__join_table_defaults.sql`) OR change V1 before first production deploy (safe here — regenerate):

```sql
-- Prefer editing V1 if DB can be wiped:
-- ALTER pattern for greenfield: recreate volume
```

Preferred greenfield fix — update `V1__init.sql` join tables:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
```

Enable extension at top of V1:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

If Postgres volume already migrated, `docker compose down -v` then up again before continuing.

- [ ] **Step 1: Write failing BookIntegrationTest**

Test flow:
1. Create author + publisher via API
2. POST `/api/books` with `authorIds` and `publisherIds`
3. Expect 201 with embedded authors/publishers
4. Delete author → GET book still exists with empty authors list
5. Delete publisher → book still exists with empty publishers list

```java
@Test
void createBookWithLinksAndUnlinkOnDelete() throws Exception {
    String authorId = JsonPath.read(mockMvc.perform(post("/api/authors")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"firstName":"Ada","lastName":"Lovelace","birthDate":"1815-12-10"}
                """))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString(), "$.id");

    String publisherId = JsonPath.read(mockMvc.perform(post("/api/publishers")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"Penguin","country":"UK"}
                """))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString(), "$.id");

    String bookJson = mockMvc.perform(post("/api/books")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title":"Notes",
                  "subTitle":"On Babbage",
                  "description":"Essay",
                  "pages":120,
                  "isbn":"ISBN-1",
                  "authorIds":["%s"],
                  "publisherIds":["%s"]
                }
                """.formatted(authorId, publisherId)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.authors[0].firstName").value("Ada"))
            .andExpect(jsonPath("$.publishers[0].name").value("Penguin"))
            .andReturn().getResponse().getContentAsString();

    String bookId = JsonPath.read(bookJson, "$.id");

    mockMvc.perform(delete("/api/authors/" + authorId)).andExpect(status().isNoContent());
    mockMvc.perform(get("/api/books/" + bookId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.authors").isEmpty());

    mockMvc.perform(delete("/api/publishers/" + publisherId)).andExpect(status().isNoContent());
    mockMvc.perform(get("/api/books/" + bookId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.publishers").isEmpty());
}
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && ./gradlew test --tests com.library.book.BookIntegrationTest
```

- [ ] **Step 3: Implement Book entity and service**

`Book.java` (core mapping):

```java
@ManyToMany
@JoinTable(
    name = "author_book",
    joinColumns = @JoinColumn(name = "book_id"),
    inverseJoinColumns = @JoinColumn(name = "author_id")
)
private Set<Author> authors = new HashSet<>();

@ManyToMany
@JoinTable(
    name = "book_publisher",
    joinColumns = @JoinColumn(name = "book_id"),
    inverseJoinColumns = @JoinColumn(name = "publisher_id")
)
private Set<Publisher> publishers = new HashSet<>();
```

Map `subTitle` → column `sub_title`.

`BookRequest`:

```java
public record BookRequest(
        @NotBlank String title,
        @NotBlank String subTitle,
        String description,
        @NotNull @Min(1) Integer pages,
        String isbn,
        List<UUID> authorIds,
        List<UUID> publisherIds
) {
    public List<UUID> authorIds() {
        return authorIds == null ? List.of() : authorIds;
    }
    public List<UUID> publisherIds() {
        return publisherIds == null ? List.of() : publisherIds;
    }
}
```

Note: custom accessors on records must not conflict — prefer normalizing in the service instead:

```java
List<UUID> authors = request.authorIds() == null ? List.of() : request.authorIds();
```

`BookService.create/update`: load authors/publishers by ids; if any missing → `NotFoundException` or `IllegalArgumentException` (400). Replace collection contents on update.

`BookResponse.from(Book)` embeds `AuthorResponse` / `PublisherResponse` lists.

`BookController` under `/api/books` with same CRUD verbs as publishers.

- [ ] **Step 4: Run test — expect PASS**

```bash
cd backend && ./gradlew test --tests com.library.book.BookIntegrationTest
```

Also run full suite:

```bash
cd backend && ./gradlew test
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/resources/db/migration backend/src/main/java/com/library/book backend/src/test/java/com/library/book
git commit -m "feat: add book CRUD with author and publisher links"
```

---

### Task 6: Linked-books endpoints + CORS

**Files:**
- Modify: `backend/src/main/java/com/library/author/AuthorController.java`
- Modify: `backend/src/main/java/com/library/author/AuthorService.java`
- Modify: `backend/src/main/java/com/library/publisher/PublisherController.java`
- Modify: `backend/src/main/java/com/library/publisher/PublisherService.java`
- Create: `backend/src/main/java/com/library/book/BookSummaryResponse.java`
- Create: `backend/src/main/java/com/library/book/BookRepository.java` query methods (if not already)
- Create: `backend/src/main/java/com/library/config/WebConfig.java`
- Modify: `backend/src/test/java/com/library/book/BookIntegrationTest.java` (add linked-books assertions)

**Interfaces:**
- Produces:
  - `GET /api/authors/{id}/books` → `List<BookSummaryResponse>` where `BookSummaryResponse(UUID id, String title)`
  - `GET /api/publishers/{id}/books` → same
  - CORS allows `http://localhost:4200`

- [ ] **Step 1: Extend failing assertions in test**

After creating a linked book, before delete:

```java
mockMvc.perform(get("/api/authors/" + authorId + "/books"))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$[0].title").value("Notes"));

mockMvc.perform(get("/api/publishers/" + publisherId + "/books"))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$[0].title").value("Notes"));
```

- [ ] **Step 2: Run test — expect FAIL on new endpoints**

- [ ] **Step 3: Implement repository queries + endpoints + CORS**

`BookRepository`:

```java
@Query("""
    select b from Book b join b.authors a where a.id = :authorId
    """)
List<Book> findAllByAuthorId(@Param("authorId") UUID authorId);

@Query("""
    select b from Book b join b.publishers p where p.id = :publisherId
    """)
List<Book> findAllByPublisherId(@Param("publisherId") UUID publisherId);
```

`BookSummaryResponse`:

```java
public record BookSummaryResponse(UUID id, String title) {
    public static BookSummaryResponse from(Book b) {
        return new BookSummaryResponse(b.getId(), b.getTitle());
    }
}
```

Wire through AuthorService/PublisherService (inject BookRepository) and add controller mappings.

`WebConfig.java`:

```java
package com.library.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
    }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd backend && ./gradlew test
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/library backend/src/test
git commit -m "feat: add linked-books endpoints and CORS"
```

---

### Task 7: Angular scaffold + models + services

**Files:**
- Create: `frontend/` via Angular CLI
- Create: `frontend/src/environments/environment.ts`
- Create: `frontend/src/app/models/*.ts`
- Create: `frontend/src/app/services/{publisher,author,book}.service.ts`
- Modify: `frontend/src/app/app.config.ts` (provideHttpClient)
- Modify: `frontend/src/app/app.routes.ts`
- Modify: `frontend/src/app/app.component.ts` (nav shell)

**Interfaces:**
- Consumes: backend API at `http://localhost:8080/api`
- Produces: typed services used by later UI tasks

- [ ] **Step 1: Scaffold Angular app**

From repo root (Node 20+):

```bash
npx -y @angular/cli@19 new frontend --directory=frontend --routing --style=css --ssr=false --skip-git
```

- [ ] **Step 2: Add environment + models + HTTP**

`frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  apiBaseUrl: 'http://localhost:8080/api',
};
```

Models (example `publisher.model.ts`):

```typescript
export interface Publisher {
  id: string;
  name: string;
  country?: string | null;
}

export interface PublisherRequest {
  name: string;
  country?: string | null;
}
```

`author.model.ts`: `id`, `firstName`, `lastName`, `birthDate`.

`book.model.ts`:

```typescript
export interface Book {
  id: string;
  title: string;
  subTitle: string;
  description?: string | null;
  pages: number;
  isbn?: string | null;
  authors: Author[];
  publishers: Publisher[];
}

export interface BookRequest {
  title: string;
  subTitle: string;
  description?: string | null;
  pages: number;
  isbn?: string | null;
  authorIds: string[];
  publisherIds: string[];
}

export interface BookSummary {
  id: string;
  title: string;
}
```

Services use `HttpClient` + `environment.apiBaseUrl`. Include `listBooksByAuthor(id)` → `GET /authors/{id}/books` and `listBooksByPublisher(id)`.

In `app.config.ts`:

```typescript
provideHttpClient()
```

- [ ] **Step 3: Nav shell + empty routes**

`app.component.ts` template:

```html
<nav>
  <a routerLink="/books">Books</a> |
  <a routerLink="/authors">Authors</a> |
  <a routerLink="/publishers">Publishers</a>
</nav>
<router-outlet />
```

Routes placeholder paths for books/authors/publishers (components added in later tasks — use empty standalone stubs if needed so `ng serve` works).

- [ ] **Step 4: Manual verify**

```bash
cd frontend && npm start
```

Expected: app loads at `http://localhost:4200` with nav links.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "chore: scaffold Angular app with API services"
```

---

### Task 8: Publishers UI (list / form / delete)

**Files:**
- Create: `frontend/src/app/publishers/publisher-list.component.ts`
- Create: `frontend/src/app/publishers/publisher-form.component.ts`
- Modify: `frontend/src/app/app.routes.ts`

**Interfaces:**
- Consumes: `PublisherService`
- Produces: routes `/publishers`, `/publishers/new`, `/publishers/:id/edit`

- [ ] **Step 1: Implement list + form components**

List: table of name/country; buttons Create / Edit / Delete.

Form: reactive form fields `name` (required), `country`; on submit POST or PUT; navigate back to list.

Delete (temporary confirm): `confirm('Delete publisher?')` then call delete — full warning text comes in Task 11.

- [ ] **Step 2: Wire routes**

```typescript
{ path: 'publishers', component: PublisherListComponent },
{ path: 'publishers/new', component: PublisherFormComponent },
{ path: 'publishers/:id/edit', component: PublisherFormComponent },
{ path: '', pathMatch: 'full', redirectTo: 'books' },
```

- [ ] **Step 3: Manual verify with backend running**

```bash
# terminal 1
cd backend && ./gradlew bootRun
# terminal 2
cd frontend && npm start
```

Create, edit, list a publisher via UI.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app
git commit -m "feat: add publishers Angular CRUD screens"
```

---

### Task 9: Authors UI (list / form / delete)

**Files:**
- Create: `frontend/src/app/authors/author-list.component.ts`
- Create: `frontend/src/app/authors/author-form.component.ts`
- Modify: `frontend/src/app/app.routes.ts`

**Interfaces:**
- Consumes: `AuthorService`
- Produces: routes `/authors`, `/authors/new`, `/authors/:id/edit`

- [ ] **Step 1: Implement list + form**

Fields: `firstName`, `lastName`, `birthDate` (date input). Same patterns as publishers.

- [ ] **Step 2: Manual verify create/edit/list**

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/authors frontend/src/app/app.routes.ts
git commit -m "feat: add authors Angular CRUD screens"
```

---

### Task 10: Books UI with multi-select authors/publishers

**Files:**
- Create: `frontend/src/app/books/book-list.component.ts`
- Create: `frontend/src/app/books/book-form.component.ts`
- Modify: `frontend/src/app/app.routes.ts`

**Interfaces:**
- Consumes: `BookService`, `AuthorService`, `PublisherService`
- Produces: routes `/books`, `/books/new`, `/books/:id/edit`

- [ ] **Step 1: Implement book list**

Show title, subtitle, author names, publisher names.

- [ ] **Step 2: Implement book form**

Fields: title, subTitle, description, pages, isbn.

Multi-select: `<select multiple>` bound to `authorIds` / `publisherIds`, options loaded from author/publisher list endpoints.

On edit: patch form from `GET /books/:id` including selected ids from embedded relations.

- [ ] **Step 3: Manual verify**

Create authors/publishers first, then create a book with both selected; edit links; list shows names.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/books frontend/src/app/app.routes.ts
git commit -m "feat: add books Angular CRUD with author/publisher multi-select"
```

---

### Task 11: Delete warning dialogs for author & publisher

**Files:**
- Modify: `frontend/src/app/authors/author-list.component.ts`
- Modify: `frontend/src/app/publishers/publisher-list.component.ts`
- Optionally create: `frontend/src/app/shared/confirm-delete.dialog.ts` (simple component or window.confirm with composed message)

**Interfaces:**
- Consumes: `AuthorService.listBooksByAuthor`, `PublisherService.listBooksByPublisher`

- [ ] **Step 1: Author delete warning**

On delete click:
1. `GET /api/authors/{id}/books`
2. Build message:
   - If books empty: `Delete this author?`
   - Else: `This author is linked to the following books. Removing the author will unlink them from those books: {titles}. Continue?`
3. Confirm → DELETE author → refresh list

- [ ] **Step 2: Publisher delete warning**

Same pattern with exact copy:

`This publisher is used in the following books. Removing the publisher will unlink it from those books: {titles}. Continue?`

- [ ] **Step 3: Manual verify**

Link a book to an author and publisher; delete each; confirm warning lists the book title; book remains with unlinked relations.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app
git commit -m "feat: warn before unlinking authors and publishers on delete"
```

---

### Task 12: Root README

**Files:**
- Create: `README.md`

**Interfaces:**
- Produces: documented start path for new contributors

- [ ] **Step 1: Write README**

Include:

```markdown
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

## Tests

```bash
cd backend && ./gradlew test
```
```

- [ ] **Step 2: Smoke-check commands match reality** (wrapper present, scripts named `start`)

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with run instructions"
```

---

## Self-Review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| docker-compose Postgres | Task 1 |
| Flyway schema without book.publisher_id; book_publisher M2M | Task 1 (+ Task 5 join defaults) |
| Spring Boot Gradle Java 21 | Task 2 |
| Publisher/Author/Book CRUD APIs | Tasks 3–5 |
| Book authorIds/publisherIds + embedded responses | Task 5 |
| Unlink-on-delete author/publisher | Task 5 tests |
| GET author/publisher linked books | Task 6 |
| CORS localhost:4200 | Task 6 |
| 404/400/409 JSON errors | Task 3 handler (reused) |
| Angular full CRUD screens | Tasks 8–10 |
| Delete warning copy | Task 11 |
| README start instructions | Task 12 |
| Backend focused tests | Tasks 3–6 |
| No auth / no e2e | Global constraints |

No placeholders remaining after review. Join-table `id DEFAULT gen_random_uuid()` called out explicitly so Hibernate `@JoinTable` inserts succeed.
