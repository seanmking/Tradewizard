import React, { useState, useRef, useEffect } from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { businessInfo, validateField, nextStep } = useAssessment();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Process user input and get response
      const response = await validateField('user_input', input);
      
      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message ?? 'I understand. Let me process that information.'
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Move to next step if validation passed
      if (response.is_valid) {
        await nextStep();
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    }
  };

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface; 