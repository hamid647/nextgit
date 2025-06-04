'use client';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import ServiceForm from '../../components/owner/ServiceForm'; // Existing
import ResolveChangeRequestModal from '../../components/owner/billing/ResolveChangeRequestModal'; // New
import BillingRecordEditForm from '../../components/owner/billing/BillingRecordEditForm'; // New

export default function OwnerDashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // States for Service Management (existing)
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [isServiceFormVisible, setIsServiceFormVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormSubmitLoading, setServiceFormSubmitLoading] = useState(false);

  // States for Billing Management (new)
  const [billingRecords, setBillingRecords] = useState([]);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [selectedRecordForChangeResolve, setSelectedRecordForChangeResolve] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState(null);
  const [isEditBillingModalOpen, setIsEditBillingModalOpen] = useState(false);
  const [editBillingLoading, setEditBillingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('services'); // 'services' or 'billing'


  // Fetch Services (existing)
  const fetchServices = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'owner') return;
    setIsLoadingServices(true); setServiceError('');
    try {
      const response = await apiClient.get('/services');
      setServices(response.data || []);
    } catch (err) { setServiceError(err.response?.data?.message || 'Failed to fetch services.'); }
    finally { setIsLoadingServices(false); }
  }, [isAuthenticated, user?.role]);

  // Fetch Billing Records (new)
  const fetchBillingRecords = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'owner') return;
    setIsLoadingBilling(true); setBillingError('');
    try {
      const response = await apiClient.get('/billing'); // Owner gets all
      setBillingRecords(response.data || []);
    } catch (err) { setBillingError(err.response?.data?.message || 'Failed to fetch billing records.'); }
    finally { setIsLoadingBilling(false); }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'owner')) {
      router.push('/login');
    } else if (isAuthenticated && user?.role === 'owner') {
      if (activeTab === 'services') fetchServices();
      if (activeTab === 'billing') fetchBillingRecords();
    }
  }, [user, authLoading, isAuthenticated, router, fetchServices, fetchBillingRecords, activeTab]);

  // Service Management Handlers (existing - summarized)
  const handleCreateNewService = () => { setEditingService(null); setIsServiceFormVisible(true); };
  const handleEditService = (service) => { setEditingService(service); setIsServiceFormVisible(true); };
  const handleServiceFormSave = async (serviceData) => {
    setServiceFormSubmitLoading(true); setServiceError('');
    try {
      if (editingService) await apiClient.put(`/services/${editingService._id}`, serviceData);
      else await apiClient.post('/services', serviceData);
      setIsServiceFormVisible(false); setEditingService(null); fetchServices();
    } catch (err) { setServiceError(err.response?.data?.message || 'Failed to save service.');}
    finally { setServiceFormSubmitLoading(false); }
  };
  const handleServiceFormCancel = () => { setIsServiceFormVisible(false); setEditingService(null); setServiceError(''); };
  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Delete this service?')) {
      setServiceError('');
      try { await apiClient.delete(`/services/${serviceId}`); fetchServices(); }
      catch (err) { setServiceError(err.response?.data?.message || 'Failed to delete service.'); }
    }
  };

  // Billing Management Handlers (new)
  const handleOpenResolveModal = (record) => { setSelectedRecordForChangeResolve(record); setIsResolveModalOpen(true); setBillingError(''); };
  const handleCloseResolveModal = () => { setIsResolveModalOpen(false); setSelectedRecordForChangeResolve(null);};
  const handleResolveChangeRequest = async (billingId, data) => {
    setResolveLoading(true); setBillingError('');
    try {
      await apiClient.put(`/billing/${billingId}/resolve-change`, data);
      handleCloseResolveModal(); fetchBillingRecords();
    } catch (err) { setBillingError(err.response?.data?.message || 'Failed to resolve change request.');}
    finally { setResolveLoading(false); }
  };

  const handleOpenEditBillingModal = (record) => { setSelectedRecordForEdit(record); setIsEditBillingModalOpen(true); setBillingError('');};
  const handleCloseEditBillingModal = () => { setIsEditBillingModalOpen(false); setSelectedRecordForEdit(null);};
  const handleSaveBillingEdit = async (billingId, data) => {
    setEditBillingLoading(true); setBillingError('');
    try {
      await apiClient.put(`/billing/${billingId}`, data);
      handleCloseEditBillingModal(); fetchBillingRecords();
    } catch (err) { setBillingError(err.response?.data?.message || 'Failed to update billing record.'); }
    finally { setEditBillingLoading(false); }
  };
  const handleDeleteBillingRecord = async (billingId) => {
    if (window.confirm('Delete this billing record permanently?')) {
      setBillingError('');
      try { await apiClient.delete(`/billing/${billingId}`); fetchBillingRecords(); }
      catch (err) { setBillingError(err.response?.data?.message || 'Failed to delete billing record.');}
    }
  };

  const renderBillingChangeStatus = (record) => {
    if (record.requestChange?.requested && !record.requestChange?.resolved) {
      return (
        <>
          <p style={{color: 'orange', fontWeight:'bold'}}>PENDING CHANGE:</p>
          <p>New Amount: ${record.requestChange.newAmount?.toFixed(2)}</p>
          <p>Reason: {record.requestChange.reason}</p>
          <p>By: {record.requestChange.requestedBy?.username || 'N/A'}</p>
          <button onClick={() => handleOpenResolveModal(record)} style={{padding:'5px', fontSize:'0.9em', backgroundColor:'blue', color:'white'}}>Review Request</button>
        </>
      );
    } else if (record.requestChange?.resolved) {
      return (
        <p style={{color: record.requestChange.approved ? 'green' : 'red', fontSize:'0.9em'}}>
          Request {record.requestChange.approved ? 'Approved' : 'Rejected'}.
          {record.requestChange.ownerComment && <>(Comment: {record.requestChange.ownerComment})</>}
        </p>
      );
    }
    return <span style={{fontSize:'0.9em', color:'#777'}}>No active change request</span>;
  };

  if (authLoading || (!isAuthenticated && !authLoading) ) return <p>Loading or redirecting...</p>;
  if (user?.role !== 'owner') return <p>Access Denied. Redirecting...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Owner Dashboard</h1>
        <button onClick={logout} style={{ padding: '10px' }}>Logout</button>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
        <button onClick={() => setActiveTab('services')} style={{padding:'10px', border: activeTab === 'services' ? '2px solid blue' : '1px solid #ccc', marginRight:'5px'}}>Service Management</button>
        <button onClick={() => setActiveTab('billing')} style={{padding:'10px', border: activeTab === 'billing' ? '2px solid blue' : '1px solid #ccc'}}>Billing Management</button>
      </div>

      {/* Service Management Section */}
      {activeTab === 'services' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
            <h2>Service Management</h2>
            <button onClick={handleCreateNewService} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white' }} disabled={isServiceFormVisible}>+ Add Service</button>
          </div>
          {serviceError && <p style={{ color: 'red' }}>{serviceError}</p>}
          {isServiceFormVisible && <ServiceForm service={editingService} onSave={handleServiceFormSave} onCancel={handleServiceFormCancel} loading={serviceFormSubmitLoading} />}
          {isLoadingServices ? <p>Loading services...</p> : services.length === 0 ? <p>No services found.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {services.map(s => (
                <li key={s._id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', display:'flex', justifyContent:'space-between' }}>
                  <div><strong>{s.name}</strong> (${s.price?.toFixed(2)}) - <em>{s.category}</em><p>{s.description}</p></div>
                  <div><button onClick={() => handleEditService(s)} disabled={isServiceFormVisible} style={{marginRight:'5px'}}>Edit</button><button onClick={() => handleDeleteService(s._id)} disabled={isServiceFormVisible} style={{backgroundColor:'red', color:'white'}}>Delete</button></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Billing Management Section */}
      {activeTab === 'billing' && (
        <div>
          <h2>Billing Record Management</h2>
          {billingError && <p style={{ color: 'red' }}>{billingError}</p>}
          {isLoadingBilling ? <p>Loading billing records...</p> : billingRecords.length === 0 ? <p>No billing records found.</p> : (
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9em'}}>
              <thead>
                <tr><th>Date</th><th>Customer</th><th>Car</th><th>Staff</th><th>Services</th><th>Amount</th><th>Pay Status</th><th>Change Req. Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {billingRecords.map(b => (
                  <tr key={b._id} style={{borderBottom:'1px solid #eee', backgroundColor: (b.requestChange?.requested && !b.requestChange?.resolved) ? '#fff8e1' : 'transparent'}}>
                    <td style={{padding:'5px'}}>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td style={{padding:'5px'}}>{b.customerName}</td>
                    <td style={{padding:'5px'}}>{b.carDetails}</td>
                    <td style={{padding:'5px'}}>{b.staffMember?.username || 'N/A'}</td>
                    <td style={{padding:'5px'}}>{b.services.map(s => s.name).join(', ')}</td>
                    <td style={{padding:'5px'}}>${b.totalAmount.toFixed(2)}</td>
                    <td style={{padding:'5px'}}>{b.paymentStatus}</td>
                    <td style={{padding:'5px'}}>{renderBillingChangeStatus(b)}</td>
                    <td style={{padding:'5px'}}>
                      <button onClick={() => handleOpenEditBillingModal(b)} style={{fontSize:'0.8em', marginRight:'5px'}}>Edit</button>
                      <button onClick={() => handleDeleteBillingRecord(b._id)} style={{fontSize:'0.8em', backgroundColor:'red', color:'white'}}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      {isResolveModalOpen && selectedRecordForChangeResolve && (
        <ResolveChangeRequestModal billingRecord={selectedRecordForChangeResolve} onResolve={handleResolveChangeRequest} onCancel={handleCloseResolveModal} loading={resolveLoading} />
      )}
      {isEditBillingModalOpen && selectedRecordForEdit && (
        <BillingRecordEditForm record={selectedRecordForEdit} onSave={handleSaveBillingEdit} onCancel={handleCloseEditBillingModal} loading={editBillingLoading} />
      )}
    </div>
  );
}
