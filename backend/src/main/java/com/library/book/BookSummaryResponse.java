package com.library.book;

import java.util.UUID;

public record BookSummaryResponse(UUID id, String title) {
    public static BookSummaryResponse from(Book b) {
        return new BookSummaryResponse(b.getId(), b.getTitle());
    }
}
