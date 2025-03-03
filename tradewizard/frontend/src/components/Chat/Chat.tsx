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
    progress: { completed: 0, total: 8 },
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
      // Extract entity type from business name with confidence scoring
      const entityTypePatterns = {
        PTY_LTD: [
          /\(PTY\)\s*LTD/i,
          /PTY\s*LTD/i,
          /PROPRIETARY\s*LIMITED/i
        ],
        CC: [
          /\bCC\b/i,
          /CLOSE\s*CORPORATION/i
        ],
        INC: [
          /\bINC\b/i,
          /INCORPORATED/i
        ]
      };

      let entityType;
      let entityConfidence = 0;

      const businessName = extracted_info.business_name?.toUpperCase() || '';
      
      for (const [type, patterns] of Object.entries(entityTypePatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(businessName)) {
            // Higher confidence for more specific matches
            const matchConfidence = pattern.toString().length > 10 ? 1 : 0.8;
            if (matchConfidence > entityConfidence) {
              entityType = type;
              entityConfidence = matchConfidence;
            }
          }
        }
      }

      // If low confidence or no match, try additional heuristics
      if (entityConfidence < 0.8) {
        // Check for bracketed variations
        if (/\([^)]*(?:PTY|CC|INC)[^)]*\)/i.test(businessName)) {
          entityConfidence = 0.9;
        }
        // Check for registration number format typical of PTY LTD
        if (/\d{4}\/\d{6}\/\d{2}/.test(websiteData.companyInfo.registrationDetails.regNumber)) {
          entityType = entityType || 'PTY_LTD';
          entityConfidence = Math.max(entityConfidence, 0.7);
        }
      }
      
      // Only use entity type if we have reasonable confidence
      const detectedEntityType = entityConfidence >= 0.7 ? entityType : undefined;
      
      // Determine industry sector based on products with enhanced taxonomy
      const productTaxonomy = {
        FOOD_PRODUCTS: {
          keywords: ['food', 'edible', 'consumable', 'ingredient'],
          subsectors: {
            PROCESSED_FOODS: {
              keywords: ['dried', 'processed', 'preserved', 'packaged', 'canned'],
              products: ['dried fruit', 'nuts', 'snacks', 'trail mix']
            },
            FRESH_PRODUCE: {
              keywords: ['fresh', 'raw', 'organic', 'produce'],
              products: ['vegetables', 'fruits', 'herbs']
            }
          }
        },
        BEVERAGES: {
          keywords: ['drink', 'beverage', 'liquid'],
          subsectors: {
            ALCOHOLIC: {
              keywords: ['wine', 'beer', 'spirit'],
              products: ['wine', 'craft beer', 'spirits']
            },
            NON_ALCOHOLIC: {
              keywords: ['juice', 'soda', 'water'],
              products: ['fruit juice', 'soft drinks', 'mineral water']
            }
          }
        }
      };

      // Helper function for fuzzy matching
      const fuzzyMatch = (text: string, keywords: string[]) => {
        text = text.toLowerCase();
        return keywords.some(keyword => {
          const distance = text.includes(keyword.toLowerCase()) ? 1 :
            text.split(' ').some(word => 
              levenshteinDistance(word, keyword.toLowerCase()) <= 2
            ) ? 0.7 : 0;
          return distance > 0.6;
        });
      };

      // Levenshtein distance for fuzzy matching
      const levenshteinDistance = (a: string, b: string) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = Array(b.length + 1).fill(null).map(() => 
          Array(a.length + 1).fill(null)
        );

        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= b.length; j++) {
          for (let i = 1; i <= a.length; i++) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
              matrix[j][i - 1] + 1,
              matrix[j - 1][i] + 1,
              matrix[j - 1][i - 1] + indicator
            );
          }
        }

        return matrix[b.length][a.length];
      };

      // Analyze products with confidence scoring
      const productAnalysis = {
        sector: '',
        subsector: '',
        confidence: 0,
        features: new Set<string>()
      };

      const productCategories = websiteData.products.categories;
      const allProducts = productCategories.flatMap(cat => 
        cat.items.map(item => item.name.toLowerCase())
      );
      const categoryNames = productCategories.map(cat => 
        cat.name.toLowerCase()
      );

      // Analyze each product against our taxonomy
      for (const [sector, sectorData] of Object.entries(productTaxonomy)) {
        const sectorMatch = [...allProducts, ...categoryNames].some(item =>
          fuzzyMatch(item, sectorData.keywords)
        );

        if (sectorMatch) {
          let maxConfidence = 0.6; // Base confidence for sector match

          for (const [subsector, subsectorData] of Object.entries(sectorData.subsectors)) {
            const subsectorKeywordMatch = [...allProducts, ...categoryNames].some(item =>
              fuzzyMatch(item, subsectorData.keywords)
            );
            const subsectorProductMatch = [...allProducts, ...categoryNames].some(item =>
              fuzzyMatch(item, subsectorData.products)
            );

            const confidence = subsectorKeywordMatch ? 0.8 :
                             subsectorProductMatch ? 0.9 : 0;

            if (confidence > maxConfidence) {
              maxConfidence = confidence;
              productAnalysis.sector = sector;
              productAnalysis.subsector = subsector;
              productAnalysis.confidence = maxConfidence;

              // Add relevant product features
              if (subsectorData.products) {
                subsectorData.products.forEach(product => {
                  if ([...allProducts, ...categoryNames].some(item => 
                    fuzzyMatch(item, [product])
                  )) {
                    productAnalysis.features.add(product);
                  }
                });
              }
            }
          }
        }
      }

      // Set sector and subsector based on analysis
      const sector = productAnalysis.confidence >= 0.7 ? productAnalysis.sector : undefined;
      const subsector = productAnalysis.confidence >= 0.8 ? productAnalysis.subsector : undefined;

      // Extract unique product features
      const productFeatures = productAnalysis.features;

      // Enhanced market analysis based on product features and sector
      interface MarketData {
        strengths: string[];
        preferences: string[];
        sectors: {
          [key: string]: {
            score: number;
            notes: string[];
          };
        };
      }

      interface PotentialMarkets {
        [key: string]: MarketData;
      }

      const generateMarketAnalysis = (
        sector: string | undefined,
        subsector: string | undefined,
        features: Set<string>,
        existingMotivation?: string
      ) => {
        const marketOpportunities = new Map<string, { 
          score: number,
          reasons: string[]
        }>();

        // Base markets to consider
        const potentialMarkets: PotentialMarkets = {
          'United Arab Emirates': {
            strengths: ['High disposable income', 'Strong demand for premium products'],
            preferences: ['Halal certification', 'Premium packaging'],
            sectors: {
              FOOD_PRODUCTS: {
                score: 0.8,
                notes: ['Growing demand for healthy snacks', 'Premium dried fruits market']
              },
              BEVERAGES: {
                score: 0.6,
                notes: ['Preference for non-alcoholic beverages']
              }
            }
          },
          'European Union': {
            strengths: ['Large unified market', 'Strong food safety standards'],
            preferences: ['Organic certification', 'Sustainable packaging'],
            sectors: {
              FOOD_PRODUCTS: {
                score: 0.9,
                notes: ['High demand for healthy snacks', 'Strong organic market']
              },
              BEVERAGES: {
                score: 0.8,
                notes: ['Growing craft beverage market']
              }
            }
          },
          'United Kingdom': {
            strengths: ['Familiar business environment', 'Strong SA diaspora'],
            preferences: ['Quality certification', 'Clear origin labeling'],
            sectors: {
              FOOD_PRODUCTS: {
                score: 0.85,
                notes: ['Growing health food market', 'Strong dried fruit demand']
              },
              BEVERAGES: {
                score: 0.75,
                notes: ['Premium beverage market']
              }
            }
          }
        };

        // Score each market based on sector fit and features
        for (const [market, data] of Object.entries(potentialMarkets)) {
          let score = 0;
          const reasons: string[] = [];

          // Sector-based scoring
          if (sector && data.sectors[sector]) {
            score += data.sectors[sector].score;
            reasons.push(...data.sectors[sector].notes);
          }

          // Feature-based scoring
          [...features].forEach(feature => {
            if (feature.includes('premium') || feature.includes('specialty')) {
              if (data.strengths.includes('High disposable income')) {
                score += 0.2;
                reasons.push('Strong market for premium products');
              }
            }
            if (feature.includes('organic') || feature.includes('natural')) {
              if (data.preferences.includes('Organic certification')) {
                score += 0.2;
                reasons.push('Strong organic market presence');
              }
            }
          });

          // Normalize score
          score = Math.min(score, 1);

          if (score >= 0.6) {
            marketOpportunities.set(market, {
              score,
              reasons: [...new Set(reasons)]
            });
          }
        }

        // Sort markets by score
        const sortedMarkets = Array.from(marketOpportunities.entries())
          .sort(([, a], [, b]) => b.score - a.score)
          .slice(0, 4);

        // Generate analysis text
        let analysis = existingMotivation ? `${existingMotivation}\n\n` : '';
        analysis += 'Market Analysis Based on Your Product Profile:\n\n';

        sortedMarkets.forEach(([market, { score, reasons }]) => {
          analysis += `${market} (Match Score: ${Math.round(score * 100)}%)\n`;
          reasons.forEach(reason => analysis += `- ${reason}\n`);
          analysis += '\n';
        });

        return {
          targetMarkets: sortedMarkets.map(([market]) => market),
          analysis
        };
      };

      // Generate market analysis
      const marketAnalysis = generateMarketAnalysis(
        sector,
        subsector,
        productFeatures,
        extracted_info.export_motivation
      );

      enhancedInfo = {
        ...enhancedInfo,
        business_entity_type: detectedEntityType || enhancedInfo.business_entity_type,
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
        },
        llm_extract: {
          target_markets: marketAnalysis.targetMarkets,
          enhanced_vision: marketAnalysis.analysis
        }
      };
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
          <button type="submit" disabled={isLoading || !input.trim()} aria-label="Send">
            {/* Icon is added via CSS */}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
