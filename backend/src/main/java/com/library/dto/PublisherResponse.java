package com.library.dto;

import com.library.entity.Publisher;

import java.util.UUID;

public record PublisherResponse(UUID id, String name, String country) {
    public static PublisherResponse from(Publisher p) {
        return new PublisherResponse(p.getId(), p.getName(), p.getCountry());
    }
}
