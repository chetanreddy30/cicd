import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Tabs, Tab, Badge, ProgressBar } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { sellerService } from '../services/sellerService';

const SellerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    imageUrl: '',
    category: '',
    brand: ''
  });

  // Calculate statistics with useMemo for efficient updates
  const statistics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => 
      sum + (order.orderItems?.reduce((itemSum, item) => 
        itemSum + (products.some(p => p.id === item.product?.id) ? 
          (item.price * item.quantity) : 0), 0) || 0), 0
    );

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'PENDING').length;
    const confirmedOrders = orders.filter(order => order.status === 'CONFIRMED').length;
    const shippedOrders = orders.filter(order => order.status === 'SHIPPED').length;
    const deliveredOrders = orders.filter(order => order.status === 'DELIVERED').length;

    // Calculate total sold items (only confirmed, shipped, delivered orders)
    const soldOrders = orders.filter(order => 
      ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status)
    );
    const totalSoldItems = soldOrders.reduce((sum, order) => 
      sum + (order.orderItems?.reduce((itemSum, item) => 
        itemSum + (products.some(p => p.id === item.product?.id) ? item.quantity : 0), 0) || 0), 0
    );

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      totalSoldItems
    };
  }, [orders, products]);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  // SSE subscription for seller-related orders
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
        // If any order item belongs to this seller, update seller orders
        const hasItem = data.orderItems?.some(it => it.sellerId === user.id);
        if (hasItem) {
          setOrders(prev => {
            const exists = prev.find(o => o.id === data.id);
            if (exists) return prev.map(o => o.id === data.id ? data : o);
            return [data, ...prev];
          });
          toast.info(`Order #${data.id} updated for your products`);
        }
      } catch (err) {
        // ignore
      }
    };

    es.addEventListener('order-updated', handle);
    es.addEventListener('order-created', handle);
    es.onmessage = handle;
    es.onerror = () => { try { es.close(); } catch(e){} };

    return () => { try { es.close(); } catch(e){} };
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      if (user && user.id) {
        const data = await productService.getProductsBySeller(user.id);
        setProducts(Array.isArray(data) ? data : []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`Updating order ${orderId} status to ${newStatus}`);
      
      // Update the order status on the backend
      const response = await orderService.updateOrderStatus(orderId, newStatus);
      console.log('Update response:', response);
      
      // Immediately update the local state for instant feedback
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        );
        console.log('Updated local orders:', updatedOrders);
        return updatedOrders;
      });
      
      toast.success(`Order status updated to ${newStatus}`);
      
      // Also refresh from server to ensure consistency
      console.log('Refreshing orders from server...');
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      // If update failed, refresh to get current state
      await fetchOrders();
    }
  };

  const handleStatusChange = (orderId, currentStatus, newStatus) => {
    if (newStatus !== currentStatus) {
      updateOrderStatus(orderId, newStatus);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      if (user && user.id) {
        console.log('Fetching orders for seller:', user.id);
        // Use the new seller orders endpoint
        const sellerOrders = await orderService.getOrdersBySeller(user.id);
        console.log('Fetched orders:', sellerOrders);
        setOrders(Array.isArray(sellerOrders) ? sellerOrders : []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData);
      } else {
        await productService.createProduct(formData, user.id);
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        imageUrl: '',
        category: '',
        brand: ''
      });
      await fetchProducts();
      await fetchOrders(); // Refresh orders too
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  if (!user || user.role !== 'SELLER') {
    return (
      <Container className="py-4">
        <div className="text-center">
          <h2>Access Denied</h2>
          <p>You need to be logged in as a seller to access this page.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Seller Dashboard</h2>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Add Product
            </Button>
          </div>

          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                  <Card.Title>Total Products</Card.Title>
                  <h3 className="text-primary">{products.length}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                  <Card.Title>Total Revenue</Card.Title>
                  <h3 className="text-success">
                    ₹{statistics.totalRevenue.toLocaleString()}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                  <Card.Title>Total Orders</Card.Title>
                  <h3 className="text-info">{statistics.totalOrders}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                  <Card.Title>Pending Orders</Card.Title>
                  <h3 className="text-warning">{statistics.pendingOrders}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Additional Statistics Row */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                  <Card.Title>Items Sold</Card.Title>
                  <h3 className="text-success">{statistics.totalSoldItems}</h3>
                  <small className="text-muted">Confirmed, Shipped & Delivered</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                  <Card.Title>Completed Orders</Card.Title>
                  <h3 className="text-success">{statistics.confirmedOrders + statistics.shippedOrders + statistics.deliveredOrders}</h3>
                  <small className="text-muted">Non-pending orders</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💼</div>
                  <Card.Title>Active Products</Card.Title>
                  <h3 className="text-info">{products.filter(p => p.stockQuantity > 0).length}</h3>
                  <small className="text-muted">In stock products</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Add quick stats for different order statuses */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <h5>Order Status Overview</h5>
                  <Row className="text-center">
                    <Col>
                      <div className="p-2">
                        <Badge bg="warning" className="fs-6">PENDING</Badge>
                        <div className="h4 mt-1">{statistics.pendingOrders}</div>
                      </div>
                    </Col>
                    <Col>
                      <div className="p-2">
                        <Badge bg="primary" className="fs-6">CONFIRMED</Badge>
                        <div className="h4 mt-1">{statistics.confirmedOrders}</div>
                      </div>
                    </Col>
                    <Col>
                      <div className="p-2">
                        <Badge bg="info" className="fs-6">SHIPPED</Badge>
                        <div className="h4 mt-1">{statistics.shippedOrders}</div>
                      </div>
                    </Col>
                    <Col>
                      <div className="p-2">
                        <Badge bg="success" className="fs-6">DELIVERED</Badge>
                        <div className="h4 mt-1">{statistics.deliveredOrders}</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tabbed Interface for Products and Orders */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="products" title={
              <span>
                📦 Products 
                <Badge bg="primary" className="ms-2">{products.length}</Badge>
              </span>
            }>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0">Your Products</Card.Title>
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    <i className="bi bi-plus"></i> Add Product
                  </Button>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <div className="mt-2">Loading your products...</div>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-5">
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                      <h4>No products yet</h4>
                      <p className="text-muted">Start selling by adding your first product!</p>
                      <Button variant="primary" onClick={() => setShowModal(true)}>
                        Add Your First Product
                      </Button>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead className="table-light">
                        <tr>
                          <th>Image</th>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Category</th>
                          <th>Orders</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => {
                          // Only count confirmed, shipped, or delivered orders as "sold"
                          const productOrders = orders.filter(order => 
                            order.orderItems?.some(item => item.product?.id === product.id) &&
                            ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status)
                          );
                          const totalSold = productOrders.reduce((sum, order) => 
                            sum + (order.orderItems?.find(item => item.product?.id === product.id)?.quantity || 0), 0
                          );
                          
                          return (
                            <tr key={product.id}>
                              <td>
                                <img 
                                  src={product.imageUrl || 'https://via.placeholder.com/50x50?text=No+Image'} 
                                  alt={product.name}
                                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/50x50?text=No+Image';
                                  }}
                                />
                              </td>
                              <td>
                                <div>
                                  <strong>{product.name}</strong>
                                  {product.brand && <div className="text-muted small">{product.brand}</div>}
                                </div>
                              </td>
                              <td>₹{product.price.toLocaleString()}</td>
                              <td>
                                <span className={`badge ${product.stockQuantity > 10 ? 'bg-success' : product.stockQuantity > 0 ? 'bg-warning' : 'bg-danger'}`}>
                                  {product.stockQuantity > 0 ? product.stockQuantity : 'Out of Stock'}
                                </span>
                              </td>
                              <td>{product.category}</td>
                              <td>
                                <Badge bg={totalSold > 0 ? 'success' : 'secondary'}>
                                  {totalSold} sold
                                </Badge>
                              </td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEdit(product)}
                                  className="me-2"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="orders" title={
              <span>
                📋 Orders 
                <Badge bg="info" className="ms-2">{orders.length}</Badge>
              </span>
            }>
              <Card>
                <Card.Header>
                  <Card.Title className="mb-0">Orders for Your Products</Card.Title>
                </Card.Header>
                <Card.Body>
                  {ordersLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-info" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <div className="mt-2">Loading orders...</div>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-5">
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                      <h4>No orders yet</h4>
                      <p className="text-muted">Orders containing your products will appear here.</p>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead className="table-light">
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Products</th>
                          <th>Total Amount</th>
                          <th>Status</th>
                          <th>Order Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const sellerItems = order.orderItems?.filter(item => 
                            products.some(product => product.id === item.product?.id)
                          ) || [];
                          
                          const orderTotal = sellerItems.reduce((sum, item) => 
                            sum + (item.price * item.quantity), 0
                          );

                          return (
                            <tr key={order.id}>
                              <td>
                                <strong>#{order.id}</strong>
                              </td>
                              <td>
                                <div>
                                  <strong>{order.user?.firstName} {order.user?.lastName}</strong>
                                  <div className="text-muted small">{order.user?.email}</div>
                                </div>
                              </td>
                              <td>
                                <div>
                                  {sellerItems.map((item, index) => (
                                    <div key={index} className="small">
                                      <strong>{item.product?.name}</strong> × {item.quantity}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <strong>₹{orderTotal.toLocaleString()}</strong>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <Badge bg={
                                    order.status === 'DELIVERED' ? 'success' :
                                    order.status === 'SHIPPED' ? 'info' :
                                    order.status === 'CONFIRMED' ? 'primary' :
                                    order.status === 'PENDING' ? 'warning' : 'danger'
                                  }>
                                    {order.status}
                                  </Badge>
                                  <Form.Select 
                                    size="sm" 
                                    style={{ width: '120px' }}
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order.id, order.status, e.target.value)}
                                  >
                                    <option value="PENDING">PENDING</option>
                                    <option value="CONFIRMED">CONFIRMED</option>
                                    <option value="SHIPPED">SHIPPED</option>
                                    <option value="DELIVERED">DELIVERED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                  </Form.Select>
                                </div>
                              </td>
                              <td>
                                <small>{new Date(order.orderDate).toLocaleDateString()}</small>
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    onClick={() => window.open(`/orders/${order.id}`, '_blank')}
                                  >
                                    View
                                  </Button>
                                  {order.status === 'PENDING' && (
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={() => handleStatusChange(order.id, order.status, 'CONFIRMED')}
                                    >
                                      Confirm
                                    </Button>
                                  )}
                                  {order.status === 'CONFIRMED' && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleStatusChange(order.id, order.status, 'SHIPPED')}
                                    >
                                      Ship
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? 'Edit Product' : 'Add Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stock Quantity</Form.Label>
              <Form.Control
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Brand</Form.Label>
              <Form.Control
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SellerDashboard;
