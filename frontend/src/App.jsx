import React from 'react';
import ChatInterface from './components/Chat/ChatInterface';
import SmokeTest from './tests/SmokeTest';
import ValidationChecklist from './tests/ValidationChecklist';
import './styles/main.css';

const App = () => {
  const [view, setView] = React.useState('chat');

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex justify-end space-x-2">
          <button
            onClick={() => setView('chat')}
            className={`px-4 py-2 text-sm rounded-lg ${
              view === 'chat'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setView('smoke')}
            className={`px-4 py-2 text-sm rounded-lg ${
              view === 'smoke'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Smoke Test
          </button>
          <button
            onClick={() => setView('validation')}
            className={`px-4 py-2 text-sm rounded-lg ${
              view === 'validation'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Validation
          </button>
        </div>

        {view === 'chat' && <ChatInterface />}
        {view === 'smoke' && <SmokeTest />}
        {view === 'validation' && <ValidationChecklist />}
      </div>
    </div>
  );
};

export default App; 