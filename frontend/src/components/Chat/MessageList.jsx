import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageList = ({ messages }) => {
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="messages-wrapper">
      <AnimatePresence>
        {messages.map((msg, index) => (
          <motion.div
            key={`msg-${index}-${Date.now()}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`message ${msg.isUser ? 'user-message' : 'assistant-message'}`}
          >
            {msg.content}
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 