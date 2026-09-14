package com.library.web;

import com.library.dto.AuthorRequest;
import com.library.dto.AuthorResponse;
import com.library.dto.BookSummaryResponse;
import com.library.service.AuthorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/authors")
@RequiredArgsConstructor
public class AuthorController {
    private final AuthorService service;

    @GetMapping
    public List<AuthorResponse> list() { return service.findAll(); }

    @GetMapping("/{id}")
    public AuthorResponse get(@PathVariable UUID id) { return service.findById(id); }

    @GetMapping("/{id}/books")
    public List<BookSummaryResponse> books(@PathVariable UUID id) {
        return service.findBooksByAuthorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AuthorResponse create(@Valid @RequestBody AuthorRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public AuthorResponse update(@PathVariable UUID id, @Valid @RequestBody AuthorRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { service.delete(id); }
}
