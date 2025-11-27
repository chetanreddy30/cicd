package com.ecommerce.klu.controller;

import com.ecommerce.klu.model.Seller;
import com.ecommerce.klu.service.SellerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sellers")
@CrossOrigin(origins = "http://localhost:5173")
public class SellerController {

    @Autowired
    private SellerService sellerService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Seller seller) {
        Map<String, Object> response = new HashMap<>();

        if (sellerService.existsByEmail(seller.getEmail())) {
            response.put("success", false);
            response.put("message", "Email already exists");
            return ResponseEntity.badRequest().body(response);
        }

        if (sellerService.existsByUsername(seller.getUsername())) {
            response.put("success", false);
            response.put("message", "Username already exists");
            return ResponseEntity.badRequest().body(response);
        }

        Seller registeredSeller = sellerService.registerSeller(seller);
        response.put("success", true);
        response.put("message", "Seller registered successfully");
        response.put("seller", registeredSeller);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        Map<String, Object> response = new HashMap<>();
        String email = credentials.get("email");
        String password = credentials.get("password");

        System.out.println("Seller login attempt - Email: " + email + ", Password: " + password);

        Optional<Seller> sellerOpt = sellerService.login(email, password);

        if (sellerOpt.isPresent()) {
            Seller seller = sellerOpt.get();
            System.out.println("Seller login successful for: " + seller.getEmail());
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("seller", seller);
            return ResponseEntity.ok(response);
        } else {
            System.out.println("Seller login failed for email: " + email);
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping
    public ResponseEntity<List<Seller>> getAllSellers() {
        List<Seller> sellers = sellerService.getAllSellers();
        System.out.println("Total sellers in database: " + sellers.size());
        for (Seller seller : sellers) {
            System.out.println("Seller: ID=" + seller.getId() + ", Email=" + seller.getEmail() + ", Username=" + seller.getUsername());
        }
        return ResponseEntity.ok(sellers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Seller> getSellerById(@PathVariable Long id) {
        Optional<Seller> seller = sellerService.getSellerById(id);
        return seller.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Seller> updateSeller(@PathVariable Long id, @RequestBody Seller seller) {
        Optional<Seller> existingSeller = sellerService.getSellerById(id);
        if (existingSeller.isPresent()) {
            seller.setId(id);
            Seller updatedSeller = sellerService.updateSeller(seller);
            return ResponseEntity.ok(updatedSeller);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSeller(@PathVariable Long id) {
        sellerService.deleteSeller(id);
        return ResponseEntity.noContent().build();
    }
}