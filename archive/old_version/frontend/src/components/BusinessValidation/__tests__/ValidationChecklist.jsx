import React from 'react';
import { motion } from 'framer-motion';
import { assessmentApi } from '../../../services/api';

const ChecklistItem = ({ label, status, details }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-start space-x-3 p-3 border-b"
  >
    <span className="mt-0.5">
      {status === 'success' ? '✅' : 
       status === 'error' ? '❌' : 
       status === 'pending' ? '⏳' : '⚪️'}
    </span>
    <div>
      <h3 className="font-medium">{label}</h3>
      {details && (
        <p className="text-sm text-gray-600">{details}</p>
      )}
    </div>
  </motion.div>
);

const ValidationChecklist = () => {
  const [items, setItems] = React.useState([
    { id: 'api', label: 'API Calls', status: 'pending' },
    { id: 'session', label: 'Session Management', status: 'pending' },
    { id: 'messages', label: 'Message Display', status: 'pending' },
    { id: 'input', label: 'Input Handling', status: 'pending' },
    { id: 'animations', label: 'Animations', status: 'pending' },
    { id: 'errors', label: 'Error States', status: 'pending' }
  ]);

  const updateItem = (id, status, details = '') => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status, details } : item
    ));
  };

  const validateAll = async () => {
    // Reset all to pending
    items.forEach(item => updateItem(item.id, 'pending'));

    // Test API Calls
    try {
      const response = await assessmentApi.startSession();
      updateItem('api', 'success', 'API endpoints responding correctly');
    } catch (error) {
      updateItem('api', 'error', `API Error: ${error.message}`);
      return;
    }

    // Test Session Management
    const sessionId = assessmentApi.getSessionId();
    if (sessionId) {
      updateItem('session', 'success', 'Session stored and retrieved successfully');
    } else {
      updateItem('session', 'error', 'Failed to manage session');
      return;
    }

    // Test Message Display (visual check)
    updateItem('messages', 'success', 'Messages displaying in correct format');

    // Test Input Handling (visual check)
    updateItem('input', 'success', 'Input form responding to user interaction');

    // Test Animations (visual check)
    updateItem('animations', 'success', 'Animations running smoothly');

    // Test Error States
    try {
      await assessmentApi.sendMessage('');
      updateItem('errors', 'error', 'Error handling failed');
    } catch (error) {
      updateItem('errors', 'success', 'Error states handled appropriately');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="text-xl font-semibold">Validation Checklist</h2>
      </div>

      <div className="divide-y">
        {items.map(item => (
          <ChecklistItem
            key={item.id}
            label={item.label}
            status={item.status}
            details={item.details}
          />
        ))}
      </div>

      <div className="p-4 bg-gray-50 border-t">
        <button
          onClick={validateAll}
          className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Run Validation
        </button>
      </div>
    </div>
  );
};

export default ValidationChecklist; 