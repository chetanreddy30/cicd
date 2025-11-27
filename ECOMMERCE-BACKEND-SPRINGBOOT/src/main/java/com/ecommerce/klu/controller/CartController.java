package com.ecommerce.klu.controller;

import com.ecommerce.klu.dto.CartItemDTO;
import com.ecommerce.klu.model.CartItem;
import com.ecommerce.klu.model.Product;
import com.ecommerce.klu.model.User;
import com.ecommerce.klu.service.CartService;
import com.ecommerce.klu.service.ProductService;
import com.ecommerce.klu.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:5173")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private UserService userService;

    @Autowired
    private ProductService productService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CartItemDTO>> getCartItems(@PathVariable Long userId) {
        Optional<User> user = userService.getUserById(userId);
        if (user.isPresent()) {
            List<CartItem> cartItems = cartService.getCartItemsByUser(user.get());
            List<CartItemDTO> cartItemDTOs = cartItems.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            return ResponseEntity.ok(cartItemDTOs);
        }
        return ResponseEntity.notFound().build();
    }

    private CartItemDTO convertToDTO(CartItem cartItem) {
        Product product = cartItem.getProduct();
        return new CartItemDTO(
            cartItem.getId(),
            product.getId(),
            product.getName(),
            product.getDescription(),
            product.getPrice(),
            product.getImageUrl(),
            product.getCategory(),
            product.getBrand(),
            product.getStockQuantity(),
            cartItem.getQuantity(),
            product.getSeller() != null ? product.getSeller().getFirstName() + " " + product.getSeller().getLastName() : null,
            product.getSeller() != null ? product.getSeller().getBusinessName() : null
        );
    }

    @PostMapping("/add")
    public ResponseEntity<CartItemDTO> addToCart(@RequestParam Long userId,
                                                 @RequestParam Long productId,
                                                 @RequestParam Integer quantity) {
        Optional<User> user = userService.getUserById(userId);
        Optional<Product> product = productService.getProductById(productId);

        if (user.isPresent() && product.isPresent()) {
            CartItem cartItem = cartService.addToCart(user.get(), product.get(), quantity);
            CartItemDTO cartItemDTO = convertToDTO(cartItem);
            return ResponseEntity.ok(cartItemDTO);
        }
        return ResponseEntity.badRequest().build();
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<CartItemDTO> updateCartItem(@PathVariable Long cartItemId,
                                                      @RequestParam Integer quantity) {
        CartItem updatedCartItem = cartService.updateCartItem(cartItemId, quantity);
        if (updatedCartItem != null) {
            CartItemDTO cartItemDTO = convertToDTO(updatedCartItem);
            return ResponseEntity.ok(cartItemDTO);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<Void> removeFromCart(@PathVariable Long cartItemId) {
        cartService.removeFromCart(cartItemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear/{userId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        Optional<User> user = userService.getUserById(userId);
        if (user.isPresent()) {
            cartService.clearCart(user.get());
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}