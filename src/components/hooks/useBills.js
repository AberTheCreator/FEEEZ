import { useState, useEffect } from 'react';
import useContract from './useContract';
import { useWeb3 } from '../context/Web3Context';

const useBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { contract } = useContract('BillPayment');
  const { account } = useWeb3();

  const fetchBills = async () => {
    if (!contract || !account) return;

    setLoading(true);
    setError(null);

    try {
      const billIds = await contract.getUserBills(account);
      const billsData = await Promise.all(
        billIds.map(async (billId) => {
          const bill = await contract.bills(billId);
          return {
            id: billId.toString(),
            name: bill.name,
            amount: parseFloat(bill.amount) / 1e6,
            recipient: bill.recipient,
            frequency: bill.frequency,
            nextDueDate: new Date(bill.nextDueDate.toNumber() * 1000),
            isActive: bill.isActive,
            paymentCount: bill.paymentCount.toNumber()
          };
        })
      );
      setBills(billsData);
    } catch (error) {
      console.error('Error fetching bills:', error);
      setError('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const createBill = async (billData) => {
    if (!contract) throw new Error('Contract not initialized');

    const amountInWei = Math.floor(billData.amount * 1e6);
    const dueDateTimestamp = Math.floor(new Date(billData.dueDate).getTime() / 1000);

    const tx = await contract.createBill(
      billData.name,
      amountInWei,
      billData.recipient,
      billData.frequency,
      dueDateTimestamp
    );

    await tx.wait();
    await fetchBills();
    return tx;
  };

  const payBill = async (billId, amount) => {
    if (!contract) throw new Error('Contract not initialized');

    const amountInWei = Math.floor(amount * 1e6);
    const tx = await contract.payBill(billId, amountInWei);
    await tx.wait();
    await fetchBills();
    return tx;
  };

  const toggleBillStatus = async (billId) => {
    if (!contract) throw new Error('Contract not initialized');

    const tx = await contract.toggleBillStatus(billId);
    await tx.wait();
    await fetchBills();
    return tx;
  };

  useEffect(() => {
    fetchBills();
  }, [contract, account]);

  return {
    bills,
    loading,
    error,
    createBill,
    payBill,
    toggleBillStatus,
    refetch: fetchBills
  };
};

export default useBills;