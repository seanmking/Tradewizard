import React, { useState, useRef, useEffect } from 'react';
import { assessmentApi } from '../../services/api';
import { Spinner } from '../common/Spinner';
import ChecklistQuestion from './ChecklistQuestion';

const INITIAL_GREETING = {
  role: 'assistant',
  content: 'Hello! I am your AI assistant. How can I help you today?'
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

function ChatInterface() {
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [currentChecklist, setCurrentChecklist] = useState(null);

  // Improved scroll behavior
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  };

  // Focus input after loading ends
  useEffect(() => {
    if (!isLoading && inputRef.current && isInitialized) {
      inputRef.current.focus();
    }
  }, [isLoading, isInitialized]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize session when component mounts
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        const response = await assessmentApi.startSession();
        console.log('Session initialized:', response);
        setIsInitialized(true);
        if (response.question) {
          setMessages([{ role: 'assistant', content: response.question }]);
        }
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
      const response = await assessmentApi.sendMessage(userMessage.content);
      console.log('Message response:', response);
      
      const message = { 
        role: 'assistant', 
        content: response.message 
      };
      
      setMessages(prev => [...prev, message]);

      // Check if the next question is a checklist question
      if (isChecklistQuestion(response.message)) {
        if (response.message.toLowerCase().includes('business registration') || 
            response.message.toLowerCase().includes('export registration')) {
          setCurrentChecklist('registration_and_permits');
        } else if (response.message.toLowerCase().includes('documentation') || 
                   response.message.toLowerCase().includes('quality')) {
          setCurrentChecklist('documentation_and_compliance');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.message === 'Invalid session') {
        // Reinitialize session
        try {
          const response = await assessmentApi.startSession();
          setMessages([{ role: 'assistant', content: response.question }]);
        } catch (sessionError) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Sorry, I encountered an error. Please refresh the page to start over.' 
          }]);
        }
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.' 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-container">
        <div ref={messagesContainerRef} className="messages-wrapper">
          <div className="messages-content">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${
                  message.role === 'user' ? 'user-message' : 'assistant-message'
                }`}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="message assistant-message loading">
                <Spinner />
              </div>
            )}
            {currentChecklist && (
              <ChecklistQuestion
                category={CHECKLIST_CATEGORIES[currentChecklist].title}
                items={CHECKLIST_CATEGORIES[currentChecklist].items}
                onSubmit={handleChecklistSubmit}
              />
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading || currentChecklist}
            className="message-input"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || currentChecklist}
            id="send-button"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface; 