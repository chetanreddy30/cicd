package com.ecommerce.klu.repository;

import com.ecommerce.klu.model.Order;
import com.ecommerce.klu.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);
    List<Order> findByStatus(String status);
    List<Order> findByUserOrderByOrderDateDesc(User user);
    
    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderItems oi JOIN oi.product p WHERE p.seller.id = :sellerId ORDER BY o.orderDate DESC")
    List<Order> findOrdersBySellerId(@Param("sellerId") Long sellerId);

    List<Order> findByDeliveryPersonId(Long deliveryPersonId);
    List<Order> findByDeliveryPersonIdAndStatus(Long deliveryPersonId, String status);
}