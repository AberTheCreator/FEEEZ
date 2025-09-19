import React, { createContext, useContext, useState, useEffect } from 'react';
import aiService from '../services/aiService.js';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const [aiInsights, setAiInsights] = useState([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeSpending = async (bills, payments) => {
    if (!bills || bills.length === 0) return;

    setIsAnalyzing(true);
    try {
      
      const totalMonthlySpend = bills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);
      const averagePayment = totalMonthlySpend / bills.length;
      const paymentRate = payments.length > 0 ? (payments.filter(p => p.status === 'Confirmed').length / payments.length) * 100 : 100;

      const categories = bills.reduce((acc, bill) => {
        const category = bill.category || 'other';
        acc[category] = (acc[category] || 0) + parseFloat(bill.amount || 0);
        return acc;
      }, {});

      setBudgetAnalysis({
        totalMonthlySpend,
        averagePayment,
        paymentRate,
        categories
      });

      const insights = generateInsights(totalMonthlySpend, categories, paymentRate);
      setAiInsights(insights);

      const billPredictions = generatePredictions(bills);
      setPredictions(billPredictions);

      const recs = generateRecommendations(totalMonthlySpend, categories);
      setRecommendations(recs);

      try {
        const aiAnalysis = await aiService.analyzeBillPatterns(bills, payments);
        if (aiAnalysis.success) {
          console.log('AI Analysis:', aiAnalysis.analysis);
        }
      } catch (error) {
        console.log('AI analysis not available:', error);
      }

    } catch (error) {
      console.error('Error analyzing spending:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateInsights = (totalSpend, categories, paymentRate) => {
    const insights = [];

    if (totalSpend > 1000) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'High Monthly Spending',
        message: `Your monthly bills total $${totalSpend.toFixed(2)}. Consider reviewing for potential savings.`
      });
    }

    if (paymentRate < 90) {
      insights.push({
        type: 'warning',
        icon: '📅',
        title: 'Payment Consistency',
        message: `Your payment rate is ${paymentRate.toFixed(1)}%. Set up reminders to improve consistency.`
      });
    }

    const subscriptionSpending = categories.subscriptions || 0;
    if (subscriptionSpending > 200) {
      insights.push({
        type: 'info',
        icon: '💡',
        title: 'Subscription Review',
        message: `You spend $${subscriptionSpending.toFixed(2)} on subscriptions. Consider auditing unused services.`
      });
    }

    if (totalSpend < 500) {
      insights.push({
        type: 'success',
        icon: '✅',
        title: 'Great Job!',
        message: 'Your monthly bill spending is well managed and reasonable.'
      });
    }

    return insights;
  };

  const generatePredictions = (bills) => {
    return bills
      .filter(bill => bill.status === 'Active')
      .map(bill => {
        const nextPayment = new Date(bill.nextPayment);
        const now = new Date();
        const daysUntil = Math.ceil((nextPayment - now) / (1000 * 60 * 60 * 24));

        return {
          billId: bill.billId,
          description: bill.description,
          amount: bill.amount,
          daysUntil: Math.max(0, daysUntil),
          priority: daysUntil <= 2 ? 'high' : daysUntil <= 7 ? 'medium' : 'low'
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
  };

  const generateRecommendations = (totalSpend, categories) => {
    const recommendations = [];

    if (totalSpend > 800) {
      recommendations.push({
        type: 'savings',
        icon: '💰',
        title: 'Cost Reduction Opportunity',
        message: 'Consider negotiating with service providers or switching to cheaper alternatives.',
        action: 'Review Bills'
      });
    }

    if (Object.keys(categories).length > 1) {
      recommendations.push({
        type: 'organization',
        icon: '📊',
        title: 'Bill Consolidation',
        message: 'Group similar bills together for better tracking and potential discounts.',
        action: 'Create Pool'
      });
    }

    recommendations.push({
      type: 'feature',
      icon: '🤝',
      title: 'Try Bill Pools',
      message: 'Split shared expenses with roommates or family using Bill Pools.',
      action: 'Learn More'
    });

    return recommendations;
  };

  const getBudgetTips = () => {
    return [
      'Set up automated payments to avoid late fees',
      'Review and cancel unused subscriptions monthly',
      'Consider annual payment plans for potential discounts',
      'Use Bill Pools for shared household expenses',
      'Track your payment streak to earn NFT rewards'
    ];
  };

  const value = {
    aiInsights,
    budgetAnalysis,
    predictions,
    recommendations,
    isAnalyzing,
    analyzeSpending,
    getBudgetTips
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};