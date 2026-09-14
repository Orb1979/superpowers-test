package com.library.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "book")
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

    protected Book() {}

    public Book(UUID id, String title, String subTitle, String description, Integer pages, String isbn) {
        this.id = id;
        this.title = title;
        this.subTitle = subTitle;
        this.description = description;
        this.pages = pages;
        this.isbn = isbn;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getSubTitle() { return subTitle; }
    public String getDescription() { return description; }
    public Integer getPages() { return pages; }
    public String getIsbn() { return isbn; }
    public Set<Author> getAuthors() { return authors; }
    public Set<Publisher> getPublishers() { return publishers; }

    public void setTitle(String title) { this.title = title; }
    public void setSubTitle(String subTitle) { this.subTitle = subTitle; }
    public void setDescription(String description) { this.description = description; }
    public void setPages(Integer pages) { this.pages = pages; }
    public void setIsbn(String isbn) { this.isbn = isbn; }
}
