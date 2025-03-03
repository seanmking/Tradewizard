import React, { useState, useEffect, useRef } from 'react';
import ChatInput from '../Chat/ChatInput';
import MarketIntelligenceDashboard from '../Dashboard/MarketIntelligenceDashboard';
import { 
  startSarahFlow, 
  processSarahResponse, 
  SarahFlowResponse,
  MarketOption
} from '../../services/assessment-api';
import './SarahAssessmentFlow.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    step?: string;
    marketOptions?: MarketOption[];
  };
}

interface SarahAssessmentFlowProps {
  onComplete?: (extractedInfo: Record<string, any>) => void;
}

// Define DropdownOption to match ChatInput component expectations
interface DropdownOption {
  id: string;
  value: string;
  label: string;
}

const TypingIndicator = () => (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

const SarahAssessmentFlow: React.FC<SarahAssessmentFlowProps> = ({ onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | undefined>(undefined);
  const [userInfo, setUserInfo] = useState<Record<string, any>>({});
  const [dashboardData, setDashboardData] = useState<Record<string, any> | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [showVerificationButton, setShowVerificationButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Focus the input after messages update
    if (inputRef.current && !isTyping && !showAccountCreation) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [messages, isTyping, showAccountCreation]);
  
  // Start Sarah flow on component mount
  useEffect(() => {
    const initSarahFlow = async () => {
      try {
        setIsTyping(true);
        const response = await startSarahFlow();
        
        setChatId(response.chat_id);
        setCurrentStep(response.next_step || undefined);
        
        // Add initial message from Sarah
        setMessages([
          {
            role: 'assistant' as const,
            content: response.response,
            timestamp: Date.now(),
            metadata: { step: response.next_step || undefined }
          }
        ]);
        setIsTyping(false);
      } catch (error) {
        console.error('Error starting Sarah flow:', error);
        setIsTyping(false);
      }
    };
    
    initSarahFlow();
  }, []);
  
  // Handle user message submission
  const handleSubmit = async (message: string) => {
    if (!chatId || !currentStep) return;
    
    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
      metadata: { step: currentStep }
    };
    
    setMessages([...messages, newUserMessage]);
    
    // Process the response
    setIsTyping(true);
    try {
      const response = await processSarahResponse(chatId, message);
      
      // Update user info
      if (response.extracted_info) {
        setUserInfo(response.extracted_info);
      }
      
      // Update current step
      setCurrentStep(response.next_step || undefined);
      
      // Show dashboard after website is provided (when we reach export motivation step)
      if (response.next_step === 'sarah_export_motivation') {
        setShowDashboard(true);
      }
      
      // Show verification button when needed
      if (response.response && response.response.includes('verification process')) {
        setShowVerificationButton(true);
      }
      
      // Show account creation button at the end
      if (response.show_account_creation) {
        setShowAccountCreation(true);
      }
      
      // Add assistant response
      const newAssistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: Date.now(),
        metadata: { 
          step: response.next_step || undefined,
          marketOptions: response.market_options
        }
      };
      
      setMessages([...messages, newUserMessage, newAssistantMessage]);
      setIsTyping(false);
      
      // If flow is complete, notify parent component
      if (!response.next_step && onComplete) {
        onComplete(response.extracted_info || {});
      }
    } catch (error) {
      console.error('Error processing Sarah response:', error);
      setIsTyping(false);
    }
  };
  
  // Get dropdown options for market selection
  const getDropdownOptions = (): DropdownOption[] => {
    const currentMessage = messages[messages.length - 1];
    if (currentMessage?.metadata?.marketOptions) {
      return currentMessage.metadata.marketOptions.map(option => ({
        id: option.id,
        value: option.id,
        label: option.name
      }));
    }
    return [];
  };
  
  // Determine if we should show dropdown input
  const shouldShowDropdown = (): boolean => {
    return currentStep === 'sarah_target_markets';
  };
  
  // Render create account button if applicable
  const renderCreateAccountButton = () => {
    if (!showAccountCreation) return null;
    
    return (
      <div className="create-account-container">
        <button className="create-account-button" onClick={() => onComplete?.(userInfo)}>
          Create Account For Full Assessment
        </button>
      </div>
    );
  };
  
  // Render verification button if applicable
  const renderVerificationButton = () => {
    if (!showVerificationButton) return null;
    
    return (
      <div className="verification-button-container">
        <button 
          className="verification-button"
          onClick={() => {
            // Handle verification process
            setShowVerificationButton(false);
            // You can add more logic here to show a verification form
            onComplete?.(userInfo);
          }}
        >
          Proceed to Business Verification
        </button>
      </div>
    );
  };
  
  return (
    <div className="sarah-assessment-flow">
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-content">
                {message.content}
              </div>
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message assistant">
              <TypingIndicator />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {renderVerificationButton()}
        
        <div className="chat-input-container">
          <ChatInput 
            onSubmit={handleSubmit} 
            isLoading={isTyping}
            disableInput={showAccountCreation || showVerificationButton}
            dropdownOptions={shouldShowDropdown() ? getDropdownOptions() : []}
            dropdownPlaceholder="Select a target market..."
            inputRef={inputRef}
          />
        </div>
        
        {renderCreateAccountButton()}
      </div>
      
      {showDashboard && (
        <div className="dashboard-container">
          <MarketIntelligenceDashboard 
            dashboardData={dashboardData || {}} 
            userData={userInfo}
          />
        </div>
      )}
    </div>
  );
};

export default SarahAssessmentFlow; 