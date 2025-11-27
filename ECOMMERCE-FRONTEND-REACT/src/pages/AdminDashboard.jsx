import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Table, Tabs, Tab, Badge, Modal, Form, InputGroup, FormControl } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import { productService } from '../services/productService';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { orderService } from '../services/orderService';
import { sellerService } from '../services/sellerService';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');

  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [showDpModal, setShowDpModal] = useState(false);
  const [editingDp, setEditingDp] = useState(null);
  const [confirmState, setConfirmState] = useState({ show: false, title: '', message: '', onConfirm: null });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState('ALL');
  const [orderFrom, setOrderFrom] = useState('');
  const [orderTo, setOrderTo] = useState('');
  const [orderDpSelection, setOrderDpSelection] = useState({});

  const [searchUsers, setSearchUsers] = useState('');
  const [searchProducts, setSearchProducts] = useState('');
  const [pageUsers, setPageUsers] = useState(1);
  const [pageProducts, setPageProducts] = useState(1);
  const PAGE_SIZE = 10;

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  // SSE: subscribe to live order updates
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const esUrl = `${base.replace(/\/$/, '')}/stream/orders`;
    let es;
    try {
      es = new EventSource(esUrl);
    } catch (e) {
      console.error('SSE not supported or failed to connect', e);
      return;
    }

    es.addEventListener('connected', (ev) => {
      console.log('SSE connected');
    });

    const handleUpdate = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (!data || !data.id) return;
        setOrders(prev => {
          const exists = prev.find(o => o.id === data.id);
          if (exists) {
            return prev.map(o => o.id === data.id ? data : o);
          }
          return [data, ...prev];
        });
        if (selectedOrder && selectedOrder.id === data.id) setSelectedOrder(data);
        toast.info(`Order #${data.id} updated`);
      } catch (err) {
        console.error('Failed to parse SSE data', err);
      }
    };

    es.addEventListener('order-updated', handleUpdate);
    es.addEventListener('order-created', handleUpdate);
    es.onmessage = (ev) => {
      // fallback
      handleUpdate(ev);
    };

    es.onerror = (err) => {
      console.error('SSE error', err);
      es.close();
    };

    return () => {
      try { es.close(); } catch (e) {}
    };
  }, [selectedOrder]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      // Fetch each resource separately so failures are isolated and easier to debug
      try {
        const u = await adminService.getAllUsers();
        setUsers(Array.isArray(u) ? u : []);
      } catch (err) {
        console.error('Failed to fetch users', err);
        setUsers([]);
      }

      try {
        const s = await adminService.getAllSellers();
        setSellers(Array.isArray(s) ? s : []);
      } catch (err) {
        console.error('Failed to fetch sellers', err);
        setSellers([]);
      }

      try {
        const p = await adminService.getAllProducts();
        setProducts(Array.isArray(p) ? p : []);
      } catch (err) {
        console.error('Failed to fetch products', err);
        setProducts([]);
      }

      try {
        const o = await adminService.getAllOrders();
        setOrders(Array.isArray(o) ? o : []);
      } catch (err) {
        console.error('Failed to fetch orders', err);
        setOrders([]);
      }

      try {
        const d = await deliveryPersonService.getAll();
        console.debug('AdminDashboard.fetchAll: delivery persons raw:', d);
        setDeliveryPersons(Array.isArray(d) ? d : []);
      } catch (err) {
        console.error('Failed to fetch delivery persons', err);
        setDeliveryPersons([]);
        toast.error('Failed to load delivery persons (check backend).');
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setConfirmState({
      show: true,
      title: 'Delete User',
      message: 'Delete user? This cannot be undone.',
      onConfirm: async () => {
        try {
          await adminService.deleteUser(id);
          setUsers(prev => prev.filter(u => u.id !== id));
          toast.success('User deleted');
        } catch (err) {
          console.error(err);
          toast.error('Failed to delete user');
        } finally {
          setConfirmState(s => ({ ...s, show: false }));
        }
      }
    });
  };

  const handleDeleteSeller = async (id) => {
    setConfirmState({
      show: true,
      title: 'Delete Seller',
      message: 'Delete seller? This cannot be undone.',
      onConfirm: async () => {
        try {
          await adminService.deleteSeller(id);
          setSellers(prev => prev.filter(s => s.id !== id));
          toast.success('Seller deleted');
        } catch (err) {
          console.error(err);
          toast.error('Failed to delete seller');
        } finally {
          setConfirmState(s => ({ ...s, show: false }));
        }
      }
    });
  };

  const handleDeleteProduct = async (id) => {
    setConfirmState({
      show: true,
      title: 'Delete Product',
      message: 'Delete product? This cannot be undone.',
      onConfirm: async () => {
        try {
          await adminService.deleteProduct(id);
          setProducts(prev => prev.filter(p => p.id !== id));
          toast.success('Product deleted');
        } catch (err) {
          console.error(err);
          toast.error('Failed to delete product');
        } finally {
          setConfirmState(s => ({ ...s, show: false }));
        }
      }
    });
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      // Use public orders endpoint which returns OrderDTO
      const updated = await orderService.updateOrderStatus(orderId, status);
      if (updated) {
        setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
        if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order status');
    }
  };

  // Edit user/product flows
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const openEditUser = (u) => { setEditingUser(u); setShowUserModal(true); };
  const openEditProduct = (p) => { setEditingProduct(p); setShowProductModal(true); };

  const handleSaveUser = async (data) => {
    try {
      if (!editingUser) return;
      // Try admin endpoint first, fallback to public user endpoint
      try {
        await adminService.updateUser(editingUser.id, data);
      } catch (e) {
        // Fallback to authService which calls /users/{id}
        await authService.updateUser(editingUser.id, data);
      }
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
      toast.success('User updated');
      setShowUserModal(false);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update user');
    }
  };

  const handleSaveProduct = async (data) => {
    try {
      if (!editingProduct) return;
      // try admin endpoint first, fall back to productService
      try {
        await adminService.updateProduct(editingProduct.id, data);
      } catch (e) {
        await productService.updateProduct(editingProduct.id, data);
      }
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...data } : p));
      toast.success('Product updated');
      setShowProductModal(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update product');
    }
  };

  // Order details modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  // `selectedOrder` state is declared earlier near the top of the component;
  // reuse that instead of redeclaring it here.

  const openOrderDetails = async (order) => {
    // Ensure we have fresh order details from server
    try {
      const full = await orderService.getOrderById(order.id);
      setSelectedOrder(full || order);
    } catch (e) {
      console.error('Failed to fetch order details, falling back to provided order', e);
      setSelectedOrder(order);
    }
    setShowOrderModal(true);
  };

  const handleAssignDelivery = async (orderId, deliveryPersonId) => {
    try {
      // acting user is current admin
      const updated = await orderService.assignDeliveryPerson(orderId, deliveryPersonId, user?.id, 'ADMIN');
      if (updated) {
        // updated is an OrderDTO — replace in orders list and selectedOrder
        setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
        setSelectedOrder(updated);
        // refresh entire admin data to propagate changes to sellers/users views
        fetchAll();
        toast.success('Delivery person assigned and order updated');
      } else {
        toast.error('Failed to assign delivery person');
      }
      setShowOrderModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign delivery person');
    }
  };

  const openCreateDp = () => {
    setEditingDp(null);
    setShowDpModal(true);
  };

  const openEditDp = (dp) => {
    setEditingDp(dp);
    setShowDpModal(true);
  };

  const handleSaveDp = async (data) => {
    try {
      if (editingDp) {
        await deliveryPersonService.update(editingDp.id, data);
        toast.success('Delivery person updated');
      } else {
        await deliveryPersonService.create(data);
        toast.success('Delivery person created');
      }
      // Refresh from server so UI reflects persisted state
      await fetchAll();
      setShowDpModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save delivery person');
    }
  };
  const handleDeleteDp = async (id) => {
    setConfirmState({
      show: true,
      title: 'Delete Delivery Person',
      message: 'Delete delivery person? This cannot be undone.',
      onConfirm: async () => {
        try {
            await deliveryPersonService.delete(id);
            // Refresh list from server to ensure UI matches persisted data and avoid
            // mutating a possibly undefined previous state.
            await fetchAll();
            toast.success('Delivery person deleted');
        } catch (err) {
          console.error(err);
          toast.error('Failed to delete delivery person');
        } finally {
          setConfirmState(s => ({ ...s, show: false }));
        }
      }
    });
  };

  // Simple client-side search + pagination helpers
  const filteredUsers = users.filter(u => `${u.firstName} ${u.lastName} ${u.email} ${u.username}`.toLowerCase().includes(searchUsers.toLowerCase()));
  const usersPageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const usersPageItems = filteredUsers.slice((pageUsers-1)*PAGE_SIZE, pageUsers*PAGE_SIZE);

  const filteredProducts = products.filter(p => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(searchProducts.toLowerCase()));
  const productsPageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const productsPageItems = filteredProducts.slice((pageProducts-1)*PAGE_SIZE, pageProducts*PAGE_SIZE);

  // Orders filtering (client-side)
  const filteredOrders = orders.filter(o => {
    // status filter
    if (orderFilterStatus !== 'ALL' && o.status !== orderFilterStatus) return false;
    // search by id or product name
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      const inId = o.id?.toString().includes(q);
      const inItems = (o.orderItems || []).some(it => (it.productName || it.product?.name || '').toLowerCase().includes(q));
      if (!inId && !inItems) return false;
    }
    // date range filter (order.orderDate assumed ISO)
    if (orderFrom) {
      const from = new Date(orderFrom);
      const od = new Date(o.orderDate);
      if (od < from) return false;
    }
    if (orderTo) {
      const to = new Date(orderTo);
      const od = new Date(o.orderDate);
      // include day end
      to.setHours(23,59,59,999);
      if (od > to) return false;
    }
    return true;
  });

  if (!user || user.role !== 'ADMIN') {
    return (
      <Container className="py-4">
        <div className="text-center">
          <h2>Access Denied</h2>
          <p>You need to be logged in as admin to access this page.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Admin Dashboard</h2>
            <div>
              <Button variant="outline-secondary" className="me-2" onClick={fetchAll} disabled={loading}>Refresh</Button>
              <Button variant="outline-danger" onClick={logout}>Log out</Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Tabs activeKey={activeTab} onSelect={k => setActiveTab(k)}>
            <Tab eventKey="overview" title={<span>Overview <Badge bg="secondary" className="ms-2">{users.length + sellers.length + products.length}</Badge></span>}>
              <Card className="p-3">
                <Row>
                  <Col md={3}><Card className="text-center p-3"><h5>Users</h5><h3>{users.length}</h3></Card></Col>
                  <Col md={3}><Card className="text-center p-3"><h5>Sellers</h5><h3>{sellers.length}</h3></Card></Col>
                  <Col md={3}><Card className="text-center p-3"><h5>Products</h5><h3>{products.length}</h3></Card></Col>
                  <Col md={3}><Card className="text-center p-3"><h5>Orders</h5><h3>{orders.length}</h3></Card></Col>
                </Row>
              </Card>
            </Tab>

            <Tab eventKey="users" title={`Users (${users.length})`}>
              <Card className="mt-3">
                <Card.Body>
                  <div className="mb-3 d-flex gap-2">
                    <InputGroup style={{ maxWidth: 360 }}>
                      <FormControl placeholder="Search users..." value={searchUsers} onChange={e => { setSearchUsers(e.target.value); setPageUsers(1); }} />
                    </InputGroup>
                  </div>
                  <Table responsive hover>
                    <thead className="table-light"><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                    <tbody>
                      {usersPageItems.map(u => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td>{u.firstName} {u.lastName} {u.username ? `(${u.username})` : ''}</td>
                          <td>{u.email}</td>
                          <td>{u.role || 'USER'}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEditUser(u)}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDeleteUser(u.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Showing {((pageUsers-1)*PAGE_SIZE)+1} - {Math.min(pageUsers*PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}</small>
                    <div>
                      <Button size="sm" variant="outline-secondary" disabled={pageUsers<=1} onClick={() => setPageUsers(p => Math.max(1, p-1))}>Prev</Button>{' '}
                      <Button size="sm" variant="outline-secondary" disabled={pageUsers>=usersPageCount} onClick={() => setPageUsers(p => Math.min(usersPageCount, p+1))}>Next</Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="sellers" title={`Sellers (${sellers.length})`}>
              <Card className="mt-3">
                <Card.Body>
                  <Table responsive hover>
                    <thead className="table-light"><tr><th>ID</th><th>Name</th><th>Email</th><th>Business</th><th>Actions</th></tr></thead>
                    <tbody>
                      {sellers.map(s => (
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td>{s.firstName} {s.lastName} {s.username ? `(${s.username})` : ''}</td>
                          <td>{s.email}</td>
                          <td>{s.businessName || '-'}</td>
                          <td>
                            <Button size="sm" variant="danger" onClick={() => handleDeleteSeller(s.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="products" title={`Products (${products.length})`}>
              <Card className="mt-3">
                <Card.Body>
                  <div className="mb-3 d-flex gap-2">
                    <InputGroup style={{ maxWidth: 360 }}>
                      <FormControl placeholder="Search products..." value={searchProducts} onChange={e => { setSearchProducts(e.target.value); setPageProducts(1); }} />
                    </InputGroup>
                  </div>
                  <Table responsive hover>
                    <thead className="table-light"><tr><th>ID</th><th>Name</th><th>Seller</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
                    <tbody>
                      {productsPageItems.map(p => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.name}</td>
                          <td>{p.seller?.username || p.sellerId || '-'}</td>
                          <td>₹{p.price}</td>
                          <td>{p.stockQuantity}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEditProduct(p)}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDeleteProduct(p.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Showing {((pageProducts-1)*PAGE_SIZE)+1} - {Math.min(pageProducts*PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length}</small>
                    <div>
                      <Button size="sm" variant="outline-secondary" disabled={pageProducts<=1} onClick={() => setPageProducts(p => Math.max(1, p-1))}>Prev</Button>{' '}
                      <Button size="sm" variant="outline-secondary" disabled={pageProducts>=productsPageCount} onClick={() => setPageProducts(p => Math.min(productsPageCount, p+1))}>Next</Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="orders" title={`Orders (${orders.length})`}>
              <Card className="mt-3">
                <Card.Body>
                  <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
                    <InputGroup style={{ maxWidth: 320 }}>
                      <FormControl placeholder="Search orders (id or product)..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
                    </InputGroup>
                    <Form.Select value={orderFilterStatus} onChange={e => setOrderFilterStatus(e.target.value)} style={{ width: 180 }}>
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </Form.Select>
                    <Form.Control type="date" value={orderFrom} onChange={e => setOrderFrom(e.target.value)} style={{ width: 180 }} />
                    <Form.Control type="date" value={orderTo} onChange={e => setOrderTo(e.target.value)} style={{ width: 180 }} />
                    <Button variant="outline-secondary" onClick={() => { setOrderSearch(''); setOrderFilterStatus('ALL'); setOrderFrom(''); setOrderTo(''); }}>Clear</Button>
                  </div>
                  <Table responsive hover>
                    <thead className="table-light"><tr><th>ID</th><th>User</th><th>Total</th><th>Status</th><th>Delivery</th><th>Assigned At</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <tr key={o.id}>
                          <td>{o.id}</td>
                          <td>{o.userId}</td>
                                  <td>₹{(o.orderItems?.reduce((s, it) => s + (it.price * it.quantity), 0) || 0).toLocaleString()}</td>
                                  <td><Badge bg={o.status === 'DELIVERED' ? 'success' : o.status === 'OUT_FOR_DELIVERY' ? 'warning' : o.status === 'SHIPPED' ? 'info' : o.status === 'CONFIRMED' ? 'primary' : 'secondary'}>{o.status === 'OUT_FOR_DELIVERY' ? 'OUT FOR DELIVERY' : o.status}</Badge></td>
                                  <td>
                                    {o.deliveryPersonName || '-'}
                                  </td>
                                  <td>{o.deliveryAssignedAt ? new Date(o.deliveryAssignedAt).toLocaleString() : '-'}</td>
                          <td>
                              <div className="d-flex gap-2 align-items-center">
                                <FormSelectStatus current={o.status} onChange={(s) => handleUpdateOrderStatus(o.id, s)} />
                                <Button size="sm" variant="outline-primary" onClick={() => openOrderDetails(o)}>Details</Button>
                                {/* Quick-assign select/button */}
                                <Form.Select size="sm" value={orderDpSelection[o.id] ?? (o.deliveryPersonId || '')} onChange={(e) => setOrderDpSelection(s => ({ ...s, [o.id]: e.target.value }))} style={{ width: 180 }}>
                                  <option value="">Assign delivery</option>
                                  {deliveryPersons.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} — {d.currentLocation || d.phone}</option>
                                  ))}
                                </Form.Select>
                                <Button size="sm" variant="success" onClick={async () => {
                                  const dpId = orderDpSelection[o.id] || o.deliveryPersonId;
                                  if (!dpId) { toast.info('Select a delivery person first'); return; }
                                  await handleAssignDelivery(o.id, dpId);
                                }}>Assign</Button>
                              </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="delivery" title={`Delivery Persons (${deliveryPersons.length})`}>
              <Card className="mt-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <Button variant="primary" onClick={openCreateDp}>Add Delivery Person</Button>
                    </div>
                    <div>
                      <InputGroup style={{ minWidth: 240 }}>
                        <FormControl placeholder="Search delivery persons..." onChange={e => {
                          const q = e.target.value.toLowerCase();
                          setDeliveryPersons(prev => prev ? prev.filter(d => `${d.name} ${d.phone} ${d.currentLocation} ${d.vehicle}`.toLowerCase().includes(q)) : []);
                        }} />
                      </InputGroup>
                    </div>
                  </div>
                  {deliveryPersons.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-2">No delivery persons found.</p>
                      <div className="d-flex justify-content-center gap-2">
                        <Button variant="primary" onClick={openCreateDp}>Add Delivery Person</Button>
                        <Button variant="outline-secondary" onClick={fetchAll}>Refresh</Button>
                      </div>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead className="table-light"><tr><th>ID</th><th>Name</th><th>Phone</th><th>Vehicle</th><th>Location</th><th>Actions</th></tr></thead>
                      <tbody>
                        {deliveryPersons.map(d => (
                          <tr key={d.id}>
                            <td>{d.id}</td>
                            <td>{d.name}</td>
                            <td>{d.phone}</td>
                            <td>{d.vehicle}</td>
                            <td>{d.currentLocation}</td>
                            <td>
                              <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEditDp(d)}>Edit</Button>
                              <Button size="sm" variant="danger" onClick={() => handleDeleteDp(d.id)}>Delete</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Delivery Person Modal */}
      <Modal show={showDpModal} onHide={() => setShowDpModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingDp ? 'Edit' : 'Add'} Delivery Person</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DeliveryPersonForm initial={editingDp} onCancel={() => setShowDpModal(false)} onSave={handleSaveDp} />
        </Modal.Body>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <UserForm initial={editingUser} onCancel={() => setShowUserModal(false)} onSave={handleSaveUser} />
        </Modal.Body>
      </Modal>

      {/* Edit Product Modal */}
      <Modal show={showProductModal} onHide={() => setShowProductModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProductForm initial={editingProduct} onCancel={() => setShowProductModal(false)} onSave={handleSaveProduct} />
        </Modal.Body>
      </Modal>

      {/* Generic Confirm Modal */}
      <Modal show={confirmState.show} onHide={() => setConfirmState(s => ({ ...s, show: false }))}>
        <Modal.Header closeButton>
          <Modal.Title>{confirmState.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{confirmState.message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmState(s => ({ ...s, show: false }))}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirmState.onConfirm) confirmState.onConfirm(); }}>Confirm</Button>
        </Modal.Footer>
      </Modal>
      {/* Order Details Modal */}
      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Order Details {selectedOrder ? `#${selectedOrder.id}` : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder ? (
            <>
              <h6>Items</h6>
              <Table responsive size="sm">
                <thead className="table-light"><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {selectedOrder.orderItems?.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.product?.name || it.productName || '—'}</td>
                      <td>₹{it.price}</td>
                      <td>{it.quantity}</td>
                      <td>₹{(it.price * it.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <h6>Shipping</h6>
              <div className="mb-3">
                <div><strong>Address:</strong> {selectedOrder.shippingAddress || selectedOrder.shipping || '—'}</div>
                <div><strong>Total:</strong> ₹{(selectedOrder.orderItems?.reduce((s, it) => s + (it.price * it.quantity), 0) || 0).toLocaleString()}</div>
                <div><strong>Status:</strong> {selectedOrder.status}</div>
                <div><strong>Assigned Delivery:</strong> {selectedOrder.deliveryPersonId ? (deliveryPersons.find(d => d.id === selectedOrder.deliveryPersonId)?.name || selectedOrder.deliveryPersonId) : 'None'}</div>
              </div>

              <h6>Assign Delivery Person</h6>
              <Form onSubmit={(e) => { e.preventDefault(); const dp = e.target.deliveryPerson.value; if (dp) handleAssignDelivery(selectedOrder.id, dp); }}>
                <InputGroup>
                  <Form.Select name="deliveryPerson" defaultValue={selectedOrder.deliveryPersonId || ''}>
                    <option value="">-- Select --</option>
                    {deliveryPersons.map(d => <option key={d.id} value={d.id}>{d.name} — {d.currentLocation || d.phone}</option>)}
                  </Form.Select>
                  <Button type="submit" variant="primary">Assign</Button>
                </InputGroup>
              </Form>
            </>
          ) : (
            <div>Loading...</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

const FormSelectStatus = ({ current, onChange }) => {
  const statuses = ['PENDING','CONFIRMED','SHIPPED','DELIVERED'];
  return (
    <select className="form-select form-select-sm" value={current} onChange={(e) => onChange(e.target.value)}>
      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
};

export default AdminDashboard;

const DeliveryPersonForm = ({ initial, onCancel, onSave }) => {
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    vehicle: initial?.vehicle || '',
    currentLocation: initial?.currentLocation || '',
    active: initial?.active ?? true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-2">
        <Form.Label>Name</Form.Label>
        <Form.Control name="name" value={form.name} onChange={handleChange} required />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Phone</Form.Label>
        <Form.Control name="phone" value={form.phone} onChange={handleChange} required />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Vehicle</Form.Label>
        <Form.Control name="vehicle" value={form.vehicle} onChange={handleChange} />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Current Location</Form.Label>
        <Form.Control name="currentLocation" value={form.currentLocation} onChange={handleChange} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Check type="checkbox" label="Active" name="active" checked={form.active} onChange={handleChange} />
      </Form.Group>
      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onCancel} className="me-2">Cancel</Button>
        <Button variant="primary" type="submit">Save</Button>
      </div>
    </Form>
  );
};

const UserForm = ({ initial, onCancel, onSave }) => {
  const [form, setForm] = useState({
    firstName: initial?.firstName || '',
    lastName: initial?.lastName || '',
    email: initial?.email || '',
    username: initial?.username || '',
    role: initial?.role || 'USER'
  });

  useEffect(() => {
    setForm({
      firstName: initial?.firstName || '',
      lastName: initial?.lastName || '',
      email: initial?.email || '',
      username: initial?.username || '',
      role: initial?.role || 'USER'
    });
  }, [initial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-2">
        <Form.Label>First Name</Form.Label>
        <Form.Control name="firstName" value={form.firstName} onChange={handleChange} required />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Last Name</Form.Label>
        <Form.Control name="lastName" value={form.lastName} onChange={handleChange} />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Email</Form.Label>
        <Form.Control name="email" type="email" value={form.email} onChange={handleChange} required />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Username</Form.Label>
        <Form.Control name="username" value={form.username} onChange={handleChange} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Role</Form.Label>
        <Form.Select name="role" value={form.role} onChange={handleChange}>
          <option value="USER">USER</option>
          <option value="SELLER">SELLER</option>
          <option value="ADMIN">ADMIN</option>
        </Form.Select>
      </Form.Group>
      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onCancel} className="me-2">Cancel</Button>
        <Button variant="primary" type="submit">Save</Button>
      </div>
    </Form>
  );
};

const ProductForm = ({ initial, onCancel, onSave }) => {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price || '',
    stockQuantity: initial?.stockQuantity || '',
    imageUrl: initial?.imageUrl || '',
    category: initial?.category || '',
    brand: initial?.brand || ''
  });

  useEffect(() => {
    setForm({
      name: initial?.name || '',
      description: initial?.description || '',
      price: initial?.price || '',
      stockQuantity: initial?.stockQuantity || '',
      imageUrl: initial?.imageUrl || '',
      category: initial?.category || '',
      brand: initial?.brand || ''
    });
  }, [initial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert numeric fields
    const payload = { ...form, price: Number(form.price || 0), stockQuantity: Number(form.stockQuantity || 0) };
    onSave(payload);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-2">
        <Form.Label>Name</Form.Label>
        <Form.Control name="name" value={form.name} onChange={handleChange} required />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Description</Form.Label>
        <Form.Control as="textarea" rows={3} name="description" value={form.description} onChange={handleChange} />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Price</Form.Label>
        <Form.Control name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Stock Quantity</Form.Label>
        <Form.Control name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange} required />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Image URL</Form.Label>
        <Form.Control name="imageUrl" value={form.imageUrl} onChange={handleChange} />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Category</Form.Label>
        <Form.Control name="category" value={form.category} onChange={handleChange} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Brand</Form.Label>
        <Form.Control name="brand" value={form.brand} onChange={handleChange} />
      </Form.Group>
      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onCancel} className="me-2">Cancel</Button>
        <Button variant="primary" type="submit">Save</Button>
      </div>
    </Form>
  );
};
