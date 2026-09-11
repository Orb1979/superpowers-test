package com.library.publisher;

import com.library.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PublisherService {

    private final PublisherRepository repository;

    public PublisherService(PublisherRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PublisherResponse> findAll() {
        return repository.findAll().stream().map(PublisherResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PublisherResponse findById(UUID id) {
        return PublisherResponse.from(get(id));
    }

    public PublisherResponse create(PublisherRequest request) {
        Publisher publisher = new Publisher(UUID.randomUUID(), request.name(), request.country());
        return PublisherResponse.from(repository.save(publisher));
    }

    public PublisherResponse update(UUID id, PublisherRequest request) {
        Publisher publisher = get(id);
        publisher.setName(request.name());
        publisher.setCountry(request.country());
        return PublisherResponse.from(publisher);
    }

    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Publisher not found: " + id);
        }
        repository.deleteById(id);
    }

    Publisher get(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Publisher not found: " + id));
    }
}
