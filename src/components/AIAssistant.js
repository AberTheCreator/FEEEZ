import React, { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAI } from '../context/AIContext';
import './AIAssistant.css';

const AIAssistant = () => {
  const { account, usdcBalance } = useWeb3();
  const { 
    aiInsights, 
    budgetAnalysis, 
    predictions, 
    recommendations, 
    getBudgetTips 
  } = useAI();
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      addWelcomeMessage();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addWelcomeMessage = () => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: `Hello! I'm your FEEEZ AI assistant. I can help you with:

• Analyzing your spending patterns
• Setting up payment reminders
• Suggesting cost-saving opportunities
• Finding bill optimization strategies
• Creating budget forecasts

What would you like to know about your finances?`,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  };

  const generateAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('spending') || message.includes('budget')) {
      return generateSpendingAnalysis();
    } else if (message.includes('due') || message.includes('payment')) {
      return generatePaymentInfo();
    } else if (message.includes('save') || message.includes('optimize')) {
      return generateSavingsTips();
    } else if (message.includes('prediction') || message.includes('forecast')) {
      return generatePredictions();
    } else if (message.includes('help') || message.includes('what can you do')) {
      return generateHelpResponse();
    } else {
      return generateContextualResponse(message);
    }
  };

  const generateSpendingAnalysis = () => {
    if (!budgetAnalysis) {
      return "I need to analyze your bills first. Please visit your Dashboard to load your financial data, then come back for detailed insights!";
    }

    const topCategory = Object.entries(budgetAnalysis.categories)
      .sort(([,a], [,b]) => b - a)[0];

    return ` **Spending Analysis**

**Monthly Overview:**
• Total monthly spend: $${budgetAnalysis.totalMonthlySpend.toFixed(2)}
• Average payment: $${budgetAnalysis.averagePayment.toFixed(2)}
• Payment success rate: ${budgetAnalysis.paymentRate.toFixed(1)}%

**Top Category:** ${topCategory ? topCategory[0] : 'N/A'} (${topCategory ? '$' + topCategory[1].toFixed(2) : '0'})

**Recommendations:**
${getBudgetTips().map(tip => `• ${tip}`).join('\n')}`;
  };

  const generatePaymentInfo = () => {
    if (predictions.length === 0) {
      return "Great news! You don't have any payments due in the next 7 days. Keep up the excellent payment management!";
    }

    const urgentPayments = predictions.filter(p => p.priority === 'high');
    const upcomingPayments = predictions.filter(p => p.priority !== 'high');

    let response = "📅 **Payment Schedule**\n\n";

    if (urgentPayments.length > 0) {
      response += "🚨 **Urgent (Next 2 days):**\n";
      urgentPayments.forEach(payment => {
        response += `• ${payment.description}: $${payment.amount} (${payment.daysUntil} days)\n`;
      });
      response += "\n";
    }

    if (upcomingPayments.length > 0) {
      response += "📋 **Upcoming:**\n";
      upcomingPayments.forEach(payment => {
        response += `• ${payment.description}: $${payment.amount} (${payment.daysUntil} days)\n`;
      });
    }

    return response;
  };

  const generateSavingsTips = () => {
    const tips = [
      " Consider creating Bill Pools for shared expenses like utilities",
      " Set up automated payments to avoid late fees",
      " Negotiate with service providers for better rates",
      " Review your highest spending category for optimization opportunities",
      " Use FEEEZ's gasless payments to save on transaction fees"
    ];

    const personalizedTips = [];
    
    if (budgetAnalysis) {
      const highestCategory = Object.entries(budgetAnalysis.categories)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (highestCategory && highestCategory[1] > 200) {
        personalizedTips.push(` Your ${highestCategory[0]} bills are quite high ($${highestCategory[1].toFixed(2)}). Consider shopping around for better rates.`);
      }
      
      if (budgetAnalysis.paymentRate < 90) {
        personalizedTips.push(" Your payment rate could improve. Set up calendar reminders 2 days before due dates.");
      }
    }

    return ` **Money-Saving Tips**

**Personalized for You:**
${personalizedTips.map(tip => tip).join('\n')}

**General Recommendations:**
${tips.map(tip => tip).join('\n')}

**FEEEZ Features to Save Money:**
• Use Bill Pools to split large expenses
• Earn NFT rewards for consistent payments
• Leverage Somnia's low gas fees
• Get AI-powered spending insights`;
  };

  const generatePredictions = () => {
    if (!budgetAnalysis) {
      return "I need more data to make accurate predictions. Please use FEEEZ for a few more payments, then I can provide detailed forecasts!";
    }

    const monthlySpend = budgetAnalysis.totalMonthlySpend;
    const yearlyForecast = monthlySpend * 12;
    
    return ` **Financial Predictions**

**Short-term (Next 30 days):**
• Expected spending: $${monthlySpend.toFixed(2)}
• Bills due: ${predictions.length}
• Recommended buffer: $${(monthlySpend * 0.1).toFixed(2)}

**Long-term (12 months):**
• Projected yearly spend: $${yearlyForecast.toFixed(2)}
• Potential savings with optimization: $${(yearlyForecast * 0.15).toFixed(2)}

**Recommendations:**
• Maintain $${(monthlySpend * 1.2).toFixed(2)} balance for smooth operations
• Consider automating ${predictions.length} upcoming bills
• Set aside 10% of spending for unexpected expenses`;
  };

  const generateHelpResponse = () => {
    return `🤖 **FEEEZ AI Assistant Capabilities**

**Financial Analysis:**
• "Analyze my spending" - Get detailed spending breakdown
• "Show my budget" - View budget analysis and trends
• "Payment schedule" - See upcoming and overdue bills

**Optimization:**
• "How can I save money?" - Personalized saving tips
• "Optimize my bills" - Bill consolidation suggestions
• "Best payment strategy" - Payment timing recommendations

**Predictions:**
• "What's my forecast?" - Future spending predictions
• "When are payments due?" - Payment schedule overview
• "Budget planning" - Monthly and yearly projections

**Quick Commands:**
• "Help" - Show this menu
• "Tips" - Get random money-saving tip
• "Status" - Account and payment summary

Just ask me anything about your finances in natural language!`;
  };

  const generateContextualResponse = (message) => {
    const responses = [
      "I'd be happy to help with that! Could you be more specific about what financial information you're looking for?",
      "That's an interesting question! Try asking about your spending, upcoming payments, or savings opportunities.",
      "I can provide insights about your bills, payments, and budget optimization. What specific area interests you?",
      "Let me help you with your financial management. Ask me about spending analysis, payment schedules, or money-saving tips!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(inputMessage),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const quickActions = [
    { text: "Analyze my spending", icon: "📊" },
    { text: "Show upcoming payments", icon: "📅" },
    { text: "How can I save money?", icon: "💡" },
    { text: "What's my budget forecast?", icon: "🔮" }
  ];

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <div className="ai-title">
          <div className="ai-avatar">🤖</div>
          <div className="title-content">
            <h1>AI Financial Assistant</h1>
            <p>Your personal finance advisor powered by AI</p>
          </div>
        </div>
        
        <div className="ai-tabs">
          <button 
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </button>
          <button 
            className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            📊 Insights
          </button>
          <button 
            className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            💡 Tips
          </button>
        </div>
      </div>

      {activeTab === 'chat' && (
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-avatar">
                  {message.type === 'ai' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.content.split('\n').map((line, index) => (
                      <div key={index}>
                        {line.startsWith('**') && line.endsWith('**') ? (
                          <strong>{line.slice(2, -2)}</strong>
                        ) : line.startsWith('•') ? (
                          <div className="bullet-point">{line}</div>
                        ) : (
                          line
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message ai typing">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="quick-actions">
            <div className="quick-actions-label">Quick Actions:</div>
            <div className="quick-actions-buttons">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="quick-action-btn"
                  onClick={() => setInputMessage(action.text)}
                >
                  <span className="quick-action-icon">{action.icon}</span>
                  <span className="quick-action-text">{action.text}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <div className="chat-input-container">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about your finances..."
                className="chat-input"
                disabled={isTyping}
              />
              <button 
                type="submit" 
                className="send-button"
                disabled={!inputMessage.trim() || isTyping}
              >
                📤
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="insights-tab">
          <div className="insights-grid">
            {aiInsights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.type}`}>
                <div className="insight-header">
                  <span className="insight-icon">{insight.icon}</span>
                  <h3>{insight.title}</h3>
                </div>
                <p className="insight-message">{insight.message}</p>
              </div>
            ))}
            
            {aiInsights.length === 0 && (
              <div className="no-insights">
                <div className="no-insights-icon">📊</div>
                <h3>No insights yet</h3>
                <p>Make some payments to get AI-powered insights about your spending patterns!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="recommendations-tab">
          <div className="recommendations-grid">
            {recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-card ${rec.type}`}>
                <div className="recommendation-header">
                  <span className="recommendation-icon">{rec.icon}</span>
                  <h3>{rec.title}</h3>
                </div>
                <p className="recommendation-message">{rec.message}</p>
                {rec.action && (
                  <button className="recommendation-action">
                    {rec.action}
                  </button>
                )}
              </div>
            ))}
            
            {recommendations.length === 0 && (
              <div className="no-recommendations">