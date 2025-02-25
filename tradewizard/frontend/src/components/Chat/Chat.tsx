import React from 'react';
import { startChat, sendChatMessage, ChatResponse } from '../../services/api';
import { BusinessVerificationForm } from '../Assessment/BusinessVerificationForm';
import './Chat.css';

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
    const { current_step, completed_steps, progress, extracted_info } = response.response;
    
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
        ...extracted_info
      }
    }));

    // Check for transitions based on current step
    if (current_step === 'STEP_4_BUSINESS_VERIFICATION') {
      setShowVerificationForm(true);
    }
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
