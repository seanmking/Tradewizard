import React, { useRef, useEffect } from 'react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  suggestions?: string[];
  fieldType?: 'text' | 'select' | 'industry';
  prefilledValue?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  suggestions,
  fieldType = 'text',
  prefilledValue
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState(prefilledValue || '');

  // Autofocus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value);
      setValue('');
    }
  };

  // Render appropriate input type
  const renderInput = () => {
    switch (fieldType) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="chat-input"
            autoFocus
          >
            <option value="">Select an option...</option>
            {suggestions?.map((suggestion) => (
              <option key={suggestion} value={suggestion}>
                {suggestion}
              </option>
            ))}
          </select>
        );

      case 'industry':
        return (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="chat-input"
            autoFocus
          >
            <option value="">Select your industry...</option>
            <option value="agriculture">Agriculture & Food Processing</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="technology">Technology & Software</option>
            <option value="services">Professional Services</option>
            {/* Add more industries */}
          </select>
        );

      default:
        return (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="chat-input"
            placeholder="Type your message..."
            list={suggestions ? "suggestions" : undefined}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-form">
      {renderInput()}
      {suggestions && fieldType === 'text' && (
        <datalist id="suggestions">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      )}
      <button type="submit" className="send-button">
        Send
      </button>
    </form>
  );
}; 