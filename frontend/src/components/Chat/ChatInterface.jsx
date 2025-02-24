import React, { useState, useRef, useEffect } from 'react';
import { assessmentApi } from '../../services/api';
import { Spinner } from '../common/Spinner';
import ChecklistQuestion from './ChecklistQuestion';
import { BusinessValidationForm } from '../BusinessValidation/BusinessValidationForm';
import { useAssessmentContext } from '../../contexts/AssessmentContext';

const INITIAL_GREETING = {
  role: 'assistant',
  content: 'Hi there! I\'m Sarah, your export readiness consultant. I\'m here to help evaluate your business\'s export potential. First, let\'s verify your business details.'
};

// Technical checklist categories
const CHECKLIST_CATEGORIES = {
  'registration_and_permits': {
    'title': 'Business Registration & Export Permits',
    'items': {
      'cipc_registration': {
        'priority': 'High',
        'required': true,
        'description': 'CIPC Registration',
        'info': 'Companies and Intellectual Property Commission registration document'
      },
      'tax_clearance': {
        'priority': 'High',
        'required': true,
        'description': 'Tax Clearance Certificate',
        'info': 'Valid tax clearance certificate from SARS'
      },
      'bank_account': {
        'priority': 'High',
        'required': true,
        'description': 'Business Bank Account',
        'info': 'Active business bank account in company name'
      },
      'sars_exporter': {
        'priority': 'High',
        'required': true,
        'description': 'SARS Exporter Number',
        'info': 'South African Revenue Service exporter registration number'
      },
      'sars_customs': {
        'priority': 'High',
        'required': true,
        'description': 'SARS Customs Code',
        'info': 'Customs client code from SARS'
      },
      'itac_registration': {
        'priority': 'High',
        'required': true,
        'description': 'ITAC Registration',
        'info': 'International Trade Administration Commission registration'
      }
    }
  },
  'documentation_and_compliance': {
    'title': 'Documentation & Compliance',
    'items': {
      'tech_specs': {
        'priority': 'High',
        'required': true,
        'description': 'Technical Specifications',
        'info': 'Detailed technical specifications of your product'
      },
      'safety_docs': {
        'priority': 'High',
        'required': true,
        'description': 'Safety Documentation',
        'info': 'Safety compliance documentation and certifications'
      },
      'quality_cert': {
        'priority': 'High',
        'required': true,
        'description': 'Quality Certifications',
        'info': 'Product quality certifications and standards compliance'
      },
      'quality_system': {
        'priority': 'High',
        'required': true,
        'description': 'Quality Management System',
        'info': 'Documented quality management system and processes'
      },
      'testing_process': {
        'priority': 'High',
        'required': true,
        'description': 'Product Testing Process',
        'info': 'Documented product testing and validation procedures'
      }
    }
  }
};

// Add ENTITY_TYPE_PATTERNS at the top with other constants
const ENTITY_TYPE_PATTERNS = {
  PTY_LTD: /\b(pty\.?\s*ltd\.?|proprietary\s+limited)\b/i,
  CC: /\b(cc|close\s+corporation)\b/i,
  INC: /\b(inc|incorporated)\b/i,
  LTD: /\b(ltd\.?|limited)\b/i,
};

// Replace the existing INDUSTRY_SECTORS constant with this hierarchical structure
const INDUSTRY_SECTORS = {
  'FOOD_PRODUCTS': {
    label: 'Food Products',
    subcategories: {
      'PROCESSED_FOODS': 'Processed Foods',
      'FRESH_PRODUCE': 'Fresh Produce'
    }
  },
  'BEVERAGES': {
    label: 'Beverages',
    subcategories: {
      'ALCOHOLIC': 'Alcoholic Beverages',
      'NON_ALCOHOLIC': 'Non-alcoholic Beverages'
    }
  },
  'READY_TO_WEAR': {
    label: 'Ready-to-Wear',
    subcategories: {
      'APPAREL': 'Apparel',
      'JEWELLERY': 'Jewellery'
    }
  },
  'HOME_GOODS': {
    label: 'Home Goods',
    subcategories: {
      'LEATHER_GOODS': 'Leather Goods',
      'GIFTING': 'Gifting',
      'DECOR': 'Decor'
    }
  },
  'NON_PRESCRIPTION_HEALTH': {
    label: 'Non-Prescription Health',
    subcategories: {
      'BEAUTY': 'Beauty Products',
      'OTC_HEALTH': 'Over-the-counter Health',
      'WELLNESS': 'Wellness Products',
      'VITAMINS': 'Vitamin Products'
    }
  }
};

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showValidationForm, setShowValidationForm] = useState(false);
  const [requiresAction, setRequiresAction] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [currentChecklist, setCurrentChecklist] = useState(null);
  const { isAssessmentComplete, setAssessmentComplete, setBusinessData } = useAssessmentContext();
  const [selectedMainSector, setSelectedMainSector] = useState(null);

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        const response = await assessmentApi.startSession();
        console.log('Session initialized:', response);
        setMessages([{ role: 'assistant', content: response.message }]);
        setLastResponse(response);
        setRequiresAction(response.requires_action);
        setActionType(response.action_type);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        setMessages([{ 
          role: 'assistant', 
          content: 'Sorry, I encountered an error initializing the session. Please refresh the page.' 
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []);

  const handleStartAssessment = async () => {
    try {
      setIsLoading(true);
      // Remove the initial greeting message
      setMessages([]);
      const response = await assessmentApi.startQuestions();
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
      setLastResponse(response);
      setRequiresAction(false);
      setActionType(null);
      // Focus the input field after starting
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100); // Small delay to ensure DOM is updated
    } catch (error) {
      console.error('Failed to start assessment:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error starting the assessment. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isChecklistQuestion = (question) => {
    return question && (
      question.toLowerCase().includes('registration') ||
      question.toLowerCase().includes('documentation') ||
      question.toLowerCase().includes('certificates') ||
      question.toLowerCase().includes('technical requirements')
    );
  };

  const handleChecklistSubmit = async (response) => {
    setCurrentChecklist(null);
    await handleSubmit(null, response);
  };

  // Handle the transition to business validation
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content === 'No more questions.') {
        // Replace "No more questions" with a transition message
        setMessages(messages => [
          ...messages.slice(0, -1),
          {
            role: 'assistant',
            content: 'Thank you for providing those details. Now, let\'s validate your business information to proceed with the assessment.'
          }
        ]);
        setShowValidationForm(true);
      }
    }
  }, [messages]);

  // Update the handleIndustrySectorSelect to handle both sector and subsector
  const handleIndustrySectorSelect = async (mainSector, subSector) => {
    try {
      setIsLoading(true);
      const sectorData = {
        mainSector,
        subSector,
        mainSectorLabel: INDUSTRY_SECTORS[mainSector].label,
        subSectorLabel: INDUSTRY_SECTORS[mainSector].subcategories[subSector]
      };
      
      // Update business data in context with sector information
      setBusinessData(prev => ({
        ...(prev || {}),
        sector: sectorData.mainSectorLabel,
        subcategory: sectorData.subSectorLabel
      }));
      
      const response = await assessmentApi.sendMessage(
        `${sectorData.mainSectorLabel} - ${sectorData.subSectorLabel}`,
        { industrySector: sectorData }
      );
      
      setMessages(prev => [...prev, 
        { role: 'user', content: `${sectorData.mainSectorLabel} - ${sectorData.subSectorLabel}` },
        { role: 'assistant', content: response.message }
      ]);
      setLastResponse(response);
      setSelectedMainSector(null);
    } catch (error) {
      console.error('Error handling industry sector:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your industry sector. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e, checklistResponse = null) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !checklistResponse) || isLoading || !isInitialized) return;

    const userMessage = { 
      role: 'user', 
      content: checklistResponse || input.trim() 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response;
      // Check if this message contains business name
      const businessNameMatch = userMessage.content.match(/.*COO of (.*)/i);
      
      if (businessNameMatch) {
        const companyName = businessNameMatch[1].trim();
        
        // Check for entity type in the business name
        const detectedEntityType = Object.entries(ENTITY_TYPE_PATTERNS).find(([_, pattern]) => 
          pattern.test(companyName)
        )?.[0];

        // Store company name and entity type
        const businessData = {
          company_name: companyName,
          entityType: detectedEntityType || null
        };
        
        setBusinessData(businessData);

        // First get the initial response
        response = await assessmentApi.sendMessage(userMessage.content, businessData);
        setLastResponse(response);
        
        // Add the initial response
        setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);

        // If we detected an entity type and the next question is about entity type
        if (detectedEntityType && response.message.toLowerCase().includes('what type of business entity')) {
          try {
            // Add a slight delay to ensure messages are processed in order
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Format entity type for display (e.g., "PTY_LTD" -> "Pty Ltd")
            const displayEntityType = detectedEntityType.split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            
            // Send the entity type as an automatic response
            setMessages(prev => [...prev, { role: 'user', content: displayEntityType }]);
            
            response = await assessmentApi.sendMessage(detectedEntityType, businessData);
            setLastResponse(response);
            setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
          } catch (entityError) {
            console.error('Error handling entity type:', entityError);
            // If entity type handling fails, let the user answer manually
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: 'I encountered an error processing the business type. Please specify your business type manually.' 
            }]);
          }
        }
      } else {
        // Regular message handling
        response = await assessmentApi.sendMessage(userMessage.content);
        setLastResponse(response);
        if (response?.message) {
          setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
        }
      }

      // Focus the input field after response
      if (inputRef.current) {
        inputRef.current.focus();
      }

      // Handle transition to validation form
      if (response?.message === 'No more questions.') {
        setRequiresAction(false);
        setActionType(null);
      }

      // Scroll to bottom after new messages
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle validation form completion
  const handleValidationComplete = async (validatedData) => {
    console.log('Validation complete with data:', validatedData);
    setShowValidationForm(false);
    setAssessmentComplete(true);
    
    try {
      // Add completion message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Great! Your business details have been validated. Starting the export readiness assessment...'
      }]);

      // Start the actual assessment
      const response = await assessmentApi.startAssessment(validatedData);
      
      // Add the first assessment question
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message
      }]);

      // Focus the input field for the first assessment question
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error starting assessment:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error starting the assessment. Please try again.'
      }]);
    }
  };

  const isIndustrySectorQuestion = (message) => {
    if (!message) return false;
    return message.toLowerCase().includes('industry sector') || 
           message.toLowerCase().includes('what industry');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4" ref={messagesContainerRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-3/4 rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <Spinner />
              </div>
            </div>
          )}
        </div>
      </div>

      {showValidationForm ? (
        <div className="p-4 border-t">
          <BusinessValidationForm onValidationComplete={handleValidationComplete} />
        </div>
      ) : (
        <>
          {requiresAction && actionType === 'start_assessment' ? (
            <div className="p-4 border-t">
              <button
                onClick={handleStartAssessment}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                disabled={isLoading}
              >
                Start Assessment
              </button>
            </div>
          ) : (
            <>
              {!currentChecklist && !isIndustrySectorQuestion(lastResponse?.message) && (
                <form onSubmit={handleSubmit} className="p-4 border-t">
                  <div className="flex space-x-4">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading || currentChecklist || showValidationForm}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim() || currentChecklist || showValidationForm}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </>
      )}

      {currentChecklist && (
        <div className="p-4 border-t">
          <ChecklistQuestion
            category={CHECKLIST_CATEGORIES[currentChecklist].title}
            items={CHECKLIST_CATEGORIES[currentChecklist].items}
            onSubmit={handleChecklistSubmit}
          />
        </div>
      )}

      {!currentChecklist && lastResponse?.message && isIndustrySectorQuestion(lastResponse.message) && (
        <div className="p-4 border-t">
          <div className="space-y-4">
            {/* Main sector selection */}
            {!selectedMainSector && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Select your main sector:</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(INDUSTRY_SECTORS).map(([key, { label }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedMainSector(key)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      disabled={isLoading}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Subcategory selection */}
            {selectedMainSector && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Select your subcategory in {INDUSTRY_SECTORS[selectedMainSector].label}:</h3>
                  <button
                    onClick={() => setSelectedMainSector(null)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    (Change main sector)
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(INDUSTRY_SECTORS[selectedMainSector].subcategories).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => handleIndustrySectorSelect(selectedMainSector, key)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      disabled={isLoading}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatInterface; 