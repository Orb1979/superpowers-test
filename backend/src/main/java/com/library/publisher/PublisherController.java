package com.library.publisher;

import com.library.book.BookSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/publishers")
public class PublisherController {

    private final PublisherService service;

    public PublisherController(PublisherService service) {
        this.service = service;
    }

    @GetMapping
    public List<PublisherResponse> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public PublisherResponse get(@PathVariable UUID id) {
        return service.findById(id);
    }

    @GetMapping("/{id}/books")
    public List<BookSummaryResponse> books(@PathVariable UUID id) {
        return service.findBooksByPublisherId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PublisherResponse create(@Valid @RequestBody PublisherRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public PublisherResponse update(@PathVariable UUID id, @Valid @RequestBody PublisherRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
