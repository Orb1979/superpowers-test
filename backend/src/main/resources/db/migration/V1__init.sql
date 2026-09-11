CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    book_id UUID NOT NULL,
    CONSTRAINT uq_author_book UNIQUE (author_id, book_id),
    CONSTRAINT fk_author_book_author
        FOREIGN KEY (author_id) REFERENCES author (id) ON DELETE CASCADE,
    CONSTRAINT fk_author_book_book
        FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE
);

CREATE TABLE book_publisher (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL,
    publisher_id UUID NOT NULL,
    CONSTRAINT uq_book_publisher UNIQUE (book_id, publisher_id),
    CONSTRAINT fk_book_publisher_book
        FOREIGN KEY (book_id) REFERENCES book (id) ON DELETE CASCADE,
    CONSTRAINT fk_book_publisher_publisher
        FOREIGN KEY (publisher_id) REFERENCES publisher (id) ON DELETE CASCADE
);
