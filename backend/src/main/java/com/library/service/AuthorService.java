package com.library.service;

import com.library.dto.AuthorRequest;
import com.library.dto.AuthorResponse;
import com.library.dto.BookSummaryResponse;
import com.library.entity.Author;
import com.library.exception.NotFoundException;
import com.library.repository.AuthorRepository;
import com.library.repository.BookRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AuthorService {
    private final AuthorRepository repository;
    private final BookRepository bookRepository;

    public AuthorService(AuthorRepository repository, BookRepository bookRepository) {
        this.repository = repository;
        this.bookRepository = bookRepository;
    }

    @Transactional(readOnly = true)
    public List<AuthorResponse> findAll() {
        return repository.findAll().stream().map(AuthorResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AuthorResponse findById(UUID id) {
        return AuthorResponse.from(get(id));
    }

    @Transactional(readOnly = true)
    public List<BookSummaryResponse> findBooksByAuthorId(UUID id) {
        get(id);
        return bookRepository.findAllByAuthorId(id).stream().map(BookSummaryResponse::from).toList();
    }

    public AuthorResponse create(AuthorRequest request) {
        Author author = new Author(UUID.randomUUID(), request.firstName(), request.lastName(), request.birthDate());
        return AuthorResponse.from(repository.save(author));
    }

    public AuthorResponse update(UUID id, AuthorRequest request) {
        Author author = get(id);
        author.setFirstName(request.firstName());
        author.setLastName(request.lastName());
        author.setBirthDate(request.birthDate());
        return AuthorResponse.from(author);
    }

    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Author not found: " + id);
        }
        repository.deleteById(id);
    }

    Author get(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Author not found: " + id));
    }
}
