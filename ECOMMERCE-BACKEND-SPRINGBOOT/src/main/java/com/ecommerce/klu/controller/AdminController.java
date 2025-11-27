package com.ecommerce.klu.controller;

import com.ecommerce.klu.model.Admin;
import com.ecommerce.klu.model.User;
import com.ecommerce.klu.model.Seller;
import com.ecommerce.klu.model.Product;
import com.ecommerce.klu.model.Order;
import com.ecommerce.klu.dto.OrderDTO;
import com.ecommerce.klu.service.AdminService;
import com.ecommerce.klu.service.UserService;
import com.ecommerce.klu.service.SellerService;
import com.ecommerce.klu.service.ProductService;
import com.ecommerce.klu.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserService userService;

    @Autowired
    private SellerService sellerService;

    @Autowired
    private ProductService productService;

    @Autowired
    private OrderService orderService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Admin admin) {
        Map<String, Object> response = new HashMap<>();
        // Registration for admin is disabled when a static admin has been set up.
        // Allow registration only if no admin exists yet. In typical deployments we create
        // the single admin via application properties (see AdminInitializer) and disable
        // runtime registration to keep a single admin account.
        if (adminService.getAllAdmins().size() > 0) {
            response.put("success", false);
            response.put("message", "Admin registration is disabled. Admin already exists.");
            return ResponseEntity.status(403).body(response);
        }

        if (adminService.existsByEmail(admin.getEmail())) {
            response.put("success", false);
            response.put("message", "Email already exists");
            return ResponseEntity.badRequest().body(response);
        }

        if (adminService.existsByUsername(admin.getUsername())) {
            response.put("success", false);
            response.put("message", "Username already exists");
            return ResponseEntity.badRequest().body(response);
        }

        Admin registeredAdmin = adminService.registerAdmin(admin);
        response.put("success", true);
        response.put("message", "Admin registered successfully");
        response.put("admin", registeredAdmin);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        Map<String, Object> response = new HashMap<>();
        String email = credentials.get("email");
        String password = credentials.get("password");

        Optional<Admin> adminOpt = adminService.login(email, password);

        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("admin", admin);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/sellers")
    public ResponseEntity<List<Seller>> getAllSellers() {
        return ResponseEntity.ok(sellerService.getAllSellers());
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrdersDTO());
    }

    @PostMapping("/create-seller")
    public ResponseEntity<Seller> createSeller(@RequestBody Seller seller) {
        if (sellerService.existsByEmail(seller.getEmail())) {
            return ResponseEntity.badRequest().build();
        }
        if (sellerService.existsByUsername(seller.getUsername())) {
            return ResponseEntity.badRequest().build();
        }
        Seller createdSeller = sellerService.createSeller(seller);
        return ResponseEntity.ok(createdSeller);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/sellers/{id}")
    public ResponseEntity<Void> deleteSeller(@PathVariable Long id) {
        sellerService.deleteSeller(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        Order updatedOrder = orderService.updateOrderStatus(id, status);
        if (updatedOrder != null) {
            return ResponseEntity.ok(updatedOrder);
        }
        return ResponseEntity.notFound().build();
    }
}