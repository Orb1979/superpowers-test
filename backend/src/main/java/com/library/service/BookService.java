package com.library.service;

import com.library.dto.BookRequest;
import com.library.dto.BookResponse;
import com.library.entity.Author;
import com.library.entity.Book;
import com.library.entity.Publisher;
import com.library.exception.NotFoundException;
import com.library.repository.AuthorRepository;
import com.library.repository.BookRepository;
import com.library.repository.PublisherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;

    @Transactional(readOnly = true)
    public List<BookResponse> findAll() {
        return bookRepository.findAll().stream().map(BookResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public BookResponse findById(UUID id) {
        return BookResponse.from(get(id));
    }

    public BookResponse create(BookRequest request) {
        Book book = new Book(
                UUID.randomUUID(),
                request.title(),
                request.subTitle(),
                request.description(),
                request.pages(),
                request.isbn()
        );
        applyLinks(book, request);
        return BookResponse.from(bookRepository.save(book));
    }

    public BookResponse update(UUID id, BookRequest request) {
        Book book = get(id);
        book.setTitle(request.title());
        book.setSubTitle(request.subTitle());
        book.setDescription(request.description());
        book.setPages(request.pages());
        book.setIsbn(request.isbn());
        applyLinks(book, request);
        return BookResponse.from(book);
    }

    public void delete(UUID id) {
        if (!bookRepository.existsById(id)) {
            throw new NotFoundException("Book not found: " + id);
        }
        bookRepository.deleteById(id);
    }

    private void applyLinks(Book book, BookRequest request) {
        List<UUID> authorIds = request.authorIds() == null ? List.of() : request.authorIds();
        List<UUID> publisherIds = request.publisherIds() == null ? List.of() : request.publisherIds();

        Set<Author> authors = new HashSet<>();
        for (UUID authorId : authorIds) {
            authors.add(authorRepository.findById(authorId)
                    .orElseThrow(() -> new NotFoundException("Author not found: " + authorId)));
        }

        Set<Publisher> publishers = new HashSet<>();
        for (UUID publisherId : publisherIds) {
            publishers.add(publisherRepository.findById(publisherId)
                    .orElseThrow(() -> new NotFoundException("Publisher not found: " + publisherId)));
        }

        book.getAuthors().clear();
        book.getAuthors().addAll(authors);
        book.getPublishers().clear();
        book.getPublishers().addAll(publishers);
    }

    Book get(UUID id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Book not found: " + id));
    }
}
