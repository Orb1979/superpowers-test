package com.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record BookRequest(
        @NotBlank String title,
        @NotBlank String subTitle,
        String description,
        @NotNull @Min(1) Integer pages,
        String isbn,
        List<UUID> authorIds,
        List<UUID> publisherIds
) {}
