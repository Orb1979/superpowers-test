package com.library.publisher;

import jakarta.validation.constraints.NotBlank;

public record PublisherRequest(
        @NotBlank String name,
        String country
) {}
