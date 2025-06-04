'use client';
import { useState } from 'react';

export default function ResolveChangeRequestModal({ billingRecord, onResolve, onCancel, loading }) {
  const [ownerComment, setOwnerComment] = useState(billingRecord?.requestChange?.ownerComment || '');
  const [formError, setFormError] = useState('');

  if (!billingRecord || !billingRecord.requestChange || !billingRecord.requestChange.requested) {
    return null; // Should not happen if modal is opened correctly
  }

  const requestDetails = billingRecord.requestChange;

  const handleResolve = (approved) => {
    setFormError('');
    // Basic validation for comment if rejecting, could be made more strict
    if (!approved && !ownerComment.trim()) {
      //setFormError('A comment is recommended when rejecting a change request.');
      //return; // Or allow rejection without comment
    }
    onResolve(billingRecord._id, { approved, ownerComment: ownerComment.trim() });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <h3>Resolve Billing Change Request</h3>
        <p><strong>Record ID:</strong> {billingRecord._id}</p>
        <p><strong>Customer:</strong> {billingRecord.customerName}</p>
        <p><strong>Original Amount:</strong> ${billingRecord.totalAmount?.toFixed(2)} (at time of request)</p>
        <hr style={{margin: '10px 0'}}/>
        <p><strong>Requested By:</strong> {requestDetails.requestedBy?.username || 'N/A'}</p>
        <p><strong>Requested New Amount:</strong> ${requestDetails.newAmount?.toFixed(2)}</p>
        <p><strong>Reason for Request:</strong> {requestDetails.reason}</p>
        <hr style={{margin: '10px 0'}}/>
        <div>
          <label htmlFor="ownerComment">Owner Comment (optional for approval, recommended for rejection):</label>
          <textarea
            id="ownerComment"
            value={ownerComment}
            onChange={(e) => setOwnerComment(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px' }}
          />
        </div>
        {formError && <p style={{ color: 'red', margin: '10px 0 0 0' }}>{formError}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '20px' }}>
          <button onClick={() => handleResolve(false)} disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', flex: 1 }}>
            {loading ? 'Processing...' : 'Reject Request'}
          </button>
          <button onClick={() => handleResolve(true)} disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', flex: 1 }}>
            {loading ? 'Processing...' : 'Approve Request'}
          </button>
        </div>
        <button onClick={onCancel} disabled={loading} style={{ width: '100%', padding: '10px 20px', marginTop: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
            Cancel
        </button>
      </div>
    </div>
  );
}
