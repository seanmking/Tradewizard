import React, { useState, useEffect, useRef } from 'react';
import { useConversation } from '../contexts/ConversationContext';
import { useVerification } from '../contexts/VerificationContext';
import { verificationService } from '../services/verificationService';

const ConversationalVerification: React.FC = () => {
  const { state: conversationState, dispatch: conversationDispatch } = useConversation();
  const { state: verificationState, dispatch: verificationDispatch } = useVerification();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationState.messages]);

  const addMessage = (content: string, type: 'user' | 'system' | 'response' | 'error') => {
    conversationDispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: Date.now().toString(),
        type,
        content,
        timestamp: new Date()
      }
    });
  };

  const simulateTyping = async () => {
    conversationDispatch({ type: 'SET_TYPING', payload: true });
    await new Promise(resolve => setTimeout(resolve, 1000));
    conversationDispatch({ type: 'SET_TYPING', payload: false });
  };

  const handleBusinessVerification = async (registrationNumber: string) => {
    try {
      addMessage(`Verifying business registration number: ${registrationNumber}...`, 'system');
      await simulateTyping();
      
      const result = await verificationService.verifyBusiness(registrationNumber);
      verificationDispatch({ type: 'SET_BUSINESS_VERIFICATION', payload: result });

      if (result.isValid) {
        const company = result.details;
        addMessage(
          `Great! I've found Global Fresh SA's details:\n` +
          `• Company Name: ${company.companyName}\n` +
          `• Registration Date: ${company.registrationDate}\n` +
          `• Status: ${company.status}\n\n` +
          `Would you like to proceed with tax compliance verification?`,
          'response'
        );
        conversationDispatch({ type: 'SET_STEP', payload: 'tax' });
      } else {
        addMessage(result.errors?.[0].message || 'Verification failed', 'error');
      }
    } catch (error) {
      addMessage('Sorry, there was an error verifying your business details.', 'error');
    }
  };

  const handleTaxVerification = async (taxNumber: string) => {
    try {
      addMessage(`Checking tax compliance for number: ${taxNumber}...`, 'system');
      await simulateTyping();
      
      const result = await verificationService.verifyTax(taxNumber);
      verificationDispatch({ type: 'SET_TAX_VERIFICATION', payload: result });

      if (result.isValid) {
        addMessage(
          `Excellent! Your tax compliance is confirmed:\n` +
          `• Tax Compliance: Valid\n` +
          `• VAT Registration: Active\n` +
          `• Last Filing: ${result.details.lastFilingDate}\n\n` +
          `Shall we verify your contact details next?`,
          'response'
        );
        conversationDispatch({ type: 'SET_STEP', payload: 'contact' });
      } else {
        addMessage(result.errors?.[0].message || 'Tax verification failed', 'error');
      }
    } catch (error) {
      addMessage('Sorry, there was an error checking your tax compliance.', 'error');
    }
  };

  const handleContactVerification = async (input: string) => {
    try {
      const [email, phone] = input.split(',').map(s => s.trim());
      addMessage(`Verifying contact details...`, 'system');
      await simulateTyping();
      
      const result = await verificationService.verifyContact({ email, phone });
      verificationDispatch({ type: 'SET_CONTACT_VERIFICATION', payload: result });

      if (result.isValid) {
        addMessage(
          `Perfect! Your contact details have been verified.\n` +
          `I'll now prepare a complete summary of your business profile.`,
          'response'
        );
        conversationDispatch({ type: 'SET_STEP', payload: 'summary' });
      } else {
        const errorMessages = result.errors?.map(e => e.message).join('\n');
        addMessage(errorMessages || 'Contact verification failed', 'error');
      }
    } catch (error) {
      addMessage('Sorry, there was an error verifying your contact details.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userInput = input.trim();
    addMessage(userInput, 'user');
    setInput('');

    switch (conversationState.currentStep) {
      case 'welcome':
        conversationDispatch({ type: 'SET_STEP', payload: 'business' });
        addMessage(
          'Please provide your company registration number (e.g., 2018/123456/07)',
          'system'
        );
        break;
      case 'business':
        await handleBusinessVerification(userInput);
        break;
      case 'tax':
        await handleTaxVerification(userInput);
        break;
      case 'contact':
        await handleContactVerification(userInput);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationState.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'error'
                  ? 'bg-red-100 text-red-700'
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
            </div>
          </div>
        ))}
        {conversationState.isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              conversationState.currentStep === 'business'
                ? "Enter company registration number..."
                : conversationState.currentStep === 'tax'
                ? "Enter tax reference number..."
                : conversationState.currentStep === 'contact'
                ? "Enter email, phone (comma-separated)..."
                : "Type your response..."
            }
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConversationalVerification; 