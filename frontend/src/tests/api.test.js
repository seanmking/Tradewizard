import { assessmentApi } from '../services/api';

// Helper to clear any existing session
const clearSession = () => {
  localStorage.clear();
  console.log('Session cleared');
};

// Test session management
const testSessionManagement = async () => {
  console.log('\n🧪 Testing Session Management:');
  try {
    clearSession();
    console.log('Starting new session...');
    const startResponse = await assessmentApi.startSession();
    console.log('✅ Session started:', startResponse);
    
    const sessionId = assessmentApi.getSessionId();
    console.log('✅ Session ID retrieved:', sessionId);
    
    if (!sessionId) throw new Error('Session ID not set');
    
    return sessionId;
  } catch (error) {
    console.error('❌ Session management test failed:', error);
    throw error;
  }
};

// Test message flow
const testMessageFlow = async () => {
  console.log('\n🧪 Testing Message Flow:');
  try {
    const testMessage = 'This is a test message';
    console.log('Sending message:', testMessage);
    
    const response = await assessmentApi.sendMessage(testMessage);
    console.log('✅ Message sent and response received:', response);
    
    return response;
  } catch (error) {
    console.error('❌ Message flow test failed:', error);
    throw error;
  }
};

// Test error handling
const testErrorHandling = async () => {
  console.log('\n🧪 Testing Error Handling:');
  try {
    clearSession();
    console.log('Attempting to send message without session...');
    
    await assessmentApi.sendMessage('This should fail');
    console.error('❌ Error handling test failed: Expected error not thrown');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Error handling working as expected:', error.response.data);
    } else {
      console.error('❌ Unexpected error:', error);
      throw error;
    }
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting API Tests...\n');
  
  try {
    await testSessionManagement();
    await testMessageFlow();
    await testErrorHandling();
    
    console.log('\n✨ All tests completed successfully!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
};

// Execute tests when running this file directly
if (typeof window !== 'undefined') {
  runTests();
}

export { runTests, testSessionManagement, testMessageFlow, testErrorHandling }; 