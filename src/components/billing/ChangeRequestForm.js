'use client';
import { useState } from 'react';

export default function ChangeRequestForm({ billingRecord, onSubmit, onCancel, loading }) {
  const [newAmount, setNewAmount] = useState(billingRecord?.requestChange?.newAmount || billingRecord?.totalAmount || '');
  const [reason, setReason] = useState(billingRecord?.requestChange?.reason || '');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (newAmount === '' || !reason.trim()) {
      setFormError('New amount and reason are required.');
      return;
    }
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setFormError('New amount must be a valid non-negative number.');
      return;
    }
    onSubmit(billingRecord._id, { newAmount: parsedAmount, reason: reason.trim() });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <h3>Request Billing Change</h3>
        <p><strong>Record ID:</strong> {billingRecord._id}</p>
        <p><strong>Current Total:</strong> ${billingRecord.totalAmount.toFixed(2)}</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label htmlFor="newAmount">New Amount ($) :</label>
            <input
              id="newAmount"
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              min="0"
              step="0.01"
              required
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label htmlFor="reason">Reason for Change:</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          {formError && <p style={{ color: 'red', margin: '0 0 10px 0' }}>{formError}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onCancel} disabled={loading} style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
