package com.library.author;

import java.time.LocalDate;
import java.util.UUID;

public record AuthorResponse(UUID id, String firstName, String lastName, LocalDate birthDate) {
    public static AuthorResponse from(Author a) {
        return new AuthorResponse(a.getId(), a.getFirstName(), a.getLastName(), a.getBirthDate());
    }
}
