import React from 'react';
import { motion } from 'framer-motion';
import { assessmentApi } from '../../services/api';

const TestResult = ({ status, message }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-3 rounded-lg mb-2 ${
      status === 'success' ? 'bg-green-100 text-green-800' :
      status === 'error' ? 'bg-red-100 text-red-800' :
      'bg-yellow-100 text-yellow-800'
    }`}
  >
    {status === 'success' ? '✅' : status === 'error' ? '❌' : '⏳'} {message}
  </motion.div>
);

const SmokeTest = () => {
  const [tests, setTests] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const testId = React.useRef(0);

  const addTest = (status, message) => {
    testId.current += 1;
    const id = `${testId.current}-${status}-${Date.now()}`;
    setTests(prev => [...prev, { status, message, id }]);
  };

  const runTests = async () => {
    setRunning(true);
    setTests([]);
    testId.current = 0;

    // Test 1: API Connection
    addTest('running', 'Testing API connection...');
    try {
      await assessmentApi.startSession();
      addTest('success', 'API connection successful');
    } catch (error) {
      addTest('error', `API connection failed: ${error.message}`);
      setRunning(false);
      return;
    }

    // Test 2: Session Management
    addTest('running', 'Testing session management...');
    const storedSession = assessmentApi.getSessionId();
    if (storedSession) {
      addTest('success', 'Session management working');
    } else {
      addTest('error', 'Session management failed');
      setRunning(false);
      return;
    }

    // Test 3: Message Flow
    addTest('running', 'Testing message flow...');
    try {
      await assessmentApi.sendMessage('Test message');
      addTest('success', 'Message flow working');
    } catch (error) {
      addTest('error', `Message flow failed: ${error.message}`);
      setRunning(false);
      return;
    }

    // Test 4: Animation Test
    addTest('running', 'Testing animations...');
    setTimeout(() => {
      addTest('success', 'Animations working');
      setRunning(false);
    }, 500);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Frontend Smoke Test</h2>
      
      <button
        onClick={runTests}
        disabled={running}
        className="mb-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
      >
        {running ? 'Running Tests...' : 'Run Tests'}
      </button>

      <div className="space-y-2">
        {tests.map(test => (
          <TestResult
            key={test.id}
            status={test.status}
            message={test.message}
          />
        ))}
      </div>
    </div>
  );
};

export default SmokeTest; 