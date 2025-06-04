'use client';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

export default function StaffDashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [error, setError] = useState(''); // General error for the page
  const [formError, setFormError] = useState(''); // Error specific to the submission form
  const [formSuccess, setFormSuccess] = useState(''); // Success message for form

  const [selectedServices, setSelectedServices] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [carDetails, setCarDetails] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const fetchServices = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingServices(true);
    setError('');
    try {
      const response = await apiClient.get('/services');
      setServices(response.data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err.response?.data?.message || 'Failed to fetch services.');
    } finally {
      setIsLoadingServices(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !['staff', 'owner'].includes(user?.role))) {
      router.push('/login');
    } else if (isAuthenticated && user?.role) {
      fetchServices();
    }
  }, [user, authLoading, isAuthenticated, router, fetchServices]);

  useEffect(() => {
    let total = 0;
    services.forEach(service => {
      if (selectedServices[service._id]) {
        total += service.price;
      }
    });
    setCalculatedTotal(total);
  }, [selectedServices, services]);

  const handleServiceSelectionChange = (serviceId) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
    setFormError(''); // Clear form error on interaction
    setFormSuccess('');
  };

  const resetForm = () => {
    setCustomerName('');
    setCarDetails('');
    setSelectedServices({});
    setCalculatedTotal(0); // This will be recalculated by useEffect anyway
    setFormError('');
  };

  const handleSubmitOrder = async () => {
    setFormError('');
    setFormSuccess('');

    if (Object.values(selectedServices).every(v => !v)) {
      setFormError('Please select at least one service.');
      return;
    }
    if (!customerName.trim()) {
      setFormError('Please enter customer name.');
      return;
    }
    // Car details can be optional based on requirements, for now let's make it required
    if (!carDetails.trim()) {
      setFormError('Please enter car details.');
      return;
    }

    const orderDetails = {
      customerName: customerName.trim(),
      carDetails: carDetails.trim(),
      serviceIds: Object.keys(selectedServices).filter(id => selectedServices[id]),
      totalAmount: calculatedTotal,
      // staffMember ID is added by the backend using req.user.id
    };

    setIsSubmittingOrder(true);
    try {
      const response = await apiClient.post('/billing', orderDetails);
      setFormSuccess(`Billing record created successfully! ID: ${response.data._id}`);
      resetForm(); // Clear form on success
      // Optionally, navigate or show a persistent success message
    } catch (err) {
      console.error('Error creating billing record:', err);
      setFormError(err.response?.data?.message || 'Failed to create billing record.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return <p>Loading or redirecting...</p>;
  }
   if (!authLoading && !['staff', 'owner'].includes(user?.role)) {
    return <p>Access Denied. Redirecting...</p>;
  }

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '30px' }}>
      <div style={{ flex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Staff Dashboard - New Order</h1>
          <button onClick={logout} style={{ padding: '10px' }}>Logout</button>
        </div>

        {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

        <h3>Customer & Car Information</h3>
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => { setCustomerName(e.target.value); setFormError(''); setFormSuccess(''); }}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <input
            type="text"
            placeholder="Car Details (e.g., Make, Model, License Plate)"
            value={carDetails}
            onChange={(e) => { setCarDetails(e.target.value); setFormError(''); setFormSuccess(''); }}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>

        <h3>Available Services</h3>
        {isLoadingServices ? <p>Loading services...</p> : (
          services.length === 0 && !error ? <p>No services available.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {services.map(service => (
                <li key={service._id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedServices[service._id]}
                      onChange={() => handleServiceSelectionChange(service._id)}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <div>
                      <strong>{service.name}</strong> (${service.price?.toFixed(2)}) - <em>{service.category?.replace(/_/g, ' ')}</em>
                      <p style={{ margin: '5px 0 0', fontSize: '0.9em' }}>{service.description}</p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '30px' }}>
        <h2>Order Summary</h2>
        {formError && <p style={{ color: 'red' }}>{formError}</p>}
        {formSuccess && <p style={{ color: 'green' }}>{formSuccess}</p>}
        {Object.values(selectedServices).every(v => !v) && !formSuccess ? ( // Hide if success message is shown
          <p>No services selected yet.</p>
        ) : !formSuccess && ( // Hide if success message is shown
          <>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {services.filter(s => selectedServices[s._id]).map(s => (
                <li key={s._id} style={{ marginBottom: '5px' }}>{s.name} - ${s.price.toFixed(2)}</li>
              ))}
            </ul>
            <hr />
            <p style={{ fontWeight: 'bold', fontSize: '1.2em' }}>
              Total: ${calculatedTotal.toFixed(2)}
            </p>
          </>
        )}
        <button
          onClick={handleSubmitOrder}
          disabled={isLoadingServices || isSubmittingOrder || (Object.values(selectedServices).every(v => !v) && !formSuccess) || (!customerName.trim() && !formSuccess) || (!carDetails.trim() && !formSuccess) }
          style={{
            padding: '12px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            width: '100%',
            marginTop: '20px'
          }}
        >
          {isSubmittingOrder ? 'Submitting...' : 'Submit Bill'}
        </button>
      </div>
    </div>
  );
}
