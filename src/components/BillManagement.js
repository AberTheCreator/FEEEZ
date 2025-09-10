import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';

const BILL_PAYMENT_ABI = [
  "function createBill(address payee, address token, uint256 amount, uint256 frequency, uint256 totalPayments, string memory description, bytes32 category) external returns (uint256)",
  "function executeBillPayment(uint256 billId) external",
  "function updateBillStatus(uint256 billId, uint8 status) external",
  "function getBill(uint256 billId) external view returns (tuple(uint256 billId, address payer, address payee, address token, uint256 amount, uint256 frequency, uint256 nextPayment, uint256 totalPayments, uint256 completedPayments, uint8 status, string description, bytes32 category))",
  "function getUserBills(address user) external view returns (uint256[])",
  "event BillCreated(uint256 indexed billId, address indexed payer, address indexed payee, uint256 amount)"
];

const MOCK_USDC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)", 
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)"
];

const BillManagement = () => {
  const { provider, signer, account, contractAddresses } = useWeb3();
  const [bills, setBills] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const [newBill, setNewBill] = useState({
    payee: '',
    amount: '',
    frequency: '2592000',
    totalPayments: '12',
    description: '',
    category: 'utilities'
  });

  const categories = {
    utilities: 'Utilities',
    rent: 'Rent/Mortgage',
    insurance: 'Insurance',
    subscriptions: 'Subscriptions',
    loans: 'Loans',
    other: 'Other'
  };

  const frequencies = {
    '604800': 'Weekly',
    '2592000': 'Monthly',
    '7776000': 'Quarterly',
    '31536000': 'Yearly'
  };

  useEffect(() => {
    if (provider && account) {
      loadBills();
    }
  }, [provider, account]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddresses.billPayment, BILL_PAYMENT_ABI, provider);
      const userBillIds = await contract.getUserBills(account);
      
      const billPromises = userBillIds.map(id => contract.getBill(id));
      const billResults = await Promise.all(billPromises);

      const formattedBills = billResults.map(bill => ({
        billId: bill.billId.toString(),
        payee: bill.payee,
        description: bill.description,
        amount: ethers.utils.formatUnits(bill.amount, 6),
        frequency: bill.frequency.toString(),
        nextPayment: new Date(parseInt(bill.nextPayment.toString()) * 1000),
        totalPayments: bill.totalPayments.toString(),
        completedPayments: bill.completedPayments.toString(),
        status: ['Active', 'Paused', 'Cancelled', 'Completed'][bill.status],
        category: ethers.utils.parseBytes32String(bill.category)
      }));

      setBills(formattedBills);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBill = async (e) => {
    e.preventDefault();
    if (!newBill.payee || !newBill.amount || !newBill.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const contract = new ethers.Contract(contractAddresses.billPayment, BILL_PAYMENT_ABI, signer);
      const usdcContract = new ethers.Contract(contractAddresses.mockUSDC, MOCK_USDC_ABI, signer);
      
      const amount = ethers.utils.parseUnits(newBill.amount, 6);
      const categoryBytes = ethers.utils.formatBytes32String(newBill.category);
      
      const currentAllowance = await usdcContract.allowance(account, contractAddresses.billPayment);
      const neededAllowance = amount.mul(newBill.totalPayments);
      
      if (currentAllowance.lt(neededAllowance)) {
        const approveTx = await usdcContract.approve(contractAddresses.billPayment, neededAllowance);
        await approveTx.wait();
      }
      
      const tx = await contract.createBill(
        newBill.payee,
        contractAddresses.MockUSDC,
        amount,
        parseInt(newBill.frequency),
        parseInt(newBill.totalPayments),
        newBill.description,
        categoryBytes
      );

      await tx.wait();
      
      setNewBill({
        payee: '',
        amount: '',
        frequency: '2592000',
        totalPayments: '12',
        description: '',
        category
