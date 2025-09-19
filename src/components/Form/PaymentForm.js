import React, { useState } from 'react';
import { Button, Input } from '../UI/Button.js';

const PaymentForm = ({ bill, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: bill?.amount || '',
    note: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        billId: bill.id,
        amount: parseFloat(paymentData.amount),
        note: paymentData.note
      });
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        background: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>{bill?.name}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
          <div>
            <span style={{ color: '#666' }}>Due Date:</span>
            <div style={{ fontWeight: '600' }}>{bill?.dueDate}</div>
          </div>
          <div>
            <span style={{ color: '#666' }}>Recipient:</span>
            <div style={{ fontWeight: '600' }}>{bill?.recipient?.slice(0, 10)}...</div>
          </div>
        </div>
      </div>
      <Input
        label="Payment Amount (USDC)"
        type="number"
        step="0.01"
        min="0"
        value={paymentData.amount}
        onChange={e => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
        placeholder="0.00"
        required
      />
      <div className="form-group">
        <label>Payment Note (Optional)</label>
        <textarea
          value={paymentData.note}
          onChange={e => setPaymentData(prev => ({ ...prev, note: e.target.value }))}
          placeholder="Add a note for this payment..."
          rows="2"
        />
      </div>
      <div style={{
        background: '#fef3cd',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '1rem',
        margin: '1rem 0'
      }}>
        <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
          ⚠️ This payment will be held in escrow until confirmed by the recipient.
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          style={{ flex: 1 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          style={{ flex: 1 }}
        >
          Pay {paymentData.amount} USDC
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;