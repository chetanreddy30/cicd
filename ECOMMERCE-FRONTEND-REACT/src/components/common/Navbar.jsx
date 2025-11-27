import React, { useContext } from 'react';
import { Navbar as BSNavbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { Store, User, Heart, Package } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <BSNavbar 
        className="shadow-lg"
        expand="lg"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
        variant="dark"
      >
        <Container>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <BSNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="me-2"
              >
                <Store size={32} className="text-warning" />
              </motion.div>
              <span className="fs-3 fw-bold text-warning">E Shopping</span>
            </BSNavbar.Brand>
          </motion.div>
          
          <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
          <BSNavbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Nav.Link as={Link} to="/" className="fw-semibold px-3">
                  <HomeIcon className="me-1" style={{ width: '18px', height: '18px' }} />
                  Home
                </Nav.Link>
              </motion.div>
              
              {/* Products - Only show for customers or when not logged in */}
              {(!user || user.role === 'USER') && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Nav.Link as={Link} to="/products" className="fw-semibold px-3">
                    <Package className="me-1" size={18} />
                    Products
                  </Nav.Link>
                </motion.div>
              )}
              
              {/* Seller Dashboard - Only for sellers */}
              {user?.role === 'SELLER' && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Nav.Link as={Link} to="/seller/dashboard" className="fw-semibold px-3">
                    <ArchiveBoxIcon className="me-1" style={{ width: '18px', height: '18px' }} />
                    Seller Dashboard
                  </Nav.Link>
                </motion.div>
              )}
            </Nav>
            
            <Nav className="ms-auto align-items-center">
              {user ? (
                <>
                  {/* Cart - Only show for customers */}
                  {user.role === 'USER' && (
                    <motion.div 
                      whileHover={{ scale: 1.1 }} 
                      whileTap={{ scale: 0.95 }}
                      className="me-3"
                    >
                      <Nav.Link as={Link} to="/cart" className="position-relative p-2">
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <ShoppingCartIcon style={{ width: '24px', height: '24px' }} />
                        </motion.div>
                        {cartItemCount > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Badge 
                              bg="danger" 
                              pill 
                              className="position-absolute top-0 start-100 translate-middle"
                              style={{ fontSize: '0.7rem' }}
                            >
                              {cartItemCount}
                            </Badge>
                          </motion.div>
                        )}
                      </Nav.Link>
                    </motion.div>
                  )}
                
                  <NavDropdown 
                    title={
                      <motion.div 
                        className="d-flex align-items-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <User size={18} className="me-1" />
                        {user.firstName || user.username || 'User'}
                        {user.role === 'SELLER' && (
                          <Badge bg="success" className="ms-2" style={{ fontSize: '0.6rem' }}>
                            Seller
                          </Badge>
                        )}
                        {user.role === 'ADMIN' && (
                          <Badge bg="dark" className="ms-2" style={{ fontSize: '0.6rem' }}>
                            Admin
                          </Badge>
                        )}
                        {user.role === 'USER' && (
                          <Badge bg="primary" className="ms-2" style={{ fontSize: '0.6rem' }}>
                            Customer
                          </Badge>
                        )}
                      </motion.div>
                    } 
                    id="basic-nav-dropdown"
                    className="fw-semibold"
                  >
                    <motion.div whileHover={{ backgroundColor: '#f8f9fa' }}>
                      <NavDropdown.Item as={Link} to="/profile">
                        <UserIcon className="me-2" style={{ width: '16px', height: '16px' }} />
                        Profile
                      </NavDropdown.Item>
                    </motion.div>
                    
                    {/* Orders - Only show for customers */}
                    {user.role === 'USER' && (
                      <motion.div whileHover={{ backgroundColor: '#f8f9fa' }}>
                        <NavDropdown.Item as={Link} to="/orders">
                          <Package className="me-2" size={16} />
                          My Orders
                        </NavDropdown.Item>
                      </motion.div>
                    )}

                    {/* Admin Dashboard - only for admins */}
                    {user.role === 'ADMIN' && (
                      <motion.div whileHover={{ backgroundColor: '#f8f9fa' }}>
                        <NavDropdown.Item as={Link} to="/admin">
                          <Cog6ToothIcon className="me-2" style={{ width: '16px', height: '16px' }} />
                          Admin Dashboard
                        </NavDropdown.Item>
                      </motion.div>
                    )}
                    
                    <NavDropdown.Divider />
                    
                    <motion.div whileHover={{ backgroundColor: '#f8f9fa' }}>
                      <NavDropdown.Item onClick={handleLogout}>
                        <ArrowRightOnRectangleIcon className="me-2" style={{ width: '16px', height: '16px' }} />
                        Logout
                      </NavDropdown.Item>
                    </motion.div>
                  </NavDropdown>
                </>
              ) : (
                <div className="d-flex gap-2 align-items-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/login" className="btn btn-outline-light rounded-pill px-3">
                      Login
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/register" className="btn btn-warning rounded-pill px-3">
                      Register
                    </Link>
                  </motion.div>

                  {/* Admin login quick link when not logged in */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/admin/login" className="btn btn-outline-secondary rounded-pill px-3">
                      Admin Login
                    </Link>
                  </motion.div>
                </div>
              )}
            </Nav>
          </BSNavbar.Collapse>
        </Container>
      </BSNavbar>
    </motion.div>
  );
};

export default Navbar;