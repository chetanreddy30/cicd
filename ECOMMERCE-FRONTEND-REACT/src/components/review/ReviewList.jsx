import React from 'react';
import { Card, Badge, Row, Col } from 'react-bootstrap';
import StarRating from '../common/StarRating';

const ReviewList = ({ reviews, loading }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading reviews...</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center py-4">
          <h6 className="text-muted">No reviews yet</h6>
          <p className="text-muted mb-0">Be the first to review this product!</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {reviews.map((review, index) => (
        <Card key={review.id || index} className="mb-3">
          <Card.Body>
            <Row>
              <Col xs={12} md={2} className="text-center mb-3 mb-md-0">
                {/* User Avatar */}
                <div 
                  className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-2"
                  style={{ width: '50px', height: '50px', fontSize: '18px', fontWeight: 'bold' }}
                >
                  {getInitials(review.user?.username || review.user?.email || 'Anonymous')}
                </div>
                <div className="small text-muted">
                  {review.user?.username || 'Anonymous'}
                </div>
              </Col>
              
              <Col xs={12} md={10}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <StarRating rating={review.rating} size={16} readonly={true} />
                  </div>
                  <small className="text-muted">{formatDate(review.createdAt)}</small>
                </div>
                
                <p className="mb-2">{review.comment}</p>
                
                {review.rating >= 4 && (
                  <Badge bg="success" className="me-2">Recommended</Badge>
                )}
                
                {review.createdAt !== review.updatedAt && (
                  <small className="text-muted fst-italic">
                    Edited on {formatDate(review.updatedAt)}
                  </small>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default ReviewList;