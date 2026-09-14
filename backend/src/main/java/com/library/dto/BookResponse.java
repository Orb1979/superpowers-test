package com.library.dto;

import com.library.entity.Book;

import java.util.List;
import java.util.UUID;

public record BookResponse(
        UUID id,
        String title,
        String subTitle,
        String description,
        Integer pages,
        String isbn,
        List<AuthorResponse> authors,
        List<PublisherResponse> publishers
) {
    public static BookResponse from(Book book) {
        return new BookResponse(
                book.getId(),
                book.getTitle(),
                book.getSubTitle(),
                book.getDescription(),
                book.getPages(),
                book.getIsbn(),
                book.getAuthors().stream().map(AuthorResponse::from).toList(),
                book.getPublishers().stream().map(PublisherResponse::from).toList()
        );
    }
}
