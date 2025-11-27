package com.ecommerce.klu.service;

import com.ecommerce.klu.dto.OrderDTO;
import com.ecommerce.klu.dto.OrderItemDTO;
import com.ecommerce.klu.model.*;
import com.ecommerce.klu.repository.OrderRepository;
import com.ecommerce.klu.repository.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private ProductService productService;

    @Autowired
    private DeliveryPersonService deliveryPersonService;

    @Autowired
    private SseEmitterService sseEmitterService;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<OrderDTO> getAllOrdersDTO() {
        return orderRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public Optional<OrderDTO> getOrderByIdDTO(Long id) {
        return orderRepository.findById(id).map(this::convertToDTO);
    }

    public List<Order> getOrdersByUser(User user) {
        return orderRepository.findByUserOrderByOrderDateDesc(user);
    }

    public List<OrderDTO> getOrdersByUserDTO(User user) {
        return orderRepository.findByUserOrderByOrderDateDesc(user).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatus(status);
    }

    public List<OrderDTO> getOrdersByStatusDTO(String status) {
        return orderRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<Order> getOrdersBySeller(Long sellerId) {
        return orderRepository.findOrdersBySellerId(sellerId);
    }

    public List<OrderDTO> getOrdersBySellerDTO(Long sellerId) {
        return orderRepository.findOrdersBySellerId(sellerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public Order createOrder(User user, String shippingAddress, String paymentMethod) {
        List<CartItem> cartItems = cartService.getCartItemsByUser(user);

        Order order = new Order();
        order.setUser(user);
        order.setShippingAddress(shippingAddress);
        order.setPaymentMethod(paymentMethod);

        BigDecimal totalAmount = BigDecimal.ZERO;

        Order savedOrder = orderRepository.save(order);
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cartItems) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPrice(cartItem.getProduct().getPrice());

            OrderItem savedOrderItem = orderItemRepository.save(orderItem);
            orderItems.add(savedOrderItem);

            BigDecimal itemTotal = cartItem.getProduct().getPrice()
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            productService.updateStock(cartItem.getProduct().getId(), cartItem.getQuantity());
        }

        savedOrder.setTotalAmount(totalAmount);
        savedOrder.setOrderItems(orderItems); // Set the orderItems list
        cartService.clearCart(user);

        Order finalOrder = orderRepository.save(savedOrder);
        // send SSE event with DTO
        try {
            OrderDTO dto = convertToDTO(finalOrder);
            sseEmitterService.sendEvent("order-created", dto);
        } catch (Exception ignored) {}
        return finalOrder;
    }

    public OrderDTO createOrderDTO(User user, String shippingAddress, String paymentMethod) {
        Order order = createOrder(user, shippingAddress, paymentMethod);
        // Reload the order to ensure OrderItems are fetched
        Optional<Order> reloadedOrder = orderRepository.findById(order.getId());
        return reloadedOrder.map(this::convertToDTO).orElse(null);
    }

    public Order updateOrderStatus(Long orderId, String status) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setStatus(status);
            Order saved = orderRepository.save(order);
            try {
                sseEmitterService.sendEvent("order-updated", convertToDTO(saved));
            } catch (Exception ignored) {}
            return saved;
        }
        return null;
    }

    // Assign a delivery person to an order
    public Order assignDeliveryPerson(Long orderId, Long deliveryPersonId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        Optional<com.ecommerce.klu.model.DeliveryPerson> dpOpt = deliveryPersonService.getById(deliveryPersonId);

        if (orderOpt.isPresent() && dpOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setDeliveryPerson(dpOpt.get());
            order.setDeliveryAssignedAt(java.time.LocalDateTime.now());
            // If assigning, set status to SHIPPED -> OUT FOR DELIVERY depending on business flow
            if ("SHIPPED".equals(order.getStatus())) {
                order.setStatus("OUT_FOR_DELIVERY");
            }
            Order saved = orderRepository.save(order);
            try {
                sseEmitterService.sendEvent("order-updated", convertToDTO(saved));
            } catch (Exception ignored) {}
            return saved;
        }
        return null;
    }

    public List<Order> getOrdersByDeliveryPerson(Long deliveryPersonId) {
        return orderRepository.findByDeliveryPersonId(deliveryPersonId);
    }

    public List<com.ecommerce.klu.dto.OrderDTO> getOrdersByDeliveryPersonDTO(Long deliveryPersonId) {
        return getOrdersByDeliveryPerson(deliveryPersonId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO updateOrderStatusDTO(Long orderId, String status) {
        Order order = updateOrderStatus(orderId, status);
        return order != null ? convertToDTO(order) : null;
    }

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }

    private OrderDTO convertToDTO(Order order) {
        List<OrderItemDTO> orderItemDTOs = null;
        if (order.getOrderItems() != null) {
            orderItemDTOs = order.getOrderItems().stream()
                    .map(this::convertOrderItemToDTO)
                    .collect(Collectors.toList());
        } else {
            orderItemDTOs = List.of(); // Empty list if orderItems is null
        }

    Long dpId = null; String dpName = null; String dpPhone = null; String dpVehicle = null; java.time.LocalDateTime dpAssignedAt = null;
    if (order.getDeliveryPerson() != null) {
        dpId = order.getDeliveryPerson().getId();
        dpName = order.getDeliveryPerson().getName();
        dpPhone = order.getDeliveryPerson().getPhone();
        dpVehicle = order.getDeliveryPerson().getVehicle();
        dpAssignedAt = order.getDeliveryAssignedAt();
    }

    return new OrderDTO(
        order.getId(),
        order.getUser().getId(),
        order.getUser().getFirstName(),
        order.getUser().getLastName(),
        order.getUser().getEmail(),
        order.getShippingAddress(),
        order.getPaymentMethod(),
        order.getStatus(),
        order.getTotalAmount(),
        order.getOrderDate(),
        orderItemDTOs,
        dpId,
        dpName,
        dpPhone,
        dpVehicle,
        dpAssignedAt
    );
    }

    private OrderItemDTO convertOrderItemToDTO(OrderItem orderItem) {
        Product product = orderItem.getProduct();
        Seller seller = product.getSeller();

        return new OrderItemDTO(
                orderItem.getId(),
                product.getId(),
                product.getName(),
                product.getBrand(),
                product.getCategory(),
                product.getImageUrl(),
                product.getPrice(),
                orderItem.getPrice(),
                orderItem.getQuantity(),
                seller.getId(),
                seller.getBusinessName(),
                seller.getFirstName(),
                seller.getLastName()
        );
    }
}