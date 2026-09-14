package com.library.dto;

import com.library.entity.Book;

import java.util.UUID;

public record BookSummaryResponse(UUID id, String title) {
    public static BookSummaryResponse from(Book b) {
        return new BookSummaryResponse(b.getId(), b.getTitle());
    }
}
