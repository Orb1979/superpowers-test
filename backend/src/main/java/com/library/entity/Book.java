package com.library.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "book")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Book {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(name = "sub_title", nullable = false)
    private String subTitle;

    private String description;

    @Column(nullable = false)
    private Integer pages;

    @Column(unique = true)
    private String isbn;

    @ManyToMany
    @JoinTable(
            name = "author_book",
            joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    private Set<Author> authors = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "book_publisher",
            joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "publisher_id")
    )
    private Set<Publisher> publishers = new HashSet<>();

    public Book(UUID id, String title, String subTitle, String description, Integer pages, String isbn) {
        this.id = id;
        this.title = title;
        this.subTitle = subTitle;
        this.description = description;
        this.pages = pages;
        this.isbn = isbn;
    }
}
