import React, { useState, useContext } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import { reviewService } from '../../services/reviewService';
import StarRating from '../common/StarRating';
import { toast } from 'react-toastify';

const ReviewForm = ({ productId, onReviewAdded }) => {
  const { user } = useContext(AuthContext);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please login to add a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Review must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reviewData = {
        productId,
        userId: user.id,
        rating,
        comment: comment.trim()
      };

      await reviewService.addReview(reviewData);
      
      // Reset form
      setRating(0);
      setComment('');
      
      toast.success('Review added successfully!');
      
      if (onReviewAdded) {
        onReviewAdded();
      }
    } catch (error) {
      setError(error.message || 'Failed to add review');
      toast.error('Failed to add review');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="mb-4">
        <Card.Body className="text-center py-4">
          <p className="mb-0">Please <strong>login</strong> to write a review</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">Write a Review</h5>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form.Group className="mb-3">
            <Form.Label>Rating</Form.Label>
            <div>
              <StarRating 
                rating={rating} 
                size={24} 
                onRatingChange={setRating}
                readonly={false}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Your Review</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Minimum 10 characters ({comment.length}/10)
            </Form.Text>
          </Form.Group>

          <Button 
            type="submit" 
            variant="primary" 
            disabled={loading || rating === 0 || comment.trim().length < 10}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ReviewForm;