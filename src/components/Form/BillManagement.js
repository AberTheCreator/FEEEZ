import React, { useState } from 'react';
import BillForm from './BillForm.js';
import PaymentForm from './PaymentForm.js';


const BillManagement = () => {
  const [showBillForm, setShowBillForm] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);

  const handleBillFormSubmit = data => {
    
    setShowBillForm(false);
    setSelectedBill(data);
  };

  const handlePaymentFormSubmit = data => {
    
    setShowBillForm(true);
    setSelectedBill(null);
  };

  return (
    <div>
      {showBillForm ? (
        <BillForm
          onSubmit={handleBillFormSubmit}
          onCancel={() => setShowBillForm(false)}
        />
      ) : (
        <PaymentForm
          bill={selectedBill}
          onSubmit={handlePaymentFormSubmit}
          onCancel={() => setShowBillForm(true)}
        />
      )}
    </div>
  );
};

export default BillManagement;