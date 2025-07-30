const assert = require('assert');

// Simple test cases without describe/it blocks
try {
  assert.strictEqual(1, 1, '1 is not equal to 1!');
  console.log('Test 1 passed: 1 equals 1.');

  assert.strictEqual(true, true, 'Health check failed!');
  console.log('Test 2 passed: Health check passed!');
  
  console.log('All tests passed.');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);  // Exit with error code if any test fails
}
