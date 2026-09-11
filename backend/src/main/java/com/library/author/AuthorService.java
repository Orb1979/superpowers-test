package com.library.author;

import com.library.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AuthorService {
    private final AuthorRepository repository;

    public AuthorService(AuthorRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AuthorResponse> findAll() {
        return repository.findAll().stream().map(AuthorResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AuthorResponse findById(UUID id) {
        return AuthorResponse.from(get(id));
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
