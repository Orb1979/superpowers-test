package com.library.book;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class BookIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("library")
            .withUsername("library")
            .withPassword("library");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mockMvc;

    @Test
    void createBookWithLinksAndUnlinkOnDelete() throws Exception {
        String authorId = JsonPath.read(mockMvc.perform(post("/api/authors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"firstName":"Ada","lastName":"Lovelace","birthDate":"1815-12-10"}
                            """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");

        String publisherId = JsonPath.read(mockMvc.perform(post("/api/publishers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Penguin","country":"UK"}
                            """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");

        String bookJson = mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                              "title":"Notes",
                              "subTitle":"On Babbage",
                              "description":"Essay",
                              "pages":120,
                              "isbn":"ISBN-1",
                              "authorIds":["%s"],
                              "publisherIds":["%s"]
                            }
                            """.formatted(authorId, publisherId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authors[0].firstName").value("Ada"))
                .andExpect(jsonPath("$.publishers[0].name").value("Penguin"))
                .andReturn().getResponse().getContentAsString();

        String bookId = JsonPath.read(bookJson, "$.id");

        mockMvc.perform(delete("/api/authors/" + authorId)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/books/" + bookId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authors").isEmpty());

        mockMvc.perform(delete("/api/publishers/" + publisherId)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/books/" + bookId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publishers").isEmpty());
    }
}
