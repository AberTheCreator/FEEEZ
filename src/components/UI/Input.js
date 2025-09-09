import React from 'react';

const Input = ({ label, error, className = '', ...props }) => (
  <div className="form-group">
    {label && <label>{label}</label>}
    <input
      className={`${className} ${error ? 'border-red-500' : ''}`}
      {...props}
    />
    {error && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
  </div>
);

export default Input;