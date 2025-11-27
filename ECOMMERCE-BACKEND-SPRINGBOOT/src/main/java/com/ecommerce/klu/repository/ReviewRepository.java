package com.ecommerce.klu.repository;

import com.ecommerce.klu.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    // Find all reviews for a specific product
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);
    
    // Find all reviews by a specific user
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // Check if user has already reviewed a product
    boolean existsByUserIdAndProductId(Long userId, Long productId);
    
    // Get average rating for a product
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);
    
    // Get count of reviews for a product
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    Long countReviewsByProductId(@Param("productId") Long productId);
    
    // Get reviews with rating filter
    List<Review> findByProductIdAndRatingOrderByCreatedAtDesc(Long productId, Integer rating);
    
    // Find recent reviews (last 10)
    @Query("SELECT r FROM Review r ORDER BY r.createdAt DESC")
    List<Review> findTop10ByOrderByCreatedAtDesc();
}