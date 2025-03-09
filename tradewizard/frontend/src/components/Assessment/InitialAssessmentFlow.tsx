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
  MarketOption,
  resetAssessmentState
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
  const initialQuestionFetchedRef = useRef(false);
  
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
  
  // Function to fetch the initial question
  const fetchInitialQuestion = async () => {
    try {
      console.log('Fetching initial question from: /api/assessment/initial-question');
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
  
  // Function to handle assessment reset
  const handleResetAssessment = async () => {
    console.log('Resetting assessment state');
    
    // Clear all state
    setMessages([]);
    setCurrentStep(null);
    setUserData({});
    setDashboardData(null);
    setShowDashboard(false);
    setShowAccountCreation(false);
    setShowReadinessReport(false);
    setShowStandaloneReport(false);
    
    // Reset the flag and fetch initial question
    initialQuestionFetchedRef.current = false;
    await fetchInitialQuestion();
  };
  
  // Effect for initial question fetch
  useEffect(() => {
    // Only fetch if not already fetched
    if (!initialQuestionFetchedRef.current) {
      initialQuestionFetchedRef.current = true;
      fetchInitialQuestion();
    }
    
    return () => {
      // Cleanup
    };
  }, []);
  
  // Effect for reset event listener
  useEffect(() => {
    // Add event listener for reset
    window.addEventListener('resetAssessment', handleResetAssessment);
    
    // Clean up
    return () => {
      window.removeEventListener('resetAssessment', handleResetAssessment);
    };
  }, []);
  
  // Handle user message submission
  const handleSubmit = async (message: string) => {
    if (!currentStep) return;
    
    // If user responds "yes" to summary step, show account creation dialog
    if (currentStep.id === 'summary' && 
        message.toLowerCase().includes('yes')) {
      console.log('User answered YES to summary step, showing account creation dialog');
      setShowAccountCreation(true);
      
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
      return;
    }
    
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
      console.log('Submitting response to step:', currentStep.id);
      console.log('Current userData:', userData);
      
      // Create a deep copy of userData to prevent modification issues
      const userDataCopy = JSON.parse(JSON.stringify(userData || {}));
      
      console.log(`Sending to backend - step_id: ${currentStep.id}, message: ${message.substring(0, 50)}...`);
      const response = await processAssessmentResponse(
        currentStep.id,
        message,
        userDataCopy
      );
      
      console.log('Backend response:', JSON.stringify(response, null, 2));
      
      // Validate response format to prevent errors
      if (!response || typeof response !== 'object') {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      // Check for required fields
      if (!response.next_step && !response.response) {
        console.error('Missing required fields in response:', response);
        throw new Error('Missing required fields in server response');
      }
      
      // Update user data but preserve our selectedMarkets if they exist
      setUserData(prevUserData => {
        const preservedSelectedMarkets = prevUserData.selectedMarkets;
        console.log('Preserved selected markets:', preservedSelectedMarkets);
        
        // Ensure response.user_data exists to prevent errors
        const responseUserData = response.user_data || {};
        console.log('Response user_data:', responseUserData);
        
        // Make sure responseUserData is not empty - if it is, keep the previous userData
        if (Object.keys(responseUserData).length === 0 && Object.keys(prevUserData).length > 0) {
          console.warn('Response user_data is empty but we have previous data - keeping previous data');
          
          // We'll merge the current userData with any new keys from response
          const newUserData = {
            ...prevUserData,
            ...(Object.keys(responseUserData).length > 0 ? responseUserData : {}),
          };
          
          console.log('Using previous userData with any new fields:', newUserData);
          return newUserData;
        }
        
        // Create new userData object from the response
        const newUserData = {
          ...responseUserData,
          // Preserve our selectedMarkets array if it exists
          ...(preservedSelectedMarkets && { selectedMarkets: preservedSelectedMarkets })
        };
        
        console.log('Updated userData:', newUserData);
        
        // If business_name has been extracted, update dashboard data
        if (newUserData.business_name || prevUserData.business_name) {
          console.log('Business name detected, updating dashboard data');
          createDashboardDataFromUserData(newUserData);
        }
        
        return newUserData;
      });
      
      // For market selection step, we need to keep track of the options
      let marketOptions: MarketOption[] = [];
      let nextStepType: 'text' | 'market_selection' | 'final' = 'text';
      
      if (response.next_step && typeof response.next_step === 'object') {
        console.log('Complex next_step object:', response.next_step);
        
        if (response.next_step.type === 'market_selection') {
          nextStepType = 'market_selection';
          
          // Get market options from the response
          marketOptions = response.next_step.marketOptions || response.next_step.market_options || [];
          console.log('Market options:', marketOptions);
          
          // Add assistant message with market options
          const marketSelectionMessage = {
            role: 'assistant' as const,
            content: response.response || response.next_step.prompt || 'Please select your target markets:',
            timestamp: Date.now(),
            metadata: {
              step: 'target_markets',
              marketOptions
            }
          };
          
          setMessages(prev => [...prev, marketSelectionMessage]);
        } else {
          // Add normal assistant response for non-market selection steps
          const assistantMessage = {
            role: 'assistant' as const,
            content: response.response || '',
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        // Simple next_step (string ID)
        // Add assistant response
        const assistantMessage = {
          role: 'assistant' as const,
          content: response.response || '',
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      // Set the new current step
      const nextStepId = typeof response.next_step === 'object' 
        ? response.next_step.id 
        : (response.next_step || 'unknown');
        
      const nextPrompt = typeof response.next_step === 'object'
        ? response.next_step.prompt
        : response.response || '';
      
      // Show the readiness report if we've reached the final step
      if (nextStepId === 'final') {
        console.log('Final step reached, showing readiness report');
        setShowReadinessReport(true);
      }
      
      setCurrentStep({
        id: nextStepId,
        prompt: nextPrompt,
        type: nextStepType
      });
      
      // Set typing to false after the response is processed
      setIsTyping(false);
      
      // Focus the input field after the response
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Error processing response:', error);
      
      // Add an error message to the chat
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error processing your request. Please try again.",
          timestamp: Date.now()
        }
      ]);
      
      // Set typing to false after error
      setIsTyping(false);
    }
  };
  
  // Get dropdown options for market selection
  const getDropdownOptions = () => {
    // Return empty array to prevent dropdown from showing
    return [];
  };
  
  // Handle market selection submission
  const handleMarketsSubmit = (selectedMarkets: string[]) => {
    if (!currentStep) return;
    
    console.log("Original selected markets:", selectedMarkets);
    
    // Make sure all our target markets are represented
    const targetMarkets = ["United Kingdom", "United Arab Emirates", "United States"];
    
    // If United States is selected but not in the proper format, add the proper format
    if (selectedMarkets.some(m => m.toLowerCase().includes("united states") || m.toLowerCase() === "usa") && 
        !selectedMarkets.includes("United States")) {
      console.log("Adding 'United States' to selected markets");
      selectedMarkets.push("United States");
    }
    
    console.log("Final selected markets:", selectedMarkets);
    
    // First, add the user's selection as a message
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: `I'm interested in exploring: ${selectedMarkets.join(', ')}`,
        timestamp: Date.now()
      }
    ]);
    
    // Store the selected markets in userData directly - using both naming conventions for compatibility
    setUserData(prev => {
      const updatedUserData = {
        ...prev,
        selectedMarkets: selectedMarkets, // Store as array
        selected_markets: selectedMarkets.join(', ') // Store as comma-separated string
      };
      
      // Create dashboard data from the updated user data
      createDashboardDataFromUserData(updatedUserData);
      
      return updatedUserData;
    });
    
    // Then process the response
    handleSubmit(selectedMarkets.join(', '));
  };
  
  // Create dashboard data from user data
  const createDashboardDataFromUserData = (updatedUserData: Record<string, any>) => {
    console.log("Creating dashboard data from user data:", updatedUserData);
    
    // Get business name from user data
    const businessName = updatedUserData.business_name?.text || 
                          updatedUserData.business_name || 
                          "Unknown Business";
                          
    console.log("Using business name for dashboard:", businessName);
    
    // Save userData to localStorage for use by the dashboard
    try {
      localStorage.setItem('assessmentUserData', JSON.stringify(updatedUserData));
      console.log("Saved assessment data to localStorage");
    } catch (e) {
      console.error("Error saving assessment data to localStorage:", e);
    }
    
    // Get selected markets
    const selectedMarketsArray = Array.isArray(updatedUserData.selectedMarkets) 
      ? updatedUserData.selectedMarkets 
      : (updatedUserData.selected_markets || "").split(",").map((m: string) => m.trim()).filter(Boolean);
    
    // Create dashboard data structure
    const newDashboardData = {
      business_profile: {
        name: businessName,
        products: {
          categories: updatedUserData.products?.categories || ['Products'],
          items: updatedUserData.products?.items || ['Items'],
          confidence: 90
        },
        current_markets: {
          countries: updatedUserData.current_markets?.countries || ['South Africa'],
          confidence: 85
        },
        certifications: {
          items: updatedUserData.certifications?.items || [],
          confidence: 80
        },
        business_details: {
          founded: updatedUserData.business_details?.founded || new Date().getFullYear() - 5,
          employees: updatedUserData.business_details?.employees || 20,
          annual_revenue: updatedUserData.business_details?.annual_revenue || 'Unknown',
          export_experience: updatedUserData.export_experience || 'Beginner',
          confidence: 95
        }
      },
      selected_markets: selectedMarketsArray,
      export_readiness: {
        overall_score: 42,
        market_intelligence: 65,
        regulatory_compliance: 35,
        export_operations: 25
      }
    };
    
    console.log("Created dashboard data:", newDashboardData);
    setDashboardData(newDashboardData);
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
    
    // Show the readiness report
    console.log('Account created successfully, showing readiness report');
    setShowReadinessReport(true);
    
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
    
    // Navigate to the dashboard tab
    setShowDashboard(false);
    
    // Use localStorage to update the active tab
    localStorage.setItem('activeTab', 'dashboard');
    
    // Create and dispatch a custom event to notify the App component
    const navigateToDashboardEvent = new CustomEvent('navigateToDashboard');
    window.dispatchEvent(navigateToDashboardEvent);
    
    // Force navigation to dashboard by directly updating the DOM
    const dashboardTab = document.querySelector('.dashboard-tab');
    if (dashboardTab) {
      (dashboardTab as HTMLElement).click();
    }
    
    // For demo purposes, simulate a user being authenticated
    // This will help ensure the dashboard is shown
    localStorage.setItem('isAuthenticated', 'true');
    
    // As a fallback, also try to navigate using window.location
    setTimeout(() => {
      // Check if we're still not on the dashboard
      if (localStorage.getItem('activeTab') === 'dashboard' && !document.querySelector('.dashboard-tab.active')) {
        // Force reload the page with dashboard as the active tab
        window.location.href = window.location.origin + '?tab=dashboard';
      }
    }, 500);
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
    if (currentStep?.type === 'market_selection') return "You can select markets above or type your preferences here...";
    return "Type your message...";
  };
  
  const renderMessages = () => {
    try {
      return messages.map((message, index) => {
        if (!message || !message.role) {
          console.error('Invalid message format:', message);
          return null; // Skip rendering invalid messages
        }
        
        const isLastMessage = index === messages.length - 1;
        const showMarketSelection = 
          message.role === 'assistant' && 
          message.metadata?.step === 'target_markets' && 
          isLastMessage;
          
        // Handle the content safely
        const messageContent = message.content || '';
        const paragraphs = typeof messageContent === 'string' 
          ? messageContent.split('\n\n') 
          : ['[No content]'];
        
        return (
          <div key={message.timestamp || index} className={`message-wrapper ${message.role}-wrapper`}>
            <div className={`message ${message.role}-message`}>
              <div className="message-text">
                {paragraphs.map((paragraph, i) => (
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
             ((currentStep?.id === 'summary' && isLastMessage && !accountCreated) || 
              (message.content?.includes('Would you like to create an account') && !accountCreated)) && (
              <div className="create-account-button-container">
                <button 
                  className="create-account-button"
                  onClick={() => setShowAccountCreation(true)}
                >
                  Create account and access your report
                </button>
              </div>
            )}
            
            {/* Render view report button if account has been created */}
            {message.role === 'assistant' && 
             message.content?.includes('Account created successfully') && 
             accountCreated && (
              <div className="view-report-button-container">
                <button 
                  className="view-report-button"
                  onClick={() => setShowReadinessReport(true)}
                >
                  View your export readiness report
                </button>
              </div>
            )}
          </div>
        );
      });
    } catch (error) {
      console.error('Error rendering messages:', error);
      return (
        <div className="error-message">
          There was an error displaying messages. 
          <button onClick={handleResetAssessment}>Reset Assessment</button>
        </div>
      );
    }
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
              disableInput={!currentStep || currentStep.type === 'final' || showDashboard}
              dropdownOptions={[]}
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
        <div className="report-modal-container" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <ExportReadinessReport
            userData={{
              companyName: userData.business_name || 'Your Company',
              selectedMarkets: userData.selectedMarkets || (userData.selected_markets ? userData.selected_markets.split(',').map((m: string) => m.trim()) : []),
              products: userData.products?.items || [],
              ...userData  // Pass the full userData object as well
            }}
            onClose={handleCloseReport}
            onGoToDashboard={handleGoToDashboard}
          />
        </div>
      )}
    </div>
  );
};

export default InitialAssessmentFlow; 