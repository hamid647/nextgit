'use client';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import ChangeRequestForm from '../../components/billing/ChangeRequestForm'; // Import the new component

export default function StaffDashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // States for service selection part
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [pageError, setPageError] = useState(''); // General error for the page

  const [selectedServices, setSelectedServices] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [carDetails, setCarDetails] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderFormError, setOrderFormError] = useState('');
  const [orderFormSuccess, setOrderFormSuccess] = useState('');

  // States for billing records list & change request
  const [billingRecords, setBillingRecords] = useState([]);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [selectedRecordForChange, setSelectedRecordForChange] = useState(null); // Billing record object
  const [isChangeRequestModalOpen, setIsChangeRequestModalOpen] = useState(false);
  const [isSubmittingChangeRequest, setIsSubmittingChangeRequest] = useState(false);
  const [changeRequestError, setChangeRequestError] = useState('');
  const [changeRequestSuccess, setChangeRequestSuccess] = useState('');


  const fetchServices = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingServices(true);
    try {
      const response = await apiClient.get('/services');
      setServices(response.data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setPageError(err.response?.data?.message || 'Failed to fetch services.');
    } finally {
      setIsLoadingServices(false);
    }
  }, [isAuthenticated]);

  const fetchBillingRecords = useCallback(async () => {
    if (!isAuthenticated || !user) return; // Ensure user is available for role check
    setIsLoadingBilling(true);
    try {
      // API GET /api/billing filters by staff ID on backend if user.role is 'staff'
      const response = await apiClient.get('/billing');
      setBillingRecords(response.data || []);
    } catch (err) {
      console.error('Error fetching billing records:', err);
      setPageError(err.response?.data?.message || 'Failed to fetch billing records.');
    } finally {
      setIsLoadingBilling(false);
    }
  }, [isAuthenticated, user]);


  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !['staff', 'owner'].includes(user?.role))) {
      router.push('/login');
    } else if (isAuthenticated && user?.role) {
      fetchServices();
      fetchBillingRecords();
    }
  }, [user, authLoading, isAuthenticated, router, fetchServices, fetchBillingRecords]);

  useEffect(() => {
    let total = 0;
    services.forEach(service => selectedServices[service._id] && (total += service.price));
    setCalculatedTotal(total);
  }, [selectedServices, services]);

  const handleServiceSelectionChange = (serviceId) => {
    setSelectedServices(prev => ({ ...prev, [serviceId]: !prev[serviceId] }));
    setOrderFormError(''); setOrderFormSuccess('');
  };

  const resetOrderForm = () => {
    setCustomerName(''); setCarDetails(''); setSelectedServices({});
    setOrderFormError('');
  };

  const handleSubmitOrder = async () => {
    setOrderFormError(''); setOrderFormSuccess('');
    if (Object.values(selectedServices).every(v => !v)) { setOrderFormError('Select services.'); return; }
    if (!customerName.trim()) { setOrderFormError('Enter customer name.'); return; }
    if (!carDetails.trim()) { setOrderFormError('Enter car details.'); return; }

    setIsSubmittingOrder(true);
    try {
      await apiClient.post('/billing', {
        customerName: customerName.trim(), carDetails: carDetails.trim(),
        serviceIds: Object.keys(selectedServices).filter(id => selectedServices[id]),
        totalAmount: calculatedTotal
      });
      setOrderFormSuccess('Billing record created successfully!');
      resetOrderForm();
      fetchBillingRecords(); // Refresh billing records list
    } catch (err) {
      setOrderFormError(err.response?.data?.message || 'Failed to create billing record.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Change Request Functions
  const handleOpenChangeRequestModal = (record) => {
    setSelectedRecordForChange(record);
    setIsChangeRequestModalOpen(true);
    setChangeRequestError('');
    setChangeRequestSuccess('');
  };

  const handleCloseChangeRequestModal = () => {
    setIsChangeRequestModalOpen(false);
    setSelectedRecordForChange(null);
  };

  const handleSubmitChangeRequest = async (billingId, data) => {
    setIsSubmittingChangeRequest(true);
    setChangeRequestError('');
    setChangeRequestSuccess('');
    try {
      await apiClient.post(`/billing/${billingId}/request-change`, data);
      setChangeRequestSuccess('Change request submitted successfully!');
      handleCloseChangeRequestModal();
      fetchBillingRecords(); // Refresh list
    } catch (err) {
      setChangeRequestError(err.response?.data?.message || 'Failed to submit change request.');
      // Keep modal open if error by not calling handleCloseChangeRequestModal() immediately
    } finally {
      setIsSubmittingChangeRequest(false);
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading) ) {
    return <p>Loading or redirecting...</p>;
  }
  if (!authLoading && !['staff', 'owner'].includes(user?.role)) {
     return <p>Access Denied. Redirecting...</p>;
  }

  const renderChangeRequestStatus = (record) => {
    if (!record.requestChange || !record.requestChange.requested) {
      return <button onClick={() => handleOpenChangeRequestModal(record)} style={{fontSize: '0.8em', padding: '3px 6px'}}>Request Change</button>;
    }
    if (!record.requestChange.resolved) {
      return <span style={{color: 'orange', fontSize: '0.8em'}}>Pending Owner Approval (New: ${record.requestChange.newAmount?.toFixed(2)})</span>;
    }
    if (record.requestChange.approved) {
      return <span style={{color: 'green', fontSize: '0.8em'}}>Approved (Now: ${record.totalAmount?.toFixed(2)})</span>;
    }
    return <span style={{color: 'red', fontSize: '0.8em'}}>Rejected. Reason: {record.requestChange.ownerComment || 'N/A'}</span>;
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Staff Dashboard</h1>
        <button onClick={logout} style={{ padding: '10px' }}>Logout</button>
      </div>
      {pageError && <p style={{ color: 'red', marginBottom: '15px' }}>{pageError}</p>}

      {/* New Order Section */}
      <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', paddingBottom: '30px', borderBottom: '2px solid #eee' }}>
        <div style={{ flex: 2 }}>
          <h2>Create New Order</h2>
          {orderFormError && <p style={{ color: 'red' }}>{orderFormError}</p>}
          {orderFormSuccess && <p style={{ color: 'green' }}>{orderFormSuccess}</p>}
          <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => { setCustomerName(e.target.value); setOrderFormError(''); setOrderFormSuccess(''); }} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}/>
            <input type="text" placeholder="Car Details" value={carDetails} onChange={(e) => { setCarDetails(e.target.value); setOrderFormError(''); setOrderFormSuccess(''); }} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}/>
          </div>
          <h3>Available Services</h3>
          {isLoadingServices ? <p>Loading services...</p> : (
            services.length === 0 ? <p>No services available.</p> : (
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
              {services.map(service => (
                <li key={service._id} style={{ borderBottom: '1px solid #f0f0f0', padding: '10px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!selectedServices[service._id]} onChange={() => handleServiceSelectionChange(service._id)} style={{ width: '18px', height: '18px' }}/>
                    <div><strong>{service.name}</strong> (${service.price?.toFixed(2)}) <em style={{fontSize:'0.9em', color:'#555'}}>- {service.category?.replace(/_/g, ' ')}</em></div>
                  </label>
                </li>
              ))}
            </ul>)
          )}
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid #ddd', paddingLeft: '30px' }}>
          <h3>Order Summary</h3>
          {Object.values(selectedServices).every(v => !v) ? <p>No services selected.</p> : (
            <>
              <ul style={{ listStyle: 'none', padding: 0 }}>{services.filter(s => selectedServices[s._id]).map(s => (<li key={s._id}>{s.name} - ${s.price.toFixed(2)}</li>))}</ul>
              <hr/><p style={{ fontWeight: 'bold' }}>Total: ${calculatedTotal.toFixed(2)}</p>
            </>
          )}
          <button onClick={handleSubmitOrder} disabled={isLoadingServices || isSubmittingOrder || Object.values(selectedServices).every(v => !v) || !customerName.trim() || !carDetails.trim()} style={{ padding: '12px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', width: '100%', marginTop: '15px' }}>
            {isSubmittingOrder ? 'Submitting...' : 'Submit Bill'}
          </button>
        </div>
      </div>

      {/* My Billing Records Section */}
      <div>
        <h2>My Submitted Billing Records</h2>
        {changeRequestError && <p style={{ color: 'red' }}>{changeRequestError}</p>}
        {changeRequestSuccess && <p style={{ color: 'green' }}>{changeRequestSuccess}</p>}
        {isLoadingBilling ? <p>Loading records...</p> : (
          billingRecords.length === 0 ? <p>You have not submitted any billing records yet.</p> : (
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr>
                  <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Date</th>
                  <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Customer</th>
                  <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Car</th>
                  <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Services</th>
                  <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Amount</th>
                  <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Status</th>
                  <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Change Request</th>
                </tr>
              </thead>
              <tbody>
                {billingRecords.map(record => (
                  <tr key={record._id}>
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>{record.customerName}</td>
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>{record.carDetails}</td>
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>{record.services.map(s => s.name).join(', ')}</td>
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>${record.totalAmount.toFixed(2)}</td>
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>{record.paymentStatus}</td>
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>
                      {renderChangeRequestStatus(record)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {isChangeRequestModalOpen && selectedRecordForChange && (
        <ChangeRequestForm
          billingRecord={selectedRecordForChange}
          onSubmit={handleSubmitChangeRequest}
          onCancel={handleCloseChangeRequestModal}
          loading={isSubmittingChangeRequest}
        />
      )}
    </div>
  );
}
