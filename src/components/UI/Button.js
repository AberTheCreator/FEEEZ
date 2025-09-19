import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false, 
  onClick, 
  type = 'button',
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-weight-600 border-radius-8px transition-all duration-300 cursor-pointer border-none';
  
  const variantClasses = {
    primary: 'bg-gradient-primary text-white hover:transform hover:-translate-y-1 hover:shadow-lg',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-500 text-white hover:bg-green-600'
  };
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };
  
  const disabledClasses = disabled || loading ? 'opacity-60 cursor-not-allowed' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
      style={{
        background: variant === 'primary' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
        padding: size === 'small' ? '0.375rem 0.75rem' : size === 'large' ? '0.75rem 1.5rem' : '0.5rem 1rem',
        borderRadius: '8px',
        fontWeight: '600',
        border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.3s ease',
        fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem',
        ...(variant === 'secondary' && {
          background: '#f3f4f6',
          color: '#374151'
        }),
        ...(variant === 'outline' && {
          background: 'transparent',
          border: '2px solid #667eea',
          color: '#667eea'
        }),
        ...(variant === 'danger' && {
          background: '#ef4444',
          color: 'white'
        }),
        ...(variant === 'success' && {
          background: '#10b981',
          color: 'white'
        })
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading && variant === 'primary') {
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading && variant === 'primary') {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }
      }}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export const Input = ({ 
  label, 
  error, 
  type = 'text', 
  placeholder = '', 
  value, 
  onChange, 
  disabled = false,
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="input-field"
        {...props}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '1rem',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          backgroundColor: disabled ? '#f9fafb' : 'white',
          color: disabled ? '#6b7280' : '#111827'
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = '#667eea';
            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ef4444' : '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
      />
      {error && (
        <span className="input-error" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {error}
        </span>
      )}
      <style jsx>{`
        .input-group {
          margin-bottom: 1rem;
        }
        .input-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
          font-size: 0.875rem;
        }
        .input-field:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export const Select = ({ 
  label, 
  options = [], 
  error, 
  value, 
  onChange, 
  placeholder = 'Select an option', 
  disabled = false,
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`select-group ${className}`}>
      {label && (
        <label className="select-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="select-field"
        {...props}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '1rem',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          backgroundColor: disabled ? '#f9fafb' : 'white',
          color: disabled ? '#6b7280' : '#111827',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = '#667eea';
            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ef4444' : '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="select-error" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {error}
        </span>
      )}
      <style jsx>{`
        .select-group {
          margin-bottom: 1rem;
        }
        .select-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
          font-size: 0.875rem;
        }
        .select-field:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

const Button_default = Button;
export default Button_default;