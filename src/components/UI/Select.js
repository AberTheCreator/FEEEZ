import React from 'react';

const Select = ({ label, options, error, className = '', ...props }) => (
  <div className="form-group">
    {label && <label>{label}</label>}
    <select
      className={`${className} ${error ? 'border-red-500' : ''}`}
      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
  </div>
);

export default Select;