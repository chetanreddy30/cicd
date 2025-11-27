package com.ecommerce.klu.config;

import com.ecommerce.klu.model.Admin;
import com.ecommerce.klu.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Creates a single static admin user on application startup if none exists.
 * Configure values via application.properties:
 * app.admin.email and app.admin.password (optional). Defaults are used if not set.
 */
@Component
public class AdminInitializer {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@local.com}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.force:false}")
    private boolean forceCreate;

    @EventListener(ApplicationReadyEvent.class)
    public void ensureAdminExists() {
        try {
            if (forceCreate) {
                System.out.println("[AdminInitializer] Force create enabled - deleting existing admins and recreating the default admin.");
                adminRepository.deleteAll();
            }

            if (adminRepository.count() == 0) {
                Admin admin = new Admin();
                admin.setEmail(adminEmail);
                admin.setUsername(adminUsername);
                admin.setFirstName("System");
                admin.setLastName("Administrator");
                admin.setRole("ADMIN");
                admin.setPassword(passwordEncoder.encode(adminPassword));
                adminRepository.save(admin);
                System.out.println("[AdminInitializer] Created default admin: " + adminEmail);
            } else {
                System.out.println("[AdminInitializer] Admin user(s) already exist; skipping creation.");
            }
        } catch (Exception ex) {
            System.err.println("[AdminInitializer] Failed to create admin: " + ex.getMessage());
        }
    }
}
