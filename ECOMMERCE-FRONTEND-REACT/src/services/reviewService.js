import api from './api';

export const reviewService = {
  // Add a new review
  addReview: async (reviewData) => {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to add review';
    }
  },

  // Get reviews for a product
  getProductReviews: async (productId) => {
    try {
      const response = await api.get(`/reviews/product/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch reviews';
    }
  },

  // Get product rating statistics
  getProductRatingStats: async (productId) => {
    try {
      const response = await api.get(`/reviews/product/${productId}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch rating stats';
    }
  },

  // Get user's reviews
  getUserReviews: async (userId) => {
    try {
      const response = await api.get(`/reviews/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch user reviews';
    }
  },

  // Update a review
  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to update review';
    }
  },

  // Delete a review
  deleteReview: async (reviewId, userId) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}?userId=${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to delete review';
    }
  },

  // Check if user can review product
  canUserReviewProduct: async (userId, productId) => {
    try {
      const response = await api.get(`/reviews/can-review?userId=${userId}&productId=${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || false;
    }
  },

  // Get recent reviews
  getRecentReviews: async () => {
    try {
      const response = await api.get('/reviews/recent');
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch recent reviews';
    }
  }
};