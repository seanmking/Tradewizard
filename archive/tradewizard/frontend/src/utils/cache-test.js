// Test file for the frontend cache implementation
const { frontendCache, withCache } = require('./cache');

// Helper function to wait for a specified time
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test basic cache operations
console.log('Testing basic cache operations...');
frontendCache.set('test-key', { data: 'test-value' });
const value = frontendCache.get('test-key');
console.log('Cache hit:', value);
console.log('Has key:', frontendCache.has('test-key'));

frontendCache.delete('test-key');
console.log('After delete - has key:', frontendCache.has('test-key'));
console.log('After delete - get value:', frontendCache.get('test-key'));

// Test cache expiry
console.log('\nTesting cache expiry...');
frontendCache.set('expiring-key', { data: 'will expire' }, 1000); // 1 second TTL
console.log('Initial value:', frontendCache.get('expiring-key'));

// Test the withCache function
console.log('\nTesting withCache function...');

// Mock API call
const mockApiCall = async (param1, param2) => {
  console.log(`Making API call with params: ${param1}, ${param2}`);
  // Simulate API delay
  await wait(100);
  return { result: `${param1}-${param2}`, timestamp: Date.now() };
};

// Create cached version
const cachedApiCall = withCache(
  mockApiCall,
  (param1, param2) => `api-${param1}-${param2}`,
  { ttl: 5000 } // 5 seconds TTL
);

// Test the cached function
async function testCachedFunction() {
  console.log('First call (should hit API):');
  const result1 = await cachedApiCall('test', '123');
  console.log('Result:', result1);
  
  console.log('\nSecond call with same params (should use cache):');
  const result2 = await cachedApiCall('test', '123');
  console.log('Result:', result2);
  
  console.log('\nCall with different params (should hit API):');
  const result3 = await cachedApiCall('test', '456');
  console.log('Result:', result3);
  
  // Wait for expiry test
  console.log('\nWaiting for expiry test...');
  await wait(1100);
  console.log('Expired key value:', frontendCache.get('expiring-key'));
  
  // Log cache stats
  console.log('\nCache stats:', frontendCache.getStats());
  
  // Clear cache
  frontendCache.clear();
  console.log('Cache cleared. Stats:', frontendCache.getStats());
}

// Run the tests
testCachedFunction().catch(console.error); 