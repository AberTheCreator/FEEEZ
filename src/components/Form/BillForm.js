import React, { useState } from 'react';
import { Button, Input, Select } from '../UI/Button.js';

const BillForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    amount: initialData?.amount || '',
    dueDate: initialData?.dueDate || '',
    frequency: initialData?.frequency || 'monthly',
    category: initialData?.category || 'utilities',
    description: initialData?.description || '',
    recipient: initialData?.recipient || ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const categories = [
    { value: 'utilities', label: 'Utilities' },
    { value: 'rent', label: 'Rent/Mortgage' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'subscriptions', label: 'Subscriptions' },
    { value: 'loans', label: 'Loans' },
    { value: 'other', label: 'Other' }
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Bill name is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (!formData.recipient.trim()) newErrors.recipient = 'Recipient address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount)
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Bill Name"
        value={formData.name}
        onChange={e => handleChange('name', e.target.value)}
        placeholder="e.g., Electric Bill"
        error={errors.name}
      />
      <div className="form-row">
        <Input
          label="Amount (USDC)"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={e => handleChange('amount', e.target.value)}
          placeholder="0.00"
          error={errors.amount}
        />
        <Select
          label="Frequency"
          value={formData.frequency}
          onChange={e => handleChange('frequency', e.target.value)}
          options={frequencies}
          error={errors.frequency}
        />
      </div>
      <div className="form-row">
        <Input
          label="Next Due Date"
          type="date"
          value={formData.dueDate}
          onChange={e => handleChange('dueDate', e.target.value)}
          error={errors.dueDate}
        />
        <Select
          label="Category"
          value={formData.category}
          onChange={e => handleChange('category', e.target.value)}
          options={categories}
        />
      </div>
      <Input
        label="Recipient Address"
        value={formData.recipient}
        onChange={e => handleChange('recipient', e.target.value)}
        placeholder="0x..."
        error={errors.recipient}
      />
      <div className="form-group">
        <label>Description (Optional)</label>
        <textarea
          value={formData.description}
          onChange={e => handleChange('description', e.target.value)}
          placeholder="Add notes about this bill..."
          rows="3"
        />
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
          {initialData ? 'Update Bill' : 'Create Bill'}
        </Button>
      </div>
    </form>
  );
};

export default BillForm;