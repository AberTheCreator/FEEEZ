import React from 'react';

const Card = ({ children, className = '', ...props }) => (
  <div
    className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;