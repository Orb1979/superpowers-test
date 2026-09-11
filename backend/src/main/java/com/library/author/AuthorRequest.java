package com.library.author;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record AuthorRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        LocalDate birthDate
) {}
