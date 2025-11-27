package com.ecommerce.klu.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDTO {
    private Long id;
    private Long userId;
    private String userFirstName;
    private String userLastName;
    private String userEmail;
    private String shippingAddress;
    private String paymentMethod;
    private String status;
    private BigDecimal totalAmount;
    private LocalDateTime orderDate;
    private List<OrderItemDTO> orderItems;
    // Delivery person info
    private Long deliveryPersonId;
    private String deliveryPersonName;
    private String deliveryPersonPhone;
    private String deliveryPersonVehicle;
    private java.time.LocalDateTime deliveryAssignedAt;

    // Constructors
    public OrderDTO() {}

    public OrderDTO(Long id, Long userId, String userFirstName, String userLastName, String userEmail,
                   String shippingAddress, String paymentMethod, String status, BigDecimal totalAmount, 
                   LocalDateTime orderDate, List<OrderItemDTO> orderItems,
                   Long deliveryPersonId, String deliveryPersonName, String deliveryPersonPhone, String deliveryPersonVehicle,
                   LocalDateTime deliveryAssignedAt) {
        this.id = id;
        this.userId = userId;
        this.userFirstName = userFirstName;
        this.userLastName = userLastName;
        this.userEmail = userEmail;
        this.shippingAddress = shippingAddress;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.totalAmount = totalAmount;
        this.orderDate = orderDate;
        this.orderItems = orderItems;
        this.deliveryPersonId = deliveryPersonId;
        this.deliveryPersonName = deliveryPersonName;
        this.deliveryPersonPhone = deliveryPersonPhone;
        this.deliveryPersonVehicle = deliveryPersonVehicle;
        this.deliveryAssignedAt = deliveryAssignedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserFirstName() {
        return userFirstName;
    }

    public void setUserFirstName(String userFirstName) {
        this.userFirstName = userFirstName;
    }

    public String getUserLastName() {
        return userLastName;
    }

    public void setUserLastName(String userLastName) {
        this.userLastName = userLastName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public List<OrderItemDTO> getOrderItems() {
        return orderItems;
    }

    public void setOrderItems(List<OrderItemDTO> orderItems) {
        this.orderItems = orderItems;
    }

    public Long getDeliveryPersonId() { return deliveryPersonId; }
    public void setDeliveryPersonId(Long deliveryPersonId) { this.deliveryPersonId = deliveryPersonId; }

    public String getDeliveryPersonName() { return deliveryPersonName; }
    public void setDeliveryPersonName(String deliveryPersonName) { this.deliveryPersonName = deliveryPersonName; }

    public String getDeliveryPersonPhone() { return deliveryPersonPhone; }
    public void setDeliveryPersonPhone(String deliveryPersonPhone) { this.deliveryPersonPhone = deliveryPersonPhone; }

    public String getDeliveryPersonVehicle() { return deliveryPersonVehicle; }
    public void setDeliveryPersonVehicle(String deliveryPersonVehicle) { this.deliveryPersonVehicle = deliveryPersonVehicle; }

    public java.time.LocalDateTime getDeliveryAssignedAt() { return deliveryAssignedAt; }
    public void setDeliveryAssignedAt(java.time.LocalDateTime deliveryAssignedAt) { this.deliveryAssignedAt = deliveryAssignedAt; }
}