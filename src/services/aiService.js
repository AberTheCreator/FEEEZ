
import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.REACT_APP_GEMINI_MODEL || 'gemini-pro' 
    });
    this.conversationHistory = [];
  }

  async generateResponse(userMessage, context = {}) {
    try {
      const { bills = [], payments = [], userStats = {} } = context;
      
     
      const contextPrompt = this.buildContextPrompt(bills, payments, userStats);
      const fullPrompt = `${contextPrompt}\n\nUser Question: ${userMessage}`;

      
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      
      this.conversationHistory.push({
        user: userMessage,
        assistant: text,
        timestamp: new Date()
      });

      return {
        success: true,
        response: text,
        context: context
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      
      return {
        success: false,
        response: this.getFallbackResponse(userMessage),
        error: error.message
      };
    }
  }

  buildContextPrompt(bills, payments, userStats) {
    const totalBills = bills.length;
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgBillAmount = totalBills > 0 ? (totalPaid / totalBills).toFixed(2) : 0;

    return `You are FEEEZ AI, a helpful financial assistant for a decentralized bill payment app. 
    
Context about the user:
- Total Bills: ${totalBills}
- Total Paid: $${totalPaid}
- Average Bill: $${avgBillAmount}
- Recent Bills: ${bills.slice(0, 3).map(b => `${b.description} - $${b.amount}`).join(', ')}

Guidelines:
- Be conversational and helpful
- Focus on bill payment insights and financial wellness
- Suggest ways to save money or improve payment habits
- Keep responses concise but informative
- Use crypto/DeFi terminology when relevant
- Be encouraging about their financial progress

Recent conversation history:
${this.conversationHistory.slice(-3).map(h => `User: ${h.user}\nAI: ${h.assistant}`).join('\n\n')}`;
  }

  async analyzeBillPatterns(bills, payments) {
    try {
      const analysisPrompt = `Analyze these bill payment patterns and provide insights:

Bills: ${JSON.stringify(bills.map(b => ({ description: b.description, amount: b.amount, dueDate: b.dueDate })))}
Payments: ${JSON.stringify(payments.map(p => ({ amount: p.amount, date: p.date, status: p.status })))}

Please provide:
1. Spending patterns and trends
2. Recommendations for saving money  
3. Payment timing optimization
4. Any red flags or concerns

Keep the response practical and actionable.`;

      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      
      return {
        success: true,
        analysis: response.text()
      };

    } catch (error) {
      console.error('Analysis Error:', error);
      return {
        success: false,
        analysis: 'Unable to analyze patterns at the moment. Please try again later.'
      };
    }
  }

  async generateBillSuggestions(spending, category) {
    try {
      const prompt = `Based on ${spending} monthly spending in ${category}, suggest:
1. Ways to reduce costs
2. Better service providers
3. Optimization strategies
4. DeFi opportunities for this expense category

Keep suggestions practical and specific.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      return {
        success: true,
        suggestions: response.text()
      };

    } catch (error) {
      console.error('Suggestions Error:', error);
      return {
        success: false,
        suggestions: 'Unable to generate suggestions right now.'
      };
    }
  }

  getFallbackResponse(message) {
    const fallbacks = [
      "I'm having trouble connecting to my AI service right now. Can you try asking again in a moment?",
      "My AI assistant is temporarily unavailable. In the meantime, check your dashboard for bill insights!",
      "I'm experiencing some connectivity issues. Your bill data is safe and I'll be back shortly!",
      "Sorry, I can't process that request right now. Try refreshing the page or asking a simpler question."
    ];

    
    if (message.toLowerCase().includes('spend')) {
      return "I can help analyze your spending patterns once I'm back online. Check your dashboard for current totals!";
    }
    if (message.toLowerCase().includes('bill')) {
      return "I can help with bill management once my services are restored. Your bills are safely stored on the blockchain!";
    }
    if (message.toLowerCase().includes('save')) {
      return "I'd love to help you save money! Please try your question again in a moment when my AI is back online.";
    }

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getConversationHistory() {
    return this.conversationHistory;
  }
}

export default new AIService();