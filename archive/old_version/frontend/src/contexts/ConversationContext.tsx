import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Message {
  id: string;
  type: 'system' | 'user' | 'response' | 'error';
  content: string;
  timestamp: Date;
}

interface ConversationState {
  messages: Message[];
  isTyping: boolean;
  currentStep: 'welcome' | 'business' | 'tax' | 'contact' | 'summary';
}

type ConversationAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_STEP'; payload: ConversationState['currentStep'] }
  | { type: 'RESET' };

const initialState: ConversationState = {
  messages: [
    {
      id: '1',
      type: 'system',
      content: 'Welcome to the Business Verification Portal! I\'ll help you verify your business information. Shall we begin with your company registration details?',
      timestamp: new Date()
    }
  ],
  isTyping: false,
  currentStep: 'welcome'
};

const conversationReducer = (
  state: ConversationState,
  action: ConversationAction
): ConversationState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload
      };
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const ConversationContext = createContext<{
  state: ConversationState;
  dispatch: React.Dispatch<ConversationAction>;
} | null>(null);

export const ConversationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(conversationReducer, initialState);

  return (
    <ConversationContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}; 