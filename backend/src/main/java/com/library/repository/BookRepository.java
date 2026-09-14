package com.library.repository;

import com.library.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BookRepository extends JpaRepository<Book, UUID> {

    @Query("""
        select b from Book b join b.authors a where a.id = :authorId
        """)
    List<Book> findAllByAuthorId(@Param("authorId") UUID authorId);

    @Query("""
        select b from Book b join b.publishers p where p.id = :publisherId
        """)
    List<Book> findAllByPublisherId(@Param("publisherId") UUID publisherId);
}
