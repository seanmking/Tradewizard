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
        {dropdownOptions.length > 0 ? (
          <div className="dropdown-container">
            <select 
              value={selectedOption}
              onChange={handleDropdownChange}
              disabled={isLoading}
              className="chat-dropdown"
              autoFocus={true}
            >
              <option value="">{dropdownPlaceholder}</option>
              {dropdownOptions.map(option => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button 
              type="submit" 
              disabled={isLoading || !selectedOption}
              className="dropdown-submit-button"
              aria-label="Send"
            >
              {/* Icon is added via CSS */}
            </button>
          </div>
        ) : (
          <>
            <textarea
              ref={actualInputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={disableInput ? "Please use the selection options above..." : "Type your message..."}
              disabled={isLoading || disableInput}
              rows={1}
              autoFocus={true}
            />
            <button 
              type="submit" 
              disabled={isLoading || disableInput || !input.trim()}
              onClick={handleSubmit}
              aria-label="Send"
            >
              {/* Icon is added via CSS */}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
