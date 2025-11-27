package com.ecommerce.klu.controller;

import com.ecommerce.klu.model.DeliveryPerson;
import com.ecommerce.klu.service.DeliveryPersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/delivery-persons")
@CrossOrigin(origins = "http://localhost:5173")
public class DeliveryPersonController {

    @Autowired
    private DeliveryPersonService deliveryPersonService;

    @PostMapping
    public ResponseEntity<DeliveryPerson> create(@RequestBody DeliveryPerson deliveryPerson) {
        DeliveryPerson created = deliveryPersonService.create(deliveryPerson);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<List<DeliveryPerson>> getAll() {
        List<DeliveryPerson> all = deliveryPersonService.getAll();
        // Clear assignedOrders to avoid deep/bidirectional JSON recursion and large payloads
        if (all != null) {
            all.forEach(dp -> dp.setAssignedOrders(null));
        }
        return ResponseEntity.ok(all);
    }

    @GetMapping("/active")
    public ResponseEntity<List<DeliveryPerson>> getActive() {
        List<DeliveryPerson> active = deliveryPersonService.getActive();
        if (active != null) {
            active.forEach(dp -> dp.setAssignedOrders(null));
        }
        return ResponseEntity.ok(active);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeliveryPerson> getById(@PathVariable Long id) {
        Optional<DeliveryPerson> dp = deliveryPersonService.getById(id);
        if (dp.isPresent()) {
            DeliveryPerson p = dp.get();
            p.setAssignedOrders(null);
            return ResponseEntity.ok(p);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeliveryPerson> update(@PathVariable Long id, @RequestBody DeliveryPerson deliveryPerson) {
        deliveryPerson.setId(id);
        DeliveryPerson updated = deliveryPersonService.update(deliveryPerson);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deliveryPersonService.delete(id);
        return ResponseEntity.noContent().build();
    }
}