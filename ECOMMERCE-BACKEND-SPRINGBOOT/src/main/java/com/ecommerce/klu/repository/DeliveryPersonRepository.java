package com.ecommerce.klu.repository;

import com.ecommerce.klu.model.DeliveryPerson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryPersonRepository extends JpaRepository<DeliveryPerson, Long> {
    List<DeliveryPerson> findByActiveTrue();
    List<DeliveryPerson> findByCurrentLocationIgnoreCase(String location);
}