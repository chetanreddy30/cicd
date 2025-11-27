import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Table, ProgressBar, Modal, Form, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { toast } from 'react-toastify';
import { deliveryPersonService } from '../services/deliveryPersonService';

const OrderDetails = () => {
  const { orderId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState(null);

  console.log('OrderDetails component mounted with orderId:', orderId);
  console.log('Current user:', user);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setError('No order ID provided');
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      console.log('Fetching order details for orderId:', orderId);
      setLoading(true);
      setError(null);
      
      const orderData = await orderService.getOrderById(orderId);
      console.log('Order data received:', orderData);
      
      // Check if user has permission to view this order
      if (orderData && orderData.userId !== user.id && user.role !== 'SELLER') {
        setError('You do not have permission to view this order.');
        return;
      }
      
      setOrder(orderData);
      // load delivery persons list for assignment only if user is seller or admin
      if (user && (user.role === 'SELLER' || user.role === 'ADMIN')) {
        fetchDeliveryPersons();
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryPersons = async () => {
    try {
      const res = await deliveryPersonService.getActive();
      // `api` response interceptor returns response.data directly, so use the
      // returned value (array) instead of expecting `res.data`.
      setDeliveryPersons(res || []);
    } catch (err) {
      console.error('Error fetching delivery persons:', err);
    }
  };

  const openAssignModal = () => {
    setSelectedDeliveryPersonId(order?.deliveryPersonId || null);
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedDeliveryPersonId) {
      toast.error('Please select a delivery person');
      return;
    }

    try {
      // pass acting user id and type for server-side authorization
      await orderService.assignDeliveryPerson(order.id, selectedDeliveryPersonId, user?.id, user?.role);
      toast.success('Delivery person assigned');
      setShowAssignModal(false);
      fetchOrderDetails();
    } catch (err) {
      console.error('Error assigning delivery person:', err);
      toast.error('Failed to assign delivery person');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'primary';
      case 'SHIPPED': return 'info';
      case 'DELIVERED': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'CONFIRMED': return '✅';
      case 'SHIPPED': return '🚚';
      case 'DELIVERED': return '📦';
      default: return '📋';
    }
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'PENDING': return 25;
      case 'CONFIRMED': return 50;
      case 'SHIPPED': return 75;
      case 'DELIVERED': return 100;
      default: return 0;
    }
  };

  const getDeliveryEstimate = (status, orderDate) => {
    const date = new Date(orderDate);
    switch (status) {
      case 'PENDING':
        date.setDate(date.getDate() + 5);
        return `Expected delivery by ${date.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}`;
      case 'CONFIRMED':
        date.setDate(date.getDate() + 3);
        return `Expected delivery by ${date.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}`;
      case 'SHIPPED':
        date.setDate(date.getDate() + 1);
        return `Arriving ${date.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}`;
      case 'DELIVERED':
        return `Delivered on ${date.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}`;
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotal = () => {
    if (!order?.orderItems) return 0;
    return order.orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-2">Loading order details...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Order</Alert.Heading>
          <p>{error}</p>
        </Alert>
        <div className="text-center">
          <Button variant="primary" onClick={() => navigate('/orders')} className="me-3">
            Back to Orders
          </Button>
          <Button variant="outline-primary" onClick={() => fetchOrderDetails()}>
            Try Again
          </Button>
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Order Not Found</Alert.Heading>
          <p>The requested order could not be found or you don't have permission to view it.</p>
        </Alert>
        <div className="text-center">
          <Button variant="primary" onClick={() => navigate('/orders')}>
            Back to Orders
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Container>
        {/* Header with Breadcrumb */}
        <Row className="mb-4">
          <Col>
            <div className="bg-white rounded-3 shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <nav style={{ '--bs-breadcrumb-divider': '>' }}>
                    <ol className="breadcrumb mb-1">
                      <li className="breadcrumb-item">
                        <Button variant="link" className="p-0 text-decoration-none" onClick={() => navigate('/orders')}>
                          Your Orders
                        </Button>
                      </li>
                      <li className="breadcrumb-item active">Order Details</li>
                    </ol>
                  </nav>
                  <h2 className="mb-0">Order #{order.id}</h2>
                </div>
                <Button variant="outline-primary" onClick={() => navigate('/orders')}>
                  ← Back to Orders
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Order Status Timeline */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 className="mb-1">
                      <span className="me-2">{getStatusIcon(order.status)}</span>
                      Order {order.status.toLowerCase()}
                    </h5>
                    <p className="text-muted mb-0">{getDeliveryEstimate(order.status, order.orderDate)}</p>
                  </div>
                  <Badge bg={getStatusBadgeColor(order.status)} className="fs-6 px-3 py-2">
                    {order.status}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <ProgressBar 
                    now={getProgressPercentage(order.status)} 
                    variant={getStatusBadgeColor(order.status)}
                    style={{ height: '8px' }}
                  />
                </div>

                {/* Status Steps */}
                <Row className="text-center">
                  {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].map((status, index) => {
                    const isActive = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].indexOf(order.status) >= index;
                    const isCurrent = order.status === status;
                    
                    return (
                      <Col key={status}>
                        <div className={`p-2 ${isCurrent ? 'text-primary' : isActive ? 'text-success' : 'text-muted'}`}>
                          <div 
                            className={`rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center ${
                              isCurrent 
                                ? 'bg-primary text-white' 
                                : isActive 
                                ? 'bg-success text-white' 
                                : 'bg-light'
                            }`} 
                            style={{ width: '40px', height: '40px' }}
                          >
                            {isActive ? '✓' : index + 1}
                          </div>
                          <div className="small fw-medium">{status}</div>
                          <div className="small text-muted">
                            {status === 'PENDING' && 'Order Received'}
                            {status === 'CONFIRMED' && 'Order Confirmed'}
                            {status === 'SHIPPED' && 'In Transit'}
                            {status === 'DELIVERED' && 'Delivered'}
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Order Items */}
          <Col lg={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom-0 p-4">
                <h5 className="mb-0">Order Items</h5>
              </Card.Header>
              <Card.Body className="p-0">
                {order.orderItems && order.orderItems.length > 0 ? (
                  <div>
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="border-bottom p-4">
                        <Row className="align-items-center">
                          <Col xs={3} md={2}>
                            <div 
                              className="bg-light rounded d-flex align-items-center justify-content-center"
                              style={{ width: '80px', height: '80px' }}
                            >
                              {(item.product?.imageUrl || item.imageUrl) ? (
                                <img
                                  src={item.product?.imageUrl || item.imageUrl}
                                  alt={item.product?.name || item.productName}
                                  style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                                  className="rounded"
                                />
                              ) : (
                                <span style={{ fontSize: '32px' }}>📦</span>
                              )}
                            </div>
                          </Col>
                          <Col xs={9} md={6}>
                            <h6 className="mb-1">{item.product?.name || item.productName || 'Product'}</h6>
                            {(item.product?.brand || item.brand) && (
                              <small className="text-muted d-block">by {item.product?.brand || item.brand}</small>
                            )}
                            <div className="mt-2">
                              <span className="badge bg-light text-dark">Qty: {item.quantity}</span>
                              <span className="ms-2 text-muted">₹{(item.price || 0).toLocaleString()} each</span>
                            </div>
                          </Col>
                          <Col md={2} className="text-end">
                            <div className="h6 mb-0">₹{((item.price || 0) * (item.quantity || 0)).toLocaleString()}</div>
                          </Col>
                          <Col md={2} className="text-end">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/products/${item.product?.id || item.productId}`)}
                            >
                              Buy Again
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    ))}
                    
                    {/* Order Total */}
                    <div className="p-4 bg-light">
                      <Row>
                        <Col md={8}></Col>
                        <Col md={4}>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Subtotal:</span>
                            <span>₹{calculateTotal().toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Shipping:</span>
                            <span className="text-success">FREE</span>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between h5">
                            <strong>Total:</strong>
                            <strong className="text-primary">₹{calculateTotal().toLocaleString()}</strong>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <p>No items found for this order.</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Order Summary Sidebar */}
          <Col lg={4}>
            {/* Order Info */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom-0 p-4">
                <h5 className="mb-0">Order Information</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <small className="text-muted d-block">Order Date</small>
                  <strong>{formatDate(order.orderDate)}</strong>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Order ID</small>
                  <strong>#{order.id}</strong>
                </div>
                {order.deliveryPersonName && (
                  <div className="mb-3">
                    <small className="text-muted d-block">Delivery Person</small>
                    <strong>{order.deliveryPersonName}</strong>
                    <div className="text-muted small">{order.deliveryPersonPhone}{order.deliveryPersonVehicle ? ` • ${order.deliveryPersonVehicle}` : ''}</div>
                    {order.deliveryAssignedAt && (
                      <div className="text-muted small">Assigned: {formatDate(order.deliveryAssignedAt)}</div>
                    )}
                  </div>
                )}
                <div className="mb-3">
                  <small className="text-muted d-block">Payment Method</small>
                  <strong>{order.paymentMethod}</strong>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Order Total</small>
                  <h5 className="text-primary mb-0">₹{calculateTotal().toLocaleString()}</h5>
                </div>
              </Card.Body>
            </Card>

            {/* Shipping Address */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom-0 p-4">
                <h5 className="mb-0">Shipping Address</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <p className="mb-0">{order.shippingAddress}</p>
              </Card.Body>
            </Card>

            {/* Action Buttons */}
            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => setShowTrackingModal(true)}
              >
                Track Package
              </Button>
                {(user && (user.role === 'SELLER' || user.role === 'ADMIN')) && (
                  <Button variant="outline-success" onClick={openAssignModal}>
                    Assign Delivery
                  </Button>
                )}
              <Button 
                variant="outline-primary"
                onClick={() => navigate('/orders')}
              >
                View All Orders
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={() => navigate('/products')}
              >
                Continue Shopping
              </Button>
              {order.status === 'DELIVERED' && (
                <Button variant="outline-danger">
                  Return Items
                </Button>
              )}
            </div>
          </Col>
        </Row>

        {/* Tracking Modal */}
        <Modal show={showTrackingModal} onHide={() => setShowTrackingModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Track Your Package</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center py-4">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
              <h5>Order #{order.id}</h5>
              <p className="text-muted mb-4">
                Your package is currently <strong>{order.status.toLowerCase()}</strong>
              </p>
                {order.deliveryPersonName && (
                  <div className="mb-3">
                    <h6 className="mb-1">Delivery Person</h6>
                    <div><strong>{order.deliveryPersonName}</strong> • {order.deliveryPersonPhone}</div>
                    {order.deliveryPersonVehicle && (<div className="small text-muted">Vehicle: {order.deliveryPersonVehicle}</div>)}
                  </div>
                )}
              <div className="text-start">
                <div className="timeline">
                  {['Order Placed', 'Order Confirmed', 'Package Shipped', 'Out for Delivery', 'Delivered'].map((step, index) => {
                    const statusIndex = ['PENDING', 'CONFIRMED', 'SHIPPED', 'SHIPPED', 'DELIVERED'].indexOf(order.status);
                    const isCompleted = index <= statusIndex;
                    
                    return (
                      <div key={index} className={`timeline-item ${isCompleted ? 'completed' : ''}`}>
                        <div className="timeline-marker">
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <div className="timeline-content">
                          <h6 className={isCompleted ? 'text-success' : 'text-muted'}>{step}</h6>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowTrackingModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Assign Delivery Modal */}
        <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Assign Delivery Person</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Label>Select Delivery Person</Form.Label>
              <ListGroup variant="flush">
                {deliveryPersons.length === 0 && (
                  <ListGroup.Item>No active delivery persons available</ListGroup.Item>
                )}
                {deliveryPersons.map(dp => (
                  <ListGroup.Item key={dp.id} action active={selectedDeliveryPersonId === dp.id} onClick={() => setSelectedDeliveryPersonId(dp.id)}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{dp.name}</strong>
                        <div className="small text-muted">{dp.phone} {dp.vehicle ? `• ${dp.vehicle}` : ''}</div>
                        <div className="small text-muted">{dp.currentLocation}</div>
                      </div>
                      <div>
                        {selectedDeliveryPersonId === dp.id && <Badge bg="primary">Selected</Badge>}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAssign}>Assign</Button>
          </Modal.Footer>
        </Modal>
      </Container>

      {/* Custom Styles */}
      <style jsx>{`
        .timeline {
          position: relative;
          padding-left: 30px;
        }
        
        .timeline::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 0;
          height: 100%;
          width: 2px;
          background: #dee2e6;
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 25px;
        }
        
        .timeline-marker {
          position: absolute;
          left: -25px;
          top: 2px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #dee2e6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: #6c757d;
        }
        
        .timeline-item.completed .timeline-marker {
          background: #28a745;
          border-color: #28a745;
          color: white;
        }
        
        .timeline-content h6 {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default OrderDetails;