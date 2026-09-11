package com.library.publisher;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "publisher")
public class Publisher {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String country;

    protected Publisher() {}

    public Publisher(UUID id, String name, String country) {
        this.id = id;
        this.name = name;
        this.country = country;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getCountry() { return country; }

    public void setName(String name) { this.name = name; }
    public void setCountry(String country) { this.country = country; }
}
