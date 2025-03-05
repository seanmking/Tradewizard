import React, { useEffect, useRef, useState } from 'react';
import './Chat.css';

export interface DropdownOption {
  id: string;
  label: string;
  value: string;
}

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  disableInput?: boolean;
  dropdownOptions?: DropdownOption[];
  dropdownPlaceholder?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSubmit, 
  isLoading, 
  disableInput = false,
  dropdownOptions = [],
  dropdownPlaceholder = "Select an option...",
  inputRef
}) => {
  const [input, setInput] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const defaultInputRef = useRef<HTMLTextAreaElement>(null);
  const actualInputRef = inputRef || defaultInputRef;
  const prevLoadingRef = useRef(isLoading);

  // Focus on mount
  useEffect(() => {
    if (actualInputRef.current) {
      actualInputRef.current.focus();
    }
  }, []);
  
  // Focus after loading state changes (message sent)
  useEffect(() => {
    if (prevLoadingRef.current === true && isLoading === false) {
      setTimeout(() => {
        if (actualInputRef.current) {
          actualInputRef.current.focus();
        }
      }, 100);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  // Auto-resize textarea based on content
  const handleResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height based on scrollHeight, capped at max height (8 lines ≈ 200px)
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
    
    // Update input state
    setInput(textarea.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (dropdownOptions.length > 0 && selectedOption) {
      onSubmit(selectedOption);
      setSelectedOption('');
      return;
    }
    
    if (!input.trim() || isLoading || disableInput) return;
    onSubmit(input.trim());
    setInput('');
    
    // Reset textarea height after submission
    if (actualInputRef.current) {
      actualInputRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(e.target.value);
  };

  return (
    <div className="chat-input">
      <form onSubmit={handleSubmit}>
        <textarea
          ref={actualInputRef}
          value={input}
          onChange={handleResize}
          onKeyPress={handleKeyPress}
          placeholder={disableInput ? "Please use the selection options above..." : "Type your message..."}
          disabled={isLoading || disableInput}
          rows={1}
          style={{
            minHeight: '40px',
            maxHeight: '200px', // Height for approximately 8 lines
            overflowY: 'auto', // Add scrollbar when content exceeds height
            resize: 'none' // Prevent manual resizing
          }}
        />
        <button 
          type="submit" 
          disabled={isLoading || disableInput || !input.trim()} 
          aria-label="Send"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
