import React from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

const InputForm = ({ onSendMessage, disabled, isLoading }) => {
  const [message, setMessage] = React.useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="input-container">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled || isLoading}
        placeholder="Type your message..."
        className="input-field"
      />
      {!disabled && (
        <button
          onClick={handleSubmit}
          disabled={isLoading || !message.trim()}
          className="button button-primary"
          type="button"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </button>
      )}
    </div>
  );
};

export default InputForm; 