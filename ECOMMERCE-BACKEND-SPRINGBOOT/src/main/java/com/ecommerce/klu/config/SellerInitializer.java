package com.ecommerce.klu.config;

import com.ecommerce.klu.model.Seller;
import com.ecommerce.klu.service.SellerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.event.ApplicationReadyEvent;

/**
 * Creates a default demo seller on application startup if none exists.
 * Configure values via application.properties if desired.
 */
@Component
public class SellerInitializer {

    @Autowired
    private SellerService sellerService;

    @Value("${app.seller.email:seller@demo.com}")
    private String sellerEmail;

    @Value("${app.seller.password:password123}")
    private String sellerPassword;

    @Value("${app.seller.username:seller}")
    private String sellerUsername;

    @EventListener(ApplicationReadyEvent.class)
    public void ensureSellerExists() {
        try {
            if (!sellerService.existsByEmail(sellerEmail)) {
                Seller seller = new Seller();
                seller.setEmail(sellerEmail);
                seller.setUsername(sellerUsername);
                seller.setFirstName("Demo");
                seller.setLastName("Seller");
                seller.setRole("SELLER");
                seller.setPassword(sellerPassword); // registration will encode
                sellerService.registerSeller(seller);
                System.out.println("[SellerInitializer] Created default seller: " + sellerEmail);
            } else {
                System.out.println("[SellerInitializer] Seller already exists: " + sellerEmail);
            }
        } catch (Exception ex) {
            System.err.println("[SellerInitializer] Failed to create demo seller: " + ex.getMessage());
        }
    }
}
