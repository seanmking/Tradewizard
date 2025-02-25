import React from 'react';
import { startChat, sendChatMessage, getChatHistory } from '../services/api';
import './Chat.css';

interface ChatProps {
  businessContext: {
    business_name: string;
    contact_name: string;
    contact_role: string;
    industry: string;
    website: string;
    company_profile: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const TypingIndicator = () => (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

const Chat = ({ businessContext }: ChatProps) => {
  const [messages, setMessages] = React.useState([] as Message[]);
  const [input, setInput] = React.useState('');
  const [chatId, setChatId] = React.useState(null as string | null);
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session
  React.useEffect(() => {
    const initChat = async () => {
      try {
        const session = await startChat(businessContext);
        setChatId(session.chat_id);
        setMessages(session.messages);
      } catch (error) {
        console.error('Failed to start chat:', error);
        // Handle error appropriately
      }
    };

    initChat();
  }, [businessContext]);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!input.trim() || !chatId || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Add user message immediately
      setMessages(prev => [...prev, {
        role: 'user',
        content: userMessage,
        timestamp: Date.now()
      }]);

      // Send message to backend
      const response = await sendChatMessage(chatId, userMessage);
      
      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Export Assessment Chat</h2>
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '30%' }}></div>
          </div>
          <div className="progress-label">Assessment Progress: 30%</div>
        </div>
      </div>

      <div className="messages-container">
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            rows={3}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
