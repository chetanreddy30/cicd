import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Login = () => {
  const { login, loginSeller } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('customer');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (activeTab === 'customer') {
        result = await login(formData);
      } else {
        result = await loginSeller(formData);
      }

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2>Welcome Back</h2>
                <p className="text-muted">Sign in to your account</p>
              </div>

              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
                justify
              >
                <Tab eventKey="customer" title="Customer">
                  <div className="text-center mb-3">
                    <small className="text-muted">Login as a customer to shop</small>
                  </div>
                </Tab>
                <Tab eventKey="seller" title="Seller">
                  <div className="text-center mb-3">
                    <small className="text-muted">Login as a seller to manage products</small>
                  </div>
                </Tab>
              </Tabs>

              {error && (
                <Alert variant="danger" className="mb-3">
                  <div>{error}</div>
                  {error.includes('Invalid email or password') && (
                    <div className="mt-2">
                      <small>
                        Don't have an account? <Link to="/register" className="text-white">Create one here</Link>
                      </small>
                    </div>
                  )}
                  {error.includes('Server not available') && (
                    <div className="mt-2">
                      <small>Please make sure the backend server is running on port 8080.</small>
                    </div>
                  )}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </Form>

              <div className="text-center">
                <p className="mb-0">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary text-decoration-none">
                    Sign up here
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>

          {/* Demo Credentials */}
          <Card className="mt-3">
            <Card.Body className="p-3">
              <h6 className="text-muted mb-2">Demo Credentials</h6>
              <small className="text-muted">
                <strong>Customer:</strong> customer@demo.com / password123<br />
                <strong>Seller:</strong> seller@demo.com / password123
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
