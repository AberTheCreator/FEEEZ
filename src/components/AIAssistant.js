import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context.js';
import { useAI } from '../context/AIContext.js';
import aiService from '../services/aiService.js';
import './AIAssistant.css';

const AIAssistant = () => {
  const { account } = useWeb3();
  const { aiInsights, recommendations, budgetAnalysis, isAnalyzing } = useAI();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your FEEEZ AI assistant. I can help you analyze your spending, provide bill recommendations, and answer questions about your finances. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    { id: 1, text: 'Analyze my spending', icon: '📊', action: 'analyze spending' },
    { id: 2, text: 'Bill saving tips', icon: '💰', action: 'how can I save money on bills' },
    { id: 3, text: 'Payment reminders', icon: '⏰', action: 'help me set up payment reminders' },
    { id: 4, text: 'Budget optimization', icon: '🎯', action: 'help optimize my budget' }
  ];

  const handleSendMessage = async (message = null) => {
    const messageText = message || inputMessage.trim();
    if (!messageText) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const context = {
        bills: [],
        payments: [],
        userStats: budgetAnalysis || {}
      };

      const response = await aiService.generateResponse(messageText, context);

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action) => {
    handleSendMessage(action);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderChatTab = () => (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message assistant">
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
      </div>

      <div className="quick-actions">
        <div className="quick-actions-label">Quick Actions:</div>
        <div className="quick-actions-buttons">
          {quickActions.map(action => (
            <button
              key={action.id}
              className="quick-action-btn"
              onClick={() => handleQuickAction(action.action)}
            >
              <span>{action.icon}</span>
              <span>{action.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="chat-input-form">
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask me anything about your bills and finances..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="send-button"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
          >
            📤
          </button>
        </div>
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="insights-tab">
      <div className="insights-grid">
        {aiInsights.length === 0 ? (
          <div className="no-insights">
            <div className="no-insights-icon">🤖</div>
            <h4>No insights yet</h4>
            <p>Start make payments to get personalized AI insights about your spending!</p>
          </div>
        ) : (
          aiInsights.map((insight, index) => (
            <div key={index} className={`insight-card ${insight.type}`}>
              <div className="insight-header">
                <span className="insight-icon">{insight.icon}</span>
                <h4>{insight.title}</h4>
              </div>
              <p>{insight.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderRecommendationsTab = () => (
    <div className="recommendations-tab">
      <div className="recommendations-grid">
        {recommendations.length === 0 ? (
          <div className="no-recommendations">
            <div className="no-insights-icon">💡</div>
            <h4>No recommendations yet</h4>
            <p>Continue using FEEEZ to receive personalized recommendations!</p>
          </div>
        ) : (
          recommendations.map((rec, index) => (
            <div key={index} className="recommendation-card">
              <div className="recommendation-header">
                <span className="recommendation-icon">{rec.icon}</span>
                <h4>{rec.title}</h4>
              </div>
              <p>{rec.message}</p>
              <button className="recommendation-action">
                {rec.action}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <div className="ai-title">
          <div className="ai-avatar">🤖</div>
          <div className="title-content">
            <h1>AI Assistant</h1>
            <p>Your personal financial advisor</p>
          </div>
        </div>

        <div className="ai-tabs">
          <button 
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            Insights ({aiInsights.length})
          </button>
          <button 
            className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            Tips ({recommendations.length})
          </button>
        </div>
      </div>

      <div className="ai-content">
        {activeTab === 'chat' && renderChatTab()}
        {activeTab === 'insights' && renderInsightsTab()}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
      </div>
    </div>
  );
};

export default AIAssistant;
