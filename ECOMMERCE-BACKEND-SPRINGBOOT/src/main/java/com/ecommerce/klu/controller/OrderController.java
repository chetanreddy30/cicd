package com.ecommerce.klu.controller;

import com.ecommerce.klu.dto.OrderDTO;
import com.ecommerce.klu.model.Order;
import com.ecommerce.klu.model.User;
import com.ecommerce.klu.service.OrderService;
import com.ecommerce.klu.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserService userService;
    
    @Autowired
    private com.ecommerce.klu.service.SellerService sellerService;

    @Autowired
    private com.ecommerce.klu.service.AdminService adminService;

    @GetMapping
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrdersDTO());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long id) {
        Optional<OrderDTO> order = orderService.getOrderByIdDTO(id);
        return order.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByUser(@PathVariable Long userId) {
        Optional<User> user = userService.getUserById(userId);
        if (user.isPresent()) {
            return ResponseEntity.ok(orderService.getOrdersByUserDTO(user.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<OrderDTO>> getOrdersByStatus(@PathVariable String status) {
        return ResponseEntity.ok(orderService.getOrdersByStatusDTO(status));
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<OrderDTO>> getOrdersBySeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(orderService.getOrdersBySellerDTO(sellerId));
    }

    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@RequestParam Long userId,
                                             @RequestParam String shippingAddress,
                                             @RequestParam String paymentMethod) {
        Optional<User> user = userService.getUserById(userId);
        if (user.isPresent()) {
            OrderDTO order = orderService.createOrderDTO(user.get(), shippingAddress, paymentMethod);
            return ResponseEntity.ok(order);
        }
        return ResponseEntity.badRequest().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderDTO> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        OrderDTO updatedOrder = orderService.updateOrderStatusDTO(id, status);
        if (updatedOrder != null) {
            return ResponseEntity.ok(updatedOrder);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/assign-delivery")
    public ResponseEntity<OrderDTO> assignDeliveryPerson(@PathVariable Long id,
                                                         @RequestParam Long deliveryPersonId,
                                                         @RequestParam(required = false) Long actingUserId,
                                                         @RequestParam(required = false) String actingUserType) {
        // Server-side authorization: only SELLER or ADMIN can assign delivery persons.
        boolean permitted = false;

        if (actingUserType != null && actingUserId != null) {
            if ("ADMIN".equalsIgnoreCase(actingUserType)) {
                // Prefer Admin table, but fallback to User role check if admin record isn't present
                if (adminService.getAdminById(actingUserId).isPresent()) {
                    permitted = true;
                } else {
                    Optional<User> u = userService.getUserById(actingUserId);
                    if (u.isPresent() && "ADMIN".equalsIgnoreCase(u.get().getRole())) {
                        permitted = true;
                    }
                }
            } else if ("SELLER".equalsIgnoreCase(actingUserType)) {
                // Prefer Seller table, but also accept a User with role SELLER
                if (sellerService.getSellerById(actingUserId).isPresent()) {
                    permitted = true;
                } else {
                    Optional<User> u = userService.getUserById(actingUserId);
                    if (u.isPresent() && "SELLER".equalsIgnoreCase(u.get().getRole())) {
                        permitted = true;
                    }
                }
            }
        } else if (actingUserId != null) {
            // Try seller
            if (sellerService.getSellerById(actingUserId).isPresent()) {
                permitted = true;
            } else {
                // try admin
                if (adminService.getAdminById(actingUserId).isPresent()) {
                    permitted = true;
                } else {
                    // try generic user role (in case sellers are represented as users)
                    Optional<User> u = userService.getUserById(actingUserId);
                    if (u.isPresent()) {
                        String role = u.get().getRole();
                        if ("SELLER".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)) {
                            permitted = true;
                        }
                    }
                }
            }
        }

        if (!permitted) {
            return ResponseEntity.status(403).build();
        }

        Order updated = orderService.assignDeliveryPerson(id, deliveryPersonId);
        if (updated != null) {
            return ResponseEntity.ok(orderService.getOrderByIdDTO(updated.getId()).orElse(null));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/delivery-person/{deliveryPersonId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByDeliveryPerson(@PathVariable Long deliveryPersonId) {
        return ResponseEntity.ok(orderService.getOrdersByDeliveryPersonDTO(deliveryPersonId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}