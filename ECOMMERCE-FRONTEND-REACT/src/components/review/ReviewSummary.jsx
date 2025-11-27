import React from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import StarRating from '../common/StarRating';

const ReviewSummary = ({ stats }) => {
  if (!stats || stats.totalReviews === 0) {
    return (
      <Card className="mb-4">
        <Card.Body className="text-center py-4">
          <h6 className="text-muted">No ratings yet</h6>
          <p className="text-muted mb-0">Be the first to rate this product!</p>
        </Card.Body>
      </Card>
    );
  }

  const { averageRating, totalReviews, ratingDistribution } = stats;

  const getRatingPercentage = (rating) => {
    if (!ratingDistribution || totalReviews === 0) return 0;
    return (ratingDistribution[rating] / totalReviews) * 100;
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">Customer Reviews</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={4} className="text-center mb-3 mb-md-0">
            <div className="display-4 text-primary fw-bold">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={averageRating} size={20} readonly={true} />
            <div className="text-muted mt-1">
              Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </div>
          </Col>
          
          <Col md={8}>
            <div className="rating-breakdown">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="d-flex align-items-center mb-2">
                  <div className="me-2" style={{ minWidth: '60px' }}>
                    <span className="me-1">{rating}</span>
                    <span style={{ color: '#ffc107', fontSize: '14px' }}>★</span>
                  </div>
                  <div className="flex-grow-1 me-3">
                    <ProgressBar 
                      now={getRatingPercentage(rating)} 
                      style={{ height: '8px' }}
                      variant="warning"
                    />
                  </div>
                  <div style={{ minWidth: '40px', fontSize: '14px' }} className="text-muted">
                    {ratingDistribution[rating] || 0}
                  </div>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ReviewSummary;