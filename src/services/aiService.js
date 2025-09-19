import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.modelName = process.env.REACT_APP_GEMINI_MODEL || 'gemini-pro';
    this.genAI = null;
    this.model = null;
    this.conversationHistory = [];
    this.isInitialized = false;
    
    this.initialize();
  }

  initialize() {
    if (!this.apiKey) {
      console.warn('Gemini API key not found. AI features will use mock responses.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });
      this.isInitialized = true;
      console.log('Gemini AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      this.isInitialized = false;
    }
  }

  async generateResponse(userMessage, context = {}) {
    if (!this.isInitialized) {
      return {
        success: false,
        response: this.getFallbackResponse(userMessage),
        error: 'AI service not initialized'
      };
    }

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
        timestamp: new Date(),
        context: context
      });

    
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return {
        success: true,
        response: text,
        context: context,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      
      
      let errorMessage = 'AI service temporarily unavailable';
      if (error.message?.includes('API key')) {
        errorMessage = 'AI service configuration error';
      } else if (error.message?.includes('quota')) {
        errorMessage = 'AI service quota exceeded';
      } else if (error.message?.includes('blocked')) {
        errorMessage = 'Request was blocked by safety filters';
      }
      
      return {
        success: false,
        response: this.getFallbackResponse(userMessage),
        error: errorMessage,
        originalError: error.message
      };
    }
  }

  buildContextPrompt(bills, payments, userStats) {
    const totalBills = bills.length;
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgBillAmount = totalBills > 0 ? (totalPaid / totalBills).toFixed(2) : 0;
    
    
    const pendingBills = bills.filter(b => b.status === 'pending').length;
    const overdueBills = bills.filter(b => b.status === 'overdue').length;
    const paidOnTime = payments.filter(p => p.status === 'paid' && !p.isLate).length;

    return `You are FEEEZ AI, a helpful financial assistant for a decentralized bill payment app built on blockchain technology.

Context about the user:
- Total Bills: ${totalBills}
- Pending Bills: ${pendingBills}
- Overdue Bills: ${overdueBills}
- Total Paid: $${totalPaid}
- Average Bill: $${avgBillAmount}
- On-time Payments: ${paidOnTime}
- Recent Bills: ${bills.slice(0, 3).map(b => `${b.name || b.description} - $${b.amount} (${b.status})`).join(', ')}
- User Stats: Active pools: ${userStats.activePools || 0}, NFT tier: ${userStats.nftTier || 'None'}

Guidelines:
- Be conversational, helpful, and encouraging
- Focus on bill payment insights, financial wellness, and saving money
- Suggest ways to optimize payment habits and reduce costs
- Mention DeFi/crypto features when relevant (pools, NFT rewards, blockchain benefits)
- Keep responses concise but informative (2-3 paragraphs max)
- Be supportive about their financial progress
- Suggest using FEEEZ features like bill pools or NFT rewards when appropriate

Recent conversation context:
${this.conversationHistory.slice(-2).map(h => `User: ${h.user}\nFEEEZ AI: ${h.assistant}`).join('\n\n')}`;
  }

  async analyzeBillPatterns(bills, payments) {
    if (!this.isInitialized) {
      return {
        success: false,
        analysis: 'Bill analysis is temporarily unavailable. Please check your dashboard for current insights.',
        error: 'AI service not initialized'
      };
    }

    try {
      const analysisPrompt = `As FEEEZ AI, analyze these bill payment patterns and provide actionable financial insights:

Bills Data:
${JSON.stringify(bills.map(b => ({ 
  name: b.name || b.description, 
  amount: b.amount, 
  dueDate: b.dueDate,
  category: b.category,
  status: b.status 
})), null, 2)}

Payments Data:
${JSON.stringify(payments.map(p => ({ 
  amount: p.amount, 
  date: p.date, 
  status: p.status,
  method: p.method 
})), null, 2)}

Please provide a comprehensive analysis with:

1. **Spending Patterns**: Key trends and patterns in spending
2. **Payment Behavior**: Analysis of payment timing and habits  
3. **Cost Optimization**: Specific recommendations to reduce expenses
4. **FEEEZ Features**: How bill pools or other app features could help
5. **Financial Health**: Overall assessment and improvement suggestions

Format the response with clear sections and actionable advice. Keep it practical and encouraging.`;

      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      
      return {
        success: true,
        analysis: response.text(),
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Bill Analysis Error:', error);
      return {
        success: false,
        analysis: this.getMockAnalysis(bills, payments),
        error: 'Analysis temporarily unavailable'
      };
    }
  }

  async generateBillSuggestions(spending, category) {
    if (!this.isInitialized) {
      return {
        success: false,
        suggestions: this.getMockSuggestions(category),
        error: 'AI service not initialized'
      };
    }

    try {
      const prompt = `As FEEEZ AI, provide smart financial advice for someone spending $${spending} monthly on ${category} bills.

Please suggest:

1. **Cost Reduction**: Specific ways to lower ${category} expenses
2. **Service Optimization**: Better providers or plans in this category
3. **Payment Strategy**: Timing and method optimizations
4. **FEEEZ Benefits**: How bill pools or NFT rewards could help with ${category} bills
5. **Long-term Savings**: Strategic moves for sustained savings

Make suggestions practical, specific, and achievable. Include estimated savings where possible.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      return {
        success: true,
        suggestions: response.text(),
        category: category,
        spending: spending,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Suggestions Error:', error);
      return {
        success: false,
        suggestions: this.getMockSuggestions(category),
        error: 'Suggestions temporarily unavailable'
      };
    }
  }

  
  async analyzeBillImage(imageData) {
    try {
      
      const visionModel = this.genAI.getGenerativeModel({ 
        model: 'gemini-pro-vision' 
      });

      const prompt = `Analyze this bill image and extract the following information in JSON format:
{
  "vendor": "company name",
  "amount": "bill amount as number",
  "dueDate": "due date if visible",
  "category": "bill category (utilities, internet, insurance, etc.)",
  "accountNumber": "account number if visible",
  "confidence": "confidence level 0-100"
}`;

      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1],
          mimeType: 'image/jpeg'
        }
      };

      const result = await visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      try {
        const extractedData = JSON.parse(text);
        return {
          success: true,
          data: extractedData,
          timestamp: new Date()
        };
      } catch (parseError) {
        return {
          success: true,
          data: {
            extractedText: text,
            confidence: 50
          },
          timestamp: new Date()
        };
      }

    } catch (error) {
      console.error('Image Analysis Error:', error);
      return {
        success: false,
        error: 'Image analysis not available',
        data: null
      };
    }
  }

  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('spend') || lowerMessage.includes('money')) {
      return "I can help analyze your spending patterns once I'm back online. In the meantime, check your dashboard for current spending totals and use bill pools to save money with others! 💰";
    }
    
    if (lowerMessage.includes('bill') || lowerMessage.includes('payment')) {
      return "I can help with bill management and payment strategies once my services are restored. Your bills are safely stored on the blockchain, and you can always join bill pools to reduce costs! 📋";
    }
    
    if (lowerMessage.includes('save') || lowerMessage.includes('reduce')) {
      return "I'd love to help you save money! While I'm offline, consider joining bill pools with other users or checking if you qualify for any NFT rewards. Try asking again in a moment! 💡";
    }

    if (lowerMessage.includes('pool') || lowerMessage.includes('nft')) {
      return "Great question about FEEEZ features! Bill pools let you share costs with others, and NFT rewards recognize your good payment habits. I'll have more detailed advice once I'm back online! 🚀";
    }

    const genericFallbacks = [
      "I'm having trouble connecting to my AI service right now. Can you try asking again in a moment? Your data is safe on the blockchain! 🔄",
      "My AI assistant is temporarily unavailable. In the meantime, explore bill pools and check your dashboard for insights! 📊",
      "I'm experiencing some connectivity issues. Your financial data is secure, and I'll be back shortly with personalized advice! ⚡",
      "Sorry, I can't process that request right now. Try refreshing or asking a simpler question. FEEEZ features are still working perfectly! 🌟"
    ];

    return genericFallbacks[Math.floor(Math.random() * genericFallbacks.length)];
  }


  getMockAnalysis(bills, payments) {
    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
    const avgBill = bills.length > 0 ? totalSpent / bills.length : 0;

    return `**FEEEZ AI Analysis** (Offline Mode)

**Spending Patterns**
- Total bills analyzed: ${bills.length}
- Average bill amount: $${avgBill.toFixed(2)}
- Most frequent category: Utilities

**Recommendations**
- Consider joining bill pools to share costs with other users
- Set up automatic payments to maintain your NFT tier status
- Review bills monthly for potential savings opportunities

**FEEEZ Features**
- Bill pools could save you 10-20% on shared expenses
- Consistent payments help you earn higher-tier NFT rewards

*Full AI analysis will be available when connected.*`;
  }

  getMockSuggestions(category) {
    const suggestions = {
      utilities: 'Consider energy-efficient appliances and joining utility bill pools to share costs with neighbors.',
      internet: 'Compare internet plans annually and consider bundling services. Join internet bill pools for group discounts.',
      insurance: 'Review your insurance coverage yearly and consider increasing deductibles to lower premiums.',
      subscription: 'Audit your subscriptions monthly and cancel unused services. Use bill pools for family plan sharing.',
      default: 'Look for opportunities to bundle services and join relevant bill pools to reduce costs.'
    };

    return suggestions[category] || suggestions.default;
  }

  
  clearHistory() {
    this.conversationHistory = [];
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  getServiceStatus() {
    return {
      initialized: this.isInitialized,
      hasApiKey: !!this.apiKey,
      model: this.modelName,
      conversationCount: this.conversationHistory.length
    };
  }

  
  reinitialize() {
    this.initialize();
    return this.getServiceStatus();
  }
}

const aiService = new AIService();
export default aiService;