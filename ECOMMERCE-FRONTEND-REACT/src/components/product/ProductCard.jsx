import React, { useContext, useState } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import StarRating from '../common/StarRating';

const ProductCard = ({ product }) => {
  const { addToCart, isInCart, getCartItemQuantity } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      return;
    }
    
    setLoading(true);
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const inCart = isInCart(product.id);
  const quantity = getCartItemQuantity(product.id);

  return (
    <Card className="h-100 product-card">
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={product.imageUrl && product.imageUrl.trim() !== '' 
               ? product.imageUrl 
               : 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={product.name}
          style={{ height: '200px', objectFit: 'cover' }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
          }}
        />
        {product.stockQuantity === 0 && (
          <Badge bg="danger" className="position-absolute top-0 end-0 m-2">
            Out of Stock
          </Badge>
        )}
        {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
          <Badge bg="warning" className="position-absolute top-0 end-0 m-2">
            Low Stock
          </Badge>
        )}
      </div>
      
      <Card.Body className="d-flex flex-column">
        <div className="mb-auto">
          <Card.Title className="h6 mb-2" style={{ minHeight: '48px' }}>
            <Link 
              to={`/products/${product.id}`} 
              className="text-decoration-none text-dark"
            >
              {product.name}
            </Link>
          </Card.Title>
          
          <Card.Text className="text-muted small mb-2">
            {product.brand}
          </Card.Text>

          {/* Rating Display - placeholder for now, will be populated from backend */}
          <div className="mb-2">
            <StarRating rating={0} size={14} readonly={true} />
            <small className="text-muted ms-1">(0 reviews)</small>
          </div>
          
          <Card.Text className="small text-muted" style={{ minHeight: '60px' }}>
            {product.description.length > 100 
              ? `${product.description.substring(0, 100)}...` 
              : product.description
            }
          </Card.Text>
          
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="h5 mb-0 text-primary">
              ₹{product.price.toFixed(2)}
            </span>
            <small className="text-muted">
              Stock: {product.stockQuantity}
            </small>
          </div>
        </div>
        
        <div className="mt-2">
          {user ? (
            <>
              {inCart ? (
                <div className="d-flex align-items-center justify-content-between">
                  <Badge bg="success">In Cart ({quantity})</Badge>
                  <Link to="/cart" className="btn btn-outline-primary btn-sm">
                    View Cart
                  </Link>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-100"
                  onClick={handleAddToCart}
                  disabled={loading || product.stockQuantity === 0}
                >
                  {loading ? 'Adding...' : 'Add to Cart'}
                </Button>
              )}
            </>
          ) : (
            <Link to="/login" className="btn btn-outline-primary btn-sm w-100">
              Login to Buy
            </Link>
          )}
        </div>
      </Card.Body>

      <style jsx>{`
        .product-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        
        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
      `}</style>
    </Card>
  );
};

export default ProductCard;
