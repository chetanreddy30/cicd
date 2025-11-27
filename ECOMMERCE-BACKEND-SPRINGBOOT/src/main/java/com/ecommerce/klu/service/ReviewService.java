package com.ecommerce.klu.service;

import com.ecommerce.klu.model.Review;
import com.ecommerce.klu.model.Product;
import com.ecommerce.klu.model.User;
import com.ecommerce.klu.repository.ReviewRepository;
import com.ecommerce.klu.repository.ProductRepository;
import com.ecommerce.klu.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    // Add a new review
    public Review addReview(Long productId, Long userId, String comment, Integer rating) {
        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        // Check if user has already reviewed this product
        if (reviewRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new IllegalArgumentException("User has already reviewed this product");
        }

        Optional<Product> productOpt = productRepository.findById(productId);
        Optional<User> userOpt = userRepository.findById(userId);

        if (productOpt.isEmpty()) {
            throw new IllegalArgumentException("Product not found");
        }
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        Review review = new Review(comment, rating, userOpt.get(), productOpt.get());
        return reviewRepository.save(review);
    }

    // Get all reviews for a product
    public List<Review> getReviewsByProductId(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    // Get reviews by user
    public List<Review> getReviewsByUserId(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // Get product rating statistics
    public Map<String, Object> getProductRatingStats(Long productId) {
        Map<String, Object> stats = new HashMap<>();
        
        Double avgRating = reviewRepository.findAverageRatingByProductId(productId);
        Long totalReviews = reviewRepository.countReviewsByProductId(productId);
        
        stats.put("averageRating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);
        stats.put("totalReviews", totalReviews);
        
        // Get rating distribution
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            List<Review> ratingReviews = reviewRepository.findByProductIdAndRatingOrderByCreatedAtDesc(productId, i);
            ratingDistribution.put(i, (long) ratingReviews.size());
        }
        stats.put("ratingDistribution", ratingDistribution);
        
        return stats;
    }

    // Update a review
    public Review updateReview(Long reviewId, String comment, Integer rating, Long userId) {
        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
        
        if (reviewOpt.isEmpty()) {
            throw new IllegalArgumentException("Review not found");
        }
        
        Review review = reviewOpt.get();
        
        // Check if the user owns this review
        if (!review.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("User can only update their own reviews");
        }
        
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        
        review.setComment(comment);
        review.setRating(rating);
        
        return reviewRepository.save(review);
    }

    // Delete a review
    public void deleteReview(Long reviewId, Long userId) {
        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
        
        if (reviewOpt.isEmpty()) {
            throw new IllegalArgumentException("Review not found");
        }
        
        Review review = reviewOpt.get();
        
        // Check if the user owns this review
        if (!review.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("User can only delete their own reviews");
        }
        
        reviewRepository.delete(review);
    }

    // Check if user can review product (hasn't reviewed before)
    public boolean canUserReviewProduct(Long userId, Long productId) {
        return !reviewRepository.existsByUserIdAndProductId(userId, productId);
    }

    // Get recent reviews
    public List<Review> getRecentReviews() {
        return reviewRepository.findTop10ByOrderByCreatedAtDesc();
    }
}