import React, { createContext, useContext, useState, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { useBills, useNFTRewards } from '../hooks';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const { bills } = useBills();
  const { stats, nfts } = useNFTRewards();

  const addMessage = async (message, isUser = true) => {
    const newMessage = {
      id: Date.now(),
      text: message,
      isUser,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, newMessage]);

    if (isUser) {
      setIsTyping(true);
      try {
        const context = {
          totalMonthlyBills: bills.reduce((sum, bill) => sum + bill.amount, 0),
          nextBill: predictions[0],
          nftCount: nfts.length,
          streak: stats.currentStreak
        };

        const response = await aiService.getChatResponse(message, context);
        
        setTimeout(() => {
          const aiMessage = {
            id: Date.now() + 1,
            text: response,
            isUser: false,
            timestamp: new Date()
          };
          setChatHistory(prev => [...prev, aiMessage]);
          setIsTyping(false);
        }, 1000);
      } catch (error) {
        console.error('AI response error:', error);
        setIsTyping(false);
      }
    }
  };

  const analyzeUserData = () => {
    if (bills.length > 0) {
      const analysis = aiService.analyzeSpending(bills, []);
      setInsights(analysis.insights);
      
      const billPredictions = aiService.predictBills(bills);
      setPredictions(billPredictions);
      
      const suggestions = aiService.generateBudgetSuggestions(3000, analysis.totalMonthlyBills);
      setRecommendations(suggestions);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  const getQuickSuggestions = () => {
    const suggestions = [
      "How much do I spend monthly?",
      "When is my next bill due?",
      "Show me ways to save money",
      "What NFT rewards do I have?",
      "How do bill pools work?"
    ];
    return suggestions;
  };

  const getInsightsSummary = () => {
    return {
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0),
      upcomingBills: predictions.filter(p => p.daysTillDue <= 7).length,
      savingsOpportunity: bills.reduce((sum, bill) => sum + bill.amount, 0) * 0.1
    };
  };

  useEffect(() => {
    analyzeUserData();
  }, [bills, stats]);

  useEffect(() => {
    if (chatHistory.length === 0) {
      addMessage("Welcome to FEEEZ! I'm your AI assistant. I can help you manage bills, analyze spending, and find savings opportunities. What would you like to know?", false);
    }
  }, []);

  const value = {
    chatHistory,
    isTyping,
    insights,
    predictions,
    recommendations,
    addMessage,
    clearChat,
    analyzeUserData,
    getQuickSuggestions,
    getInsightsSummary
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};