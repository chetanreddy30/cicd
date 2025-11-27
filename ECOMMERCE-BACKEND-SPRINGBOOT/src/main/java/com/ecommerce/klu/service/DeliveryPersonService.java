package com.ecommerce.klu.service;

import com.ecommerce.klu.model.DeliveryPerson;
import com.ecommerce.klu.repository.DeliveryPersonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DeliveryPersonService {

    private static final Logger log = LoggerFactory.getLogger(DeliveryPersonService.class);

    @Autowired
    private DeliveryPersonRepository deliveryPersonRepository;

    public DeliveryPerson create(DeliveryPerson deliveryPerson) {
        DeliveryPerson created = deliveryPersonRepository.save(deliveryPerson);
        log.info("DeliveryPersonService.create persisted id={} name={}", created.getId(), created.getName());
        return created;
    }

    public Optional<DeliveryPerson> getById(Long id) {
        return deliveryPersonRepository.findById(id);
    }

    public List<DeliveryPerson> getAll() {
        return deliveryPersonRepository.findAll();
    }

    public List<DeliveryPerson> getActive() {
        return deliveryPersonRepository.findByActiveTrue();
    }

    public List<DeliveryPerson> findByLocation(String location) {
        return deliveryPersonRepository.findByCurrentLocationIgnoreCase(location);
    }

    public DeliveryPerson update(DeliveryPerson deliveryPerson) {
        DeliveryPerson updated = deliveryPersonRepository.save(deliveryPerson);
        log.info("DeliveryPersonService.update persisted id={} name={}", updated.getId(), updated.getName());
        return updated;
    }

    public void delete(Long id) {
        deliveryPersonRepository.deleteById(id);
    }
}