package com.library.publisher;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PublisherRepository extends JpaRepository<Publisher, UUID> {}
