package com.ecommerce.klu.controller;

import com.ecommerce.klu.model.Review;
import com.ecommerce.klu.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // Add a new review
    @PostMapping
    public ResponseEntity<?> addReview(@RequestBody Map<String, Object> reviewData) {
        try {
            Long productId = Long.valueOf(reviewData.get("productId").toString());
            Long userId = Long.valueOf(reviewData.get("userId").toString());
            String comment = reviewData.get("comment").toString();
            Integer rating = Integer.valueOf(reviewData.get("rating").toString());

            Review review = reviewService.addReview(productId, userId, comment, rating);
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error adding review: " + e.getMessage());
        }
    }

    // Get all reviews for a product
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getReviewsByProduct(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getReviewsByProductId(productId);
        return ResponseEntity.ok(reviews);
    }

    // Get reviews by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getReviewsByUser(@PathVariable Long userId) {
        List<Review> reviews = reviewService.getReviewsByUserId(userId);
        return ResponseEntity.ok(reviews);
    }

    // Get product rating statistics
    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<Map<String, Object>> getProductRatingStats(@PathVariable Long productId) {
        Map<String, Object> stats = reviewService.getProductRatingStats(productId);
        return ResponseEntity.ok(stats);
    }

    // Update a review
    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(
            @PathVariable Long reviewId,
            @RequestBody Map<String, Object> reviewData) {
        try {
            Long userId = Long.valueOf(reviewData.get("userId").toString());
            String comment = reviewData.get("comment").toString();
            Integer rating = Integer.valueOf(reviewData.get("rating").toString());

            Review updatedReview = reviewService.updateReview(reviewId, comment, rating, userId);
            return ResponseEntity.ok(updatedReview);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating review: " + e.getMessage());
        }
    }

    // Delete a review
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId, @RequestParam Long userId) {
        try {
            reviewService.deleteReview(reviewId, userId);
            return ResponseEntity.ok("Review deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting review: " + e.getMessage());
        }
    }

    // Check if user can review product
    @GetMapping("/can-review")
    public ResponseEntity<Boolean> canUserReviewProduct(
            @RequestParam Long userId,
            @RequestParam Long productId) {
        boolean canReview = reviewService.canUserReviewProduct(userId, productId);
        return ResponseEntity.ok(canReview);
    }

    // Get recent reviews
    @GetMapping("/recent")
    public ResponseEntity<List<Review>> getRecentReviews() {
        List<Review> reviews = reviewService.getRecentReviews();
        return ResponseEntity.ok(reviews);
    }
}