import React, { useState, useRef, useEffect } from 'react';
import { assessmentApi } from '../../services/api';
import { Spinner } from '../common/Spinner';
import ChecklistQuestion from './ChecklistQuestion';
import { BusinessValidationForm } from '../BusinessValidation/BusinessValidationForm';
import { useAssessmentContext } from '../../contexts/AssessmentContext';

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
  const [businessContext, setBusinessContext] = useState({});
  const [currentChecklist, setCurrentChecklist] = useState(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const { isAssessmentComplete, setAssessmentComplete, setBusinessData } = useAssessmentContext();
  const [selectedMainSector, setSelectedMainSector] = useState(null);

  // Handle the transition to business validation
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant' && lastMessage?.content && 
          (lastMessage.content === 'No more questions.' || 
           lastMessage.content.includes('Thank you for completing the initial assessment'))) {
        // Replace with transition message
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

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        const response = await assessmentApi.startSession();
        if (response.error) {
          setMessages([{ 
            role: 'assistant', 
            content: 'Sorry, there was an error starting the session. Please refresh the page to try again.' 
          }]);
          return;
        }
        setMessages([{ role: 'assistant', content: response.message }]);
        setLastResponse(response);
        setIsInitialized(true);
        // Set action requirements from response
        setRequiresAction(response.requires_action || false);
        setActionType(response.action_type || null);
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
      const response = await assessmentApi.startQuestions();
      setMessages([{ role: 'assistant', content: response.message }]);
      setLastResponse(response);
      setRequiresAction(false);
      setActionType(null);
      
      // Focus the input field after starting
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Failed to start assessment:', error);
      setMessages([{ 
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

  // Add effect for input focus
  useEffect(() => {
    if (inputRef.current && !showValidationForm && !requiresAction) {
      inputRef.current.focus();
    }
  }, [messages, showValidationForm, requiresAction]);

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

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() && !e?.skipInputCheck) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Add a natural delay (1-2 seconds)
      await delay(Math.random() * 1000 + 1000);

      // Handle normal response
      const response = await assessmentApi.respond({
        message: userMessage,
        context: businessContext
      });

      if (response.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, there was an error processing your message. Please refresh the page to start a new session.' 
        }]);
        return;
      }

      // Update business context with extracted information
      if (response.extracted_info) {
        const newContext = {
          ...businessContext,
          ...response.extracted_info
        };
        setBusinessContext(newContext);
        
        // If we have export goals, prepare for validation with a proper transition
        if (response.complete || newContext.export_goals) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: response.message }
          ]);
          setRequiresAction(true);
          setActionType('show_validation');
          return;
        }
      }

      // Add assistant's response to chat
      await delay(Math.random() * 500 + 500); // Additional small delay for typing effect
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
      setLastResponse(response);

    } catch (error) {
      console.error('Failed to get response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your response. Please refresh the page to start a new session.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowValidation = () => {
    setShowValidationForm(true);
    setRequiresAction(false);
    setActionType(null);
    setBusinessData(businessContext);
  };

  // Handle validation form completion
  const handleValidationComplete = async (validatedData) => {
    console.log('Validation complete with data:', validatedData);
    setShowValidationForm(false);
    setAssessmentComplete(true);
    
    try {
      // Update business context with validated data
      const updatedContext = {
        ...businessContext,
        ...validatedData
      };
      setBusinessContext(updatedContext);
      
      // Start the assessment with complete business data
      const response = await assessmentApi.startAssessment({
        business_data: updatedContext
      });
      
      if (response.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, there was an error starting the assessment. Please try refreshing the page.'
        }]);
        return;
      }
      
      // Add transition message and first assessment question
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Perfect! Your business details have been validated. Let\'s begin your export readiness assessment.'
        },
        {
          role: 'assistant',
          content: response.message
        }
      ]);

      // Reset states for new phase
      setRequiresAction(false);
      setActionType(null);
      setLastResponse(response);

      // Focus input for next interaction
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error starting the assessment. Please refresh the page to try again.'
      }]);
    }
  };

  const isIndustrySectorQuestion = (message) => {
    if (!message) return false;
    return message.toLowerCase().includes('industry sector') || 
           message.toLowerCase().includes('what industry');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 p-4">
        {requiresAction && actionType === 'show_validation' ? (
          <button
            onClick={handleShowValidation}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Proceed with Business Validation
          </button>
        ) : requiresAction && actionType === 'start_assessment' ? (
          <button
            onClick={handleStartAssessment}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Assessment
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || showValidationForm}
              ref={inputRef}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || showValidationForm}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        )}
      </div>

      {showValidationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <BusinessValidationForm 
              onValidationComplete={handleValidationComplete}
              initialData={businessContext}
            />
          </div>
        </div>
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