import React from 'react';
import { startChat, sendChatMessage, ChatResponse } from '../../services/api';
import { BusinessVerificationForm } from '../Assessment/BusinessVerificationForm';
import { Button } from '@mui/material';
import './Chat.css';
import type { WebsiteData, ProductCategory, ProductItem } from '../../types/website';

// Mock website data - in production this would come from an API
const websiteData: WebsiteData = {
  companyInfo: {
    name: "Global Fresh SA",
    founded: 2018,
    location: "Unit 12, Techno Park Industrial Estate, Stellenbosch, 7600",
    contact: {
      email: "info@globalfreshsa.co.za",
      phone: "+27 (0)21 555 1234"
    },
    registrationDetails: {
      regNumber: "2018/123456/07",
      vat: "4480123456"
    }
  },
  products: {
    categories: [
      {
        name: "Cape Harvest Dried Fruit Line",
        items: [
          { name: "Premium Mango Slices" },
          { name: "Golden Apricot Selection" },
          { name: "Cape Mixed Fruit Medley" },
          { name: "Superfood Berry Mix" }
        ]
      },
      {
        name: "Safari Blend Nut Selections",
        items: [
          { name: "Kalahari Salt & Herb Mix" },
          { name: "Rooibos Infused Almond Mix" }
        ]
      }
    ]
  }
};

interface AssessmentState {
  currentStep: string;
  completedSteps: string[];
  progress: {
    completed: number;
    total: number;
  };
  extractedInfo: Record<string, any>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    step?: string;
    extractedInfo?: Record<string, any>;
  };
}

const TypingIndicator = () => (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

const Chat = () => {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi there! I'm Sarah, your export readiness consultant. To help your business explore international opportunities, could you please tell me your name, your role, and the full name of the business you're representing?",
      timestamp: Date.now(),
      metadata: { step: 'STEP_1_INTRODUCTION' }
    }
  ]);
  const [input, setInput] = React.useState('');
  const [chatId, setChatId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showVerificationForm, setShowVerificationForm] = React.useState(false);
  const [showVerificationButton, setShowVerificationButton] = React.useState(false);
  const [assessmentState, setAssessmentState] = React.useState<AssessmentState>({
    currentStep: 'STEP_1_INTRODUCTION',
    completedSteps: [],
    progress: { completed: 0, total: 4 },
    extractedInfo: {}
  });
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Focus input when component mounts and after loading states change
  React.useEffect(() => {
    const focusInput = () => {
      if (!isLoading && inputRef.current && !showVerificationForm) {
        inputRef.current.focus();
      }
    };

    // Focus immediately
    focusInput();
    
    // Also try after a small delay to ensure rendering is complete
    const timeoutId = setTimeout(focusInput, 100);

    return () => clearTimeout(timeoutId);
  }, [isLoading, showVerificationForm]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session only once
  React.useEffect(() => {
    let mounted = true;

    const initChat = async () => {
      if (chatId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const session = await startChat();
        if (mounted) {
          setChatId(session.chat_id);
        }
      } catch (error) {
        console.error('Failed to start chat:', error);
        if (mounted) {
          setError('Failed to start chat session. Please try again.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initChat();

    return () => {
      mounted = false;
    };
  }, []);

  const updateAssessmentState = (response: ChatResponse) => {
    const { current_step, completed_steps, progress, extracted_info, should_show_verification_form } = response.response;
    
    // If we have business information, enhance it with website data
    let enhancedInfo = { ...extracted_info };
    
    if (extracted_info.business_name === websiteData.companyInfo.name) {
      // Extract entity type from business name if it contains PTY LTD
      const entityType = extracted_info.business_name?.toUpperCase().includes('PTY LTD') ? 'PTY_LTD' : undefined;
      
      // Determine industry sector based on products
      const productCategories = websiteData.products.categories;
      const allProducts = productCategories.flatMap(cat => cat.items.map(item => item.name.toLowerCase()));
      const categoryNames = productCategories.map(cat => cat.name.toLowerCase());
      
      // Analyze products and categories to determine sector and subsector
      const hasDriedFruits = categoryNames.some(name => name.includes('dried fruit')) || 
                            allProducts.some(name => name.includes('dried'));
      const hasNuts = categoryNames.some(name => name.includes('nut')) || 
                     allProducts.some(name => name.includes('nut'));
      
      // Set sector and subsector based on product analysis
      const sector = 'FOOD_PRODUCTS';
      const subsector = hasDriedFruits || hasNuts ? 'PROCESSED_FOODS' : undefined;

      // Extract unique product features
      const productFeatures = new Set<string>();
      if (hasDriedFruits) productFeatures.add('premium dried fruits');
      if (hasNuts) productFeatures.add('specialty nuts');
      
      // Identify target markets based on product characteristics
      const targetMarkets = [
        'Namibia',
        'Botswana',
        'United Arab Emirates', // High demand for premium dried fruits
        'European Union'        // Strong market for health foods
      ];

      enhancedInfo = {
        ...enhancedInfo,
        business_entity_type: entityType || enhancedInfo.business_entity_type,
        role: extracted_info.role,
        website_extract: {
          year_founded: websiteData.companyInfo.founded,
          location: websiteData.companyInfo.location,
          contact_email: websiteData.companyInfo.contact.email,
          contact_phone: websiteData.companyInfo.contact.phone,
          registration_number: websiteData.companyInfo.registrationDetails.regNumber,
          vat_number: websiteData.companyInfo.registrationDetails.vat,
          main_products: websiteData.products.categories.flatMap((category: ProductCategory) => 
            category.items.map((item: ProductItem) => item.name)
          ),
          sector,
          subsector
        }
      };

      // If we have export motivation, enhance them with industry context
      if (extracted_info.export_motivation) {
        const productList = Array.from(productFeatures).join(' and ');
        const marketAnalysis = `
Your focus on the South African diaspora market shows strong strategic thinking:

Key Market Opportunities:
1. United Kingdom: ~230,000 South African expatriates
2. Australia: ~200,000+ South African community
3. New Zealand: Growing South African population
4. Canada: Established South African communities in major cities

Competitive Advantages for Diaspora Market:
- Strong brand recognition among South African expatriates
- Authentic South African product range
- Understanding of cultural preferences and taste profiles
- Existing community networks for word-of-mouth marketing

Market Entry Strategy Recommendations:
1. E-commerce Focus: Direct-to-consumer platform for diaspora customers
2. Community Partnerships: South African cultural associations and events
3. Retail Distribution: Target stores in areas with high South African populations
4. Digital Marketing: Geo-targeted social media campaigns for expatriate communities

Additional Growth Opportunities:
- Cross-cultural market expansion through diaspora networks
- Seasonal gift packages for holidays and cultural celebrations
- Subscription boxes for regular customers
- Local market partnerships in key diaspora regions`;

        enhancedInfo = {
          ...enhancedInfo,
          llm_extract: {
            target_markets: [
              'United Kingdom',
              'Australia',
              'New Zealand',
              'Canada'
            ],
            enhanced_vision: `${extracted_info.export_motivation}\n\n${marketAnalysis}`
          }
        };
      }
    }
    
    setAssessmentState(prev => ({
      ...prev,
      currentStep: current_step,
      completedSteps: completed_steps,
      progress: {
        completed: progress.completed,
        total: progress.total
      },
      extractedInfo: {
        ...prev.extractedInfo,
        ...enhancedInfo
      }
    }));

    // Update verification button visibility
    setShowVerificationButton(should_show_verification_form);
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!input.trim() || !chatId || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Add user message
      setMessages(prev => [...prev, {
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
        metadata: {
          step: assessmentState.currentStep
        }
      }]);

      const response: ChatResponse = await sendChatMessage(chatId, userMessage);
      
      // Update assessment state
      updateAssessmentState(response);

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response.response,
        timestamp: Date.now(),
        metadata: {
          step: response.response.current_step,
          extractedInfo: response.response.extracted_info
        }
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = (data: any) => {
    // Handle the verified business data
    console.log('Verification complete:', data);
    setShowVerificationForm(false);
    
    // Add verification completion message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Thank you for providing your business verification details. Let me analyze this information to complete your export readiness assessment.',
      timestamp: Date.now(),
      metadata: {
        step: 'STEP_4_BUSINESS_VERIFICATION',
        extractedInfo: data
      }
    }]);
  };

  const handleProceedToVerification = () => {
    // Extract and format website data
    const websiteExtract = {
      year_founded: websiteData.companyInfo.founded,
      location: websiteData.companyInfo.location,
      contact_email: websiteData.companyInfo.contact.email,
      contact_phone: websiteData.companyInfo.contact.phone,
      registration_number: websiteData.companyInfo.registrationDetails.regNumber,
      vat_number: websiteData.companyInfo.registrationDetails.vat,
      main_products: websiteData.products.categories.flatMap((category: ProductCategory) => 
        category.items.map((item: ProductItem) => item.name)
      )
    };

    // Enhance the export vision with industry context
    const enhancedVision = assessmentState.extractedInfo.export_motivation ? 
      `${assessmentState.extractedInfo.export_motivation}\n\nBased on our analysis, this aligns well with the growing demand for premium dried fruits and nuts in international markets. With our HACCP certification and pending ISO 22000 certification, we are well-positioned to meet international food safety standards. Our sustainable packaging initiatives and local sourcing strategy also appeal to environmentally conscious international buyers.` : 
      '';

    // Update the assessment state with enhanced data
    setAssessmentState(prev => ({
      ...prev,
      extractedInfo: {
        ...prev.extractedInfo,
        website_extract: websiteExtract,
        llm_extract: {
          target_markets: ['Namibia', 'Botswana'], // From blog posts mentioning interest
          enhanced_vision: enhancedVision
        }
      }
    }));

    setShowVerificationForm(true);
    setShowVerificationButton(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (showVerificationForm) {
    return (
      <BusinessVerificationForm
        onValidationComplete={handleVerificationComplete}
        initialData={assessmentState.extractedInfo}
      />
    );
  }

  const progressPercentage = (assessmentState.progress.completed / assessmentState.progress.total) * 100;

  return (
    <div className="chat-container">
      {assessmentState.progress.completed > 0 && (
        <div className="chat-header">
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="progress-label">
              Step {assessmentState.progress.completed} of {assessmentState.progress.total}
            </div>
          </div>
        </div>
      )}

      <div className="messages-container">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant-message">
            <TypingIndicator />
          </div>
        )}
        {showVerificationButton && (
          <div className="verification-button-container">
            <Button
              variant="contained"
              color="primary"
              onClick={handleProceedToVerification}
              sx={{ mt: 2, mb: 2 }}
            >
              Proceed to Business Verification
            </Button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input">
        <form onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
            placeholder="Type your message..."
            disabled={isLoading}
            rows={1}
            autoFocus
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
