'use client';
import { useState, useEffect } from 'react';

export default function BillingRecordEditForm({ record, onSave, onCancel, loading }) {
  const [customerName, setCustomerName] = useState('');
  const [carDetails, setCarDetails] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  // Total amount editing could be sensitive, owner can use change request flow or direct edit here carefully
  const [totalAmount, setTotalAmount] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (record) {
      setCustomerName(record.customerName || '');
      setCarDetails(record.carDetails || '');
      setPaymentStatus(record.paymentStatus || 'pending');
      setTotalAmount(record.totalAmount !== undefined ? String(record.totalAmount) : '');
    }
    setFormError('');
  }, [record]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!customerName.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    const parsedTotal = parseFloat(totalAmount);
    if (totalAmount.trim() !== '' && (isNaN(parsedTotal) || parsedTotal < 0)) {
        setFormError('If providing total amount, it must be a valid non-negative number.');
        return;
    }

    onSave(record._id, {
      customerName: customerName.trim(),
      carDetails: carDetails.trim(),
      paymentStatus,
      totalAmount: totalAmount.trim() === '' ? undefined : parsedTotal, // Send if changed
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '450px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <h3>Edit Billing Record (ID: {record?._id})</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div><label>Customer Name:</label><input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required style={{width:'100%', padding:'8px'}}/></div>
          <div><label>Car Details:</label><input type="text" value={carDetails} onChange={e => setCarDetails(e.target.value)} style={{width:'100%', padding:'8px'}}/></div>
          <div>
            <label>Payment Status:</label>
            <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} style={{width:'100%', padding:'8px'}}>
              <option value="pending">Pending</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div><label>Total Amount ($) (Careful Direct Edit):</label><input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} min="0" step="0.01" style={{width:'100%', padding:'8px'}}/></div>
          {formError && <p style={{ color: 'red' }}>{formError}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop:'10px' }}>
            <button type="button" onClick={onCancel} disabled={loading} style={{padding:'10px'}}>Cancel</button>
            <button type="submit" disabled={loading} style={{padding:'10px', backgroundColor:'#007bff', color:'white'}}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
