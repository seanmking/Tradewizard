import React, { useState, useEffect, useRef } from 'react';
import ChatInput, { DropdownOption } from '../Chat/ChatInput';
import MarketIntelligenceDashboard from '../Dashboard/MarketIntelligenceDashboard';
import MarketSelectionPanel from './MarketSelectionPanel';
import AccountCreation from '../Auth/AccountCreation';
import ExportReadinessReport from '../Reports/ExportReadinessReport';
import { 
  processAssessmentResponse, 
  getInitialQuestion, 
  AssessmentStep,
  MarketOption
} from '../../services/assessment-api';
import './InitialAssessmentFlow.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    step?: string;
    marketOptions?: MarketOption[];
  };
}

interface InitialAssessmentFlowProps {
  onComplete?: () => void;
}

const TypingIndicator = () => (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

const InitialAssessmentFlow: React.FC<InitialAssessmentFlowProps> = ({ onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<AssessmentStep | null>(null);
  const [userData, setUserData] = useState<Record<string, any>>({});
  const [dashboardData, setDashboardData] = useState<Record<string, any> | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [username, setUsername] = useState('');
  const [showReadinessReport, setShowReadinessReport] = useState(false);
  const [showStandaloneReport, setShowStandaloneReport] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Add a small delay to ensure content is rendered before scrolling
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [messages]);
  
  // Scroll to top when component mounts
  useEffect(() => {
    // No need to scroll the whole window anymore
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, []);
  
  // Get initial question on component mount
  useEffect(() => {
    const fetchInitialQuestion = async () => {
      try {
        setIsTyping(true);
        const response = await getInitialQuestion();
        setCurrentStep({
          id: response.step_id,
          prompt: response.question,
          type: 'text'
        });
        
        // Add initial message
        setMessages([
          {
            role: 'assistant' as const,
            content: response.question,
            timestamp: Date.now()
          }
        ]);
        setIsTyping(false);
        
        // Focus the input after initial question loads
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      } catch (error) {
        console.error('Error fetching initial question:', error);
        setIsTyping(false);
      }
    };
    
    fetchInitialQuestion();
  }, []);
  
  // Handle user message submission
  const handleSubmit = async (message: string) => {
    if (!currentStep) return;
    
    // Add user message to chat
    const newMessages = [
      ...messages,
      {
        role: 'user' as const,
        content: message,
        timestamp: Date.now()
      }
    ];
    setMessages(newMessages);
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Process the response
      const response = await processAssessmentResponse(
        currentStep.id,
        message,
        userData
      );
      
      // Update user data but preserve our selectedMarkets if they exist
      setUserData(prevUserData => {
        const preservedSelectedMarkets = prevUserData.selectedMarkets;
        
        // Create new userData object from the response
        const newUserData = {
          ...response.user_data,
          // Preserve our selectedMarkets array if it exists
          ...(preservedSelectedMarkets && { selectedMarkets: preservedSelectedMarkets })
        };
        
        console.log('Preserved selected markets:', preservedSelectedMarkets);
        console.log('Updated userData:', newUserData);
        
        return newUserData;
      });
      
      // Only show dashboard after target markets have been selected
      if (response.next_step.id === 'summary' && response.user_data.selected_markets) {
        // Update dashboard data if available
        if (response.dashboard_updates && Object.keys(response.dashboard_updates).length > 0) {
          setDashboardData(response.dashboard_updates);
          setShowDashboard(true);
        }
      } else {
        setShowDashboard(false);
      }
      
      // Update current step
      setCurrentStep({
        id: response.next_step.id,
        prompt: response.next_step.prompt,
        type: response.next_step.type as 'text' | 'market_selection' | 'final',
        marketOptions: response.next_step.market_options
      });
      
      // Log market options for debugging
      if (response.next_step.type === 'market_selection') {
        console.log('Market options received:', response.next_step.market_options);
      }
      
      // Add assistant response to chat with shorter typing delay (500ms instead of longer)
      setTimeout(() => {
        setMessages([
          ...newMessages,
          {
            role: 'assistant' as const,
            content: response.next_step.prompt,
            timestamp: Date.now(),
            metadata: {
              step: response.next_step.id,
              marketOptions: response.next_step.market_options
            }
          }
        ]);
        setIsTyping(false);
        
        // Auto-focus the input after new message
        if (inputRef.current && response.next_step.type !== 'market_selection') {
          inputRef.current.focus();
        }
      }, 500); // Reduced typing delay to 500ms
    } catch (error) {
      console.error('Error processing response:', error);
      setIsTyping(false);
    }
  };
  
  // Get dropdown options for market selection
  const getDropdownOptions = () => {
    if (!currentStep || currentStep.type !== 'market_selection') {
      return [];
    }
    
    // Ensure marketOptions exists and is an array
    if (!currentStep.marketOptions || !Array.isArray(currentStep.marketOptions) || currentStep.marketOptions.length === 0) {
      // If we're at the target_markets step but don't have options, create some default ones
      if (currentStep.id === 'target_markets') {
        return [
          { id: 'uk', label: 'United Kingdom', value: 'United Kingdom' },
          { id: 'us', label: 'United States', value: 'United States' },
          { id: 'eu', label: 'European Union', value: 'European Union' },
          { id: 'ca', label: 'Canada', value: 'Canada' },
          { id: 'au', label: 'Australia', value: 'Australia' },
          { id: 'jp', label: 'Japan', value: 'Japan' },
          { id: 'sg', label: 'Singapore', value: 'Singapore' },
          { id: 'uae', label: 'United Arab Emirates', value: 'United Arab Emirates' }
        ];
      }
      return [];
    }
    
    // Make sure UK is in the list of market options
    const marketOptions = [...currentStep.marketOptions];
    const hasUK = marketOptions.some(option => option.name === 'United Kingdom' || option.id === 'uk');
    
    if (!hasUK) {
      marketOptions.unshift({
        id: 'uk',
        name: 'United Kingdom',
        description: 'Major market with extensive data on South African exports. Strong trade relationships and consumer interest in premium South African products.',
        confidence: 0.94
      });
    }
    
    return marketOptions.map(option => ({
      id: option.id,
      label: option.name,
      value: option.name
    }));
  };
  
  // Handle market selection submission
  const handleMarketsSubmit = (selectedMarkets: string[]) => {
    if (!currentStep) return;
    
    // First, add the user's selection as a message
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: `I'm interested in exploring: ${selectedMarkets.join(', ')}`,
        timestamp: Date.now()
      }
    ]);
    
    // Store the selected markets in userData directly
    setUserData(prev => ({
      ...prev,
      selectedMarkets: selectedMarkets // Store as array
    }));
    
    // Then process the response
    handleSubmit(selectedMarkets.join(', '));
  };
  
  // Handle account creation success
  const handleAccountCreationSuccess = (email: string) => {
    setShowAccountCreation(false);
    setAccountCreated(true);
    setUsername(email);
    
    // Extract username from email and capitalize first letter
    const username = email.split('@')[0];
    const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);
    
    // Add a success message
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: `Account created successfully! Welcome, ${capitalizedUsername}. Your export readiness report is now available.`,
        timestamp: Date.now(),
        metadata: { step: 'account_created' }
      }
    ]);
    
    // Scroll to the new message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // Handle account creation cancellation
  const handleAccountCreationCancel = () => {
    setShowAccountCreation(false);
  };
  
  // Handle closing the export readiness report
  const handleCloseReport = () => {
    setShowReadinessReport(false);
  };

  const handleCloseDashboard = () => {
    setShowDashboard(false);
  };

  const handleGoToDashboard = () => {
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete();
    }
    
    setShowReadinessReport(false);
    setShowStandaloneReport(false);
    
    // If dashboardData is not set, create mock data
    if (!dashboardData) {
      const mockDashboardData = {
        business_profile: {
          products: {
            categories: ['Dried Fruits', 'Nuts', 'Specialty Foods'],
            items: ['Dried Mango', 'Dried Apricots', 'Macadamia Nuts', 'Specialty Rooibos Tea'],
            confidence: 0.9
          },
          current_markets: {
            countries: ['South Africa'],
            confidence: 0.95
          },
          certifications: {
            items: ['HACCP Level 1', 'Local Food Safety Certification'],
            confidence: 0.85
          },
          business_details: {
            estimated_size: 'Medium Enterprise',
            years_operating: '8 years',
            confidence: 0.9
          }
        },
        market_intelligence: {
          market_size: {
            value: 'EU: €42.7 billion, UAE: $1.2 billion',
            confidence: 0.8
          },
          growth_rate: {
            value: 'EU: 5.8% annually, UAE: 7.2% annually',
            confidence: 0.75
          },
          regulations: {
            items: [
              'EU Food Safety Regulations (EC 178/2002)',
              'Packaging and labeling directives',
              'Halal certification (UAE)',
              'UAE.S GSO 9/2013 labeling standard'
            ],
            confidence: 0.85
          },
          opportunity_timeline: {
            months: 6,
            confidence: 0.7
          }
        },
        competitor_landscape: {
          competitors: [
            {
              name: 'Global Fruits Co.',
              market_share: '12%',
              strengths: ['Established distribution network', 'Wide product range']
            },
            {
              name: 'Premium Organics Ltd.',
              market_share: '8%',
              strengths: ['Strong organic certification', 'Premium brand positioning']
            },
            {
              name: 'Exotic Tastes Inc.',
              market_share: '5%',
              strengths: ['Innovative packaging', 'Strong online presence']
            }
          ],
          confidence: 0.65
        }
      };
      
      setDashboardData(mockDashboardData);
    }
    
    setShowDashboard(true);
  };
  
  // Toggle standalone report visibility
  const toggleStandaloneReport = () => {
    // If the modal report is open, close it
    if (showReadinessReport) {
      setShowReadinessReport(false);
    }
    
    // Toggle the standalone report
    setShowStandaloneReport(prev => !prev);
  };
  
  const getInputPlaceholder = () => {
    if (isTyping) return "Sarah is typing...";
    if (currentStep?.type === 'market_selection') return "Please select markets above...";
    return "Type your message...";
  };
  
  const renderMessages = () => {
    return messages.map((message, index) => {
      const isLastMessage = index === messages.length - 1;
      const showMarketSelection = 
        message.role === 'assistant' && 
        message.metadata?.step === 'target_markets' && 
        isLastMessage;
      
      return (
        <div key={message.timestamp} className={`message-wrapper ${message.role}-wrapper`}>
          <div className={`message ${message.role}-message`}>
            <div className="message-text">
              {message.content.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
          
          {showMarketSelection && (
            <div className="market-selection-container-simplified">
              <MarketSelectionPanel 
                markets={message.metadata?.marketOptions || []} 
                onSubmit={handleMarketsSubmit}
                isLoading={isTyping}
              />
            </div>
          )}

          {/* Render account creation button if this is the summary step */}
          {message.role === 'assistant' && 
           message.metadata?.step === 'summary' && 
           isLastMessage && 
           !accountCreated && (
            <div className="create-account-button-container">
              <button 
                className="create-account-button"
                onClick={() => setShowAccountCreation(true)}
              >
                Create account and access Export-readiness report
              </button>
            </div>
          )}
          
          {/* Render download report button if account has been created */}
          {message.role === 'assistant' && 
           message.metadata?.step === 'account_created' && 
           isLastMessage && (
            <div className="readiness-report-link-container">
              <button 
                className="standalone-report-button"
                onClick={toggleStandaloneReport}
              >
                {showStandaloneReport ? 'Hide Report' : 'Access your Export-readiness report'}
              </button>
            </div>
          )}
        </div>
      );
    });
  };
  
  // Add debugging for report rendering
  useEffect(() => {
    if (showReadinessReport || showStandaloneReport) {
      console.log('Rendering report with complete userData:', userData);
      console.log('selectedMarkets value:', userData.selectedMarkets);
      console.log('selected_markets value:', userData.selected_markets);
    }
  }, [showReadinessReport, showStandaloneReport, userData]);

  return (
    <div className="assessment-flow-container">
      <div className="initial-assessment-container">
        {/* Standalone report container */}
        {showStandaloneReport && accountCreated && (
          <div className="standalone-report-container">
            <ExportReadinessReport
              userData={{
                companyName: 'Global Fresh SA',
                selectedMarkets: userData.selectedMarkets
              }}
              onClose={() => setShowStandaloneReport(false)}
              onGoToDashboard={handleGoToDashboard}
              standalone={true}
            />
          </div>
        )}
        
        <div className={`chat-container ${showDashboard ? 'with-dashboard' : ''} ${showStandaloneReport ? 'with-standalone-report' : ''}`}>
          <div className="messages-container" ref={messagesContainerRef}>
            {renderMessages()}
            <div ref={messagesEndRef} />
            {isTyping && <div className="message assistant-message"><TypingIndicator /></div>}
          </div>
          <div className="input-container">
            <ChatInput 
              onSubmit={handleSubmit} 
              isLoading={isTyping}
              disableInput={!currentStep || currentStep.type === 'final' || currentStep.type === 'market_selection' || showDashboard}
              dropdownOptions={getDropdownOptions()}
              inputRef={inputRef}
            />
          </div>
        </div>
        
        {showDashboard && dashboardData && (
          <MarketIntelligenceDashboard 
            dashboardData={dashboardData}
            userData={userData}
            onClose={handleCloseDashboard}
          />
        )}
      </div>

      {/* Account creation modal */}
      {showAccountCreation && (
        <AccountCreation
          onSuccess={handleAccountCreationSuccess}
          onCancel={handleAccountCreationCancel}
        />
      )}

      {/* Export readiness report modal */}
      {showReadinessReport && (
        <ExportReadinessReport
          userData={{
            companyName: 'Global Fresh SA',
            selectedMarkets: userData.selectedMarkets
          }}
          onClose={handleCloseReport}
          onGoToDashboard={handleGoToDashboard}
        />
      )}
    </div>
  );
};

export default InitialAssessmentFlow; 