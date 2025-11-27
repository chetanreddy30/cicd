import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { toast } from 'react-toastify';

const Orders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('NEWEST');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // SSE subscription for customer's orders
  useEffect(() => {
    if (!user) return;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const esUrl = `${base.replace(/\/$/, '')}/stream/orders`;
    let es;
    try {
      es = new EventSource(esUrl);
    } catch (e) {
      console.error('SSE connection failed', e);
      return;
    }

    const handle = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (!data || !data.id) return;
        if (data.userId === user.id) {
          setOrders(prev => {
            const exists = prev.find(o => o.id === data.id);
            if (exists) return prev.map(o => o.id === data.id ? data : o);
            return [data, ...prev];
          });
          toast.info(`Order #${data.id} updated`);
        }
      } catch (err) {
        // ignore parse errors
      }
    };

    es.addEventListener('order-updated', handle);
    es.addEventListener('order-created', handle);
    es.onmessage = handle;
    es.onerror = () => { try { es.close(); } catch(e){} };

    return () => { try { es.close(); } catch(e){} };
  }, [user]);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, statusFilter, searchTerm, sortBy]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders for user:', user.id);
      const ordersData = await orderService.getOrdersByUser(user.id);
      console.log('Orders received:', ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toString().includes(searchTerm) ||
        order.orderItems?.some(item => 
          (item.productName || item.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort orders
    switch (sortBy) {
      case 'NEWEST':
        filtered.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        break;
      case 'OLDEST':
        filtered.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
        break;
      case 'AMOUNT_HIGH':
        filtered.sort((a, b) => calculateOrderTotal(b) - calculateOrderTotal(a));
        break;
      case 'AMOUNT_LOW':
        filtered.sort((a, b) => calculateOrderTotal(a) - calculateOrderTotal(b));
        break;
      default:
        break;
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'primary';
      case 'shipped': return 'info';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'shipped': return '🚚';
      case 'delivered': return '📦';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDeliveryEstimate = (status, orderDate) => {
    const date = new Date(orderDate);
    switch (status.toLowerCase()) {
      case 'pending':
        date.setDate(date.getDate() + 5);
        return `Expected by ${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
      case 'confirmed':
        date.setDate(date.getDate() + 3);
        return `Expected by ${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
      case 'shipped':
        date.setDate(date.getDate() + 1);
        return `Arriving ${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
      case 'delivered':
        return 'Delivered';
      default:
        return '';
    }
  };

  const calculateOrderTotal = (order) => {
    if (!order.orderItems || order.orderItems.length === 0) return 0;
    return order.orderItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3">
            <h5>Loading your orders...</h5>
            <p className="text-muted">Please wait while we fetch your order history</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Container>
        {/* Header Section */}
        <Row className="mb-4">
          <Col>
            <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">Your Orders</h2>
                  <p className="text-muted mb-0">Track, return, or buy things again</p>
                </div>
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/products')}
                  className="d-none d-md-block"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Filters and Search */}
        {orders.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Label className="small text-muted">Search orders</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>🔍</InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search by order ID or product name"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Form.Label className="small text-muted">Filter by status</Form.Label>
                      <Form.Select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="ALL">All Orders</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Label className="small text-muted">Sort by</Form.Label>
                      <Form.Select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="NEWEST">Newest First</option>
                        <option value="OLDEST">Oldest First</option>
                        <option value="AMOUNT_HIGH">Amount: High to Low</option>
                        <option value="AMOUNT_LOW">Amount: Low to High</option>
                      </Form.Select>
                    </Col>
                    <Col md={2} className="d-flex align-items-end">
                      <div className="text-center w-100">
                        <small className="text-muted">
                          {filteredOrders.length} of {orders.length} orders
                        </small>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Orders Display */}
        {orders.length === 0 ? (
          <Row>
            <Col>
              <Card className="border-0 shadow-sm text-center">
                <Card.Body className="py-5">
                  <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>�</div>
                  <h3 className="mb-3">No orders yet</h3>
                  <p className="text-muted mb-4 lead">
                    Looks like you haven't placed any orders yet.<br />
                    Start shopping to see your orders here!
                  </p>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={() => navigate('/products')}
                    className="px-4"
                  >
                    Start Shopping
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : filteredOrders.length === 0 ? (
          <Row>
            <Col>
              <Card className="border-0 shadow-sm text-center">
                <Card.Body className="py-5">
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                  <h4>No orders found</h4>
                  <p className="text-muted">Try adjusting your search or filter criteria</p>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                    }}
                  >
                    Clear Filters
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <Row>
            <Col>
              {filteredOrders.map(order => (
                <Card key={order.id} className="border-0 shadow-sm mb-4 overflow-hidden">
                  <Card.Body className="p-0">
                    {/* Order Header */}
                    <div className="bg-light p-3 border-bottom">
                      <Row className="align-items-center">
                        <Col md={3}>
                          <div>
                            <small className="text-muted">ORDER PLACED</small>
                            <div className="fw-medium">{formatDate(order.orderDate)}</div>
                          </div>
                        </Col>
                        <Col md={2}>
                          <div>
                            <small className="text-muted">TOTAL</small>
                            <div className="fw-bold">₹{calculateOrderTotal(order).toLocaleString()}</div>
                          </div>
                        </Col>
                        <Col md={2}>
                          <div>
                            <small className="text-muted">SHIP TO</small>
                            <div className="fw-medium text-truncate">{user.name}</div>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="d-flex align-items-center">
                            <span className="me-2">{getStatusIcon(order.status)}</span>
                            <div>
                              <Badge bg={getStatusColor(order.status)} className="mb-1">
                                {order.status}
                              </Badge>
                              <div className="small text-muted">
                                {getDeliveryEstimate(order.status, order.orderDate)}
                              </div>
                            </div>
                          </div>
                        </Col>
                        <Col md={2} className="text-end">
                          <small className="text-muted d-block">ORDER #{order.id}</small>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            View Details
                          </Button>
                        </Col>
                      </Row>
                    </div>

                    {/* Order Items Preview */}
                    <div className="p-3">
                      {order.orderItems && order.orderItems.slice(0, 3).map((item, index) => (
                        <Row key={index} className="align-items-center py-2">
                          <Col xs={2}>
                            <div 
                              className="bg-light rounded d-flex align-items-center justify-content-center"
                              style={{ width: '60px', height: '60px' }}
                            >
                              {(item.product?.imageUrl || item.imageUrl) ? (
                                <img
                                  src={item.product?.imageUrl || item.imageUrl}
                                  alt={item.product?.name || item.productName}
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  className="rounded"
                                />
                              ) : (
                                <span style={{ fontSize: '24px' }}>📦</span>
                              )}
                            </div>
                          </Col>
                          <Col xs={6}>
                            <div className="fw-medium">
                              {item.product?.name || item.productName || 'Product'}
                            </div>
                            {(item.product?.brand || item.brand) && (
                              <small className="text-muted">by {item.product?.brand || item.brand}</small>
                            )}
                            <div className="small text-muted">Qty: {item.quantity}</div>
                          </Col>
                          <Col xs={2} className="text-end">
                            <div className="fw-medium">₹{((item.price || 0) * (item.quantity || 0)).toLocaleString()}</div>
                          </Col>
                          <Col xs={2} className="text-end">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => navigate(`/products/${item.product?.id || item.productId}`)}
                            >
                              Buy Again
                            </Button>
                          </Col>
                        </Row>
                      ))}
                      
                      {order.orderItems && order.orderItems.length > 3 && (
                        <div className="text-center py-2">
                          <small className="text-muted">
                            and {order.orderItems.length - 3} more items
                          </small>
                        </div>
                      )}
                    </div>

                    {/* Order Actions */}
                    <div className="bg-light px-3 py-2 border-top">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            Track Package
                          </Button>
                          {order.status.toLowerCase() === 'delivered' && (
                            <Button variant="outline-secondary" size="sm">
                              Return Items
                            </Button>
                          )}
                        </div>
                        <div className="text-end">
                          <small className="text-muted">
                            {order.orderItems?.length || 0} item{(order.orderItems?.length || 0) !== 1 ? 's' : ''}
                          </small>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Orders;