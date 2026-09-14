package com.library.dto;

public record ErrorResponse(String message, String field) {
    public ErrorResponse(String message) {
        this(message, null);
    }
}
