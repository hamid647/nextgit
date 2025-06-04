'use client';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient'; // Adjusted path
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import ServiceForm from '../../components/owner/ServiceForm'; // Adjusted path

export default function OwnerDashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [error, setError] = useState('');

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingService, setEditingService] = useState(null); // null for new, service object for edit
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);

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
    if (!authLoading && (!isAuthenticated || user?.role !== 'owner')) {
      router.push('/login');
    } else if (isAuthenticated && user?.role === 'owner') {
      fetchServices();
    }
  }, [user, authLoading, isAuthenticated, router, fetchServices]);

  const handleCreateNew = () => {
    setEditingService(null);
    setIsFormVisible(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setIsFormVisible(true);
  };

  const handleFormSave = async (serviceData) => {
    setFormSubmitLoading(true);
    setError('');
    try {
      if (editingService) { // Update existing service
        await apiClient.put(`/services/${editingService._id}`, serviceData);
      } else { // Create new service
        await apiClient.post('/services', serviceData);
      }
      setIsFormVisible(false);
      setEditingService(null);
      fetchServices(); // Refresh the list
    } catch (err) {
      console.error('Error saving service:', err);
      setError(err.response?.data?.message || 'Failed to save service.');
      // Keep form open if there's an error
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setEditingService(null);
    setError(''); // Clear form-specific errors
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      setError('');
      try {
        await apiClient.delete(`/services/${serviceId}`);
        fetchServices(); // Refresh the list
      } catch (err) {
        console.error('Error deleting service:', err);
        setError(err.response?.data?.message || 'Failed to delete service.');
      }
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading) ) { // Added !authLoading for the case when user is not authenticated
    return <p>Loading or redirecting...</p>;
  }
  if (user?.role !== 'owner') {
     return <p>Access Denied. Redirecting...</p>; // Should be handled by useEffect redirect
  }


  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Owner Dashboard - Service Management</h1>
        <div>
          <button onClick={logout} style={{ padding: '10px', marginRight: '10px' }}>Logout</button>
          <button onClick={handleCreateNew} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none' }} disabled={isFormVisible}>
            + Add New Service
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {isFormVisible && (
        <ServiceForm
          service={editingService}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
          loading={formSubmitLoading}
        />
      )}

      <h2>Available Services</h2>
      {isLoadingServices ? <p>Loading services...</p> : (
        services.length === 0 && !error ? <p>No services found. Add one!</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {services.map(service => (
              <li key={service._id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{service.name}</strong> (${service.price?.toFixed(2)}) - <em>{service.category?.replace(/_/g, ' ')}</em>
                  <p>{service.description}</p>
                </div>
                <div>
                  <button onClick={() => handleEdit(service)} style={{ marginRight: '10px', padding: '8px 12px' }} disabled={isFormVisible}>Edit</button>
                  <button onClick={() => handleDelete(service._id)} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none' }} disabled={isFormVisible}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
