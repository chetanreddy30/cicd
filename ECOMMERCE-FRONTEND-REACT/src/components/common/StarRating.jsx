import React from 'react';

const StarRating = ({ rating, size = 16, onRatingChange = null, readonly = false }) => {
  const handleStarClick = (starRating) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const renderStar = (index) => {
    const starRating = index + 1;
    const filled = starRating <= rating;
    const halfFilled = !filled && starRating - 0.5 <= rating;

    return (
      <span
        key={index}
        className={`star ${!readonly ? 'clickable' : ''}`}
        onClick={() => handleStarClick(starRating)}
        style={{
          fontSize: `${size}px`,
          color: filled || halfFilled ? '#ffc107' : '#e4e5e9',
          cursor: readonly ? 'default' : 'pointer',
          marginRight: '2px',
          userSelect: 'none'
        }}
      >
        {filled ? '★' : halfFilled ? '☆' : '☆'}
      </span>
    );
  };

  return (
    <div className="star-rating d-inline-flex align-items-center">
      {[...Array(5)].map((_, index) => renderStar(index))}
      {rating > 0 && (
        <span className="ms-1 text-muted" style={{ fontSize: `${size * 0.8}px` }}>
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

export default StarRating;