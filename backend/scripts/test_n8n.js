#!/usr/bin/env node

/**
 * n8n Workflows Test Script
 *
 * Tests all DRCT API n8n workflows to ensure they are working correctly.
 *
 * Usage:
 *   node scripts/test_n8n.js
 *
 * Environment Variables:
 *   N8N_URL - n8n base URL (default: http://localhost:5678)
 *   DRCT_API_KEY - DRCT API key for testing (optional, will use test mode if not set)
 */

const axios = require('axios');

// Configuration
const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const WEBHOOK_BASE = `${N8N_URL}/webhook`;
const TIMEOUT = 30000; // 30 seconds

// Test data
const TEST_DATA = {
  search: {
    origin: 'MOW',
    destination: 'LED',
    depart_date: '2026-03-15',  // Changed from departure_date to depart_date
    return_date: '2026-03-20',
    adults: 1,  // Moved from passengers object to top level
    children: 0,
    infants: 0,
    cabin_class: 'economy'
  },
  price: {
    offer_id: 'test-offer-12345',
    passengers: [
      { type: 'ADT' }
    ]
  },
  order_create: {
    offer_id: 'test-offer-12345',
    passengers: [
      {
        first_name: 'Ivan',
        last_name: 'Testov',
        middle_name: 'Ivanovich',
        date_of_birth: '1990-01-01',
        gender: 'M',
        document: {
          type: 'passport',  // lowercase
          number: '1234567890',
          expiry_date: '2030-01-01',
          issuing_country: 'RU'  // Changed from citizenship to issuing_country
        }
      }
    ],
    contacts: {
      email: 'test@example.com',
      phone: '+79001234567'
    },
    payment_method: 'CARD'
  },
  order_issue: {
    order_id: 'test-order-67890',
    payment_confirmation: 'payment-ref-test-123'
  },
  order_cancel: {
    order_id: 'test-order-67890',
    reason: 'USER_REQUEST',
    refund_requested: true
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.bright);
  log(title, colors.bright);
  log('='.repeat(60), colors.bright);
}

// Test functions
async function checkN8nAvailability() {
  logSection('Checking n8n Availability');

  try {
    const response = await axios.get(N8N_URL, { timeout: 5000 });

    if (response.status === 200) {
      logSuccess(`n8n is accessible at ${N8N_URL}`);
      return true;
    } else {
      logWarning(`n8n returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`n8n is not accessible at ${N8N_URL}`);
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function testWorkflow(name, endpoint, data, expectedFields = [], extraHeaders = {}) {
  logSection(`Testing: ${name}`);

  const url = `${WEBHOOK_BASE}${endpoint}`;
  logInfo(`URL: ${url}`);
  logInfo(`Data: ${JSON.stringify(data, null, 2)}`);

  try {
    const startTime = Date.now();
    const response = await axios.post(url, data, {
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders
      },
      validateStatus: () => true // Don't throw on any status
    });
    const duration = Date.now() - startTime;

    logInfo(`Response time: ${duration}ms`);
    logInfo(`Status: ${response.status}`);

    if (response.status >= 200 && response.status < 300) {
      logSuccess(`Request successful (${response.status})`);

      // Pretty print response first
      log('\nResponse:', colors.blue);
      console.log(JSON.stringify(response.data, null, 2));

      // Validate response structure
      if (expectedFields.length > 0 && typeof response.data === 'object' && response.data !== null) {
        const missingFields = expectedFields.filter(field =>
          !(field in response.data)
        );

        if (missingFields.length === 0) {
          logSuccess('All expected fields present in response');
        } else {
          logWarning(`Missing fields: ${missingFields.join(', ')}`);
        }
      } else if (expectedFields.length > 0) {
        logWarning('Response is not an object, cannot validate fields');
      }

      return {
        success: true,
        status: response.status,
        data: response.data,
        duration
      };
    } else {
      logWarning(`Request returned status ${response.status}`);
      log('\nResponse:', colors.yellow);
      console.log(JSON.stringify(response.data, null, 2));

      return {
        success: false,
        status: response.status,
        data: response.data,
        duration
      };
    }
  } catch (error) {
    logError(`Request failed: ${error.message}`);

    if (error.response) {
      log('\nError response:', colors.red);
      console.log(JSON.stringify(error.response.data, null, 2));
    }

    if (error.code === 'ECONNREFUSED') {
      logError('Connection refused. Is n8n running?');
    } else if (error.code === 'ETIMEDOUT') {
      logError('Request timed out. Workflow might be taking too long.');
    }

    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

async function runAllTests() {
  log(`\n${colors.bright}n8n DRCT Workflows Test Suite${colors.reset}`);
  log(`Testing n8n at: ${N8N_URL}`);
  log(`Timeout: ${TIMEOUT}ms\n`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Check n8n availability first
  const isAvailable = await checkN8nAvailability();

  if (!isAvailable) {
    logError('\nn8n is not available. Please ensure:');
    logError('1. n8n is running (docker ps | grep n8n)');
    logError('2. n8n is accessible at the configured URL');
    logError('3. Workflows are imported and activated');
    return process.exit(1);
  }

  // Test 1: Search workflow
  results.total++;
  const searchResult = await testWorkflow(
    'DRCT Search',
    '/drct/search',
    TEST_DATA.search,
    ['search_id', 'offers', 'metadata']
  );
  results.tests.push({ name: 'Search', ...searchResult });
  if (searchResult.success) results.passed++;
  else results.failed++;

  // Test 2: Price workflow
  results.total++;
  const priceResult = await testWorkflow(
    'DRCT Price',
    '/drct/price',
    TEST_DATA.price,
    ['offer_id', 'price', 'timestamp']
  );
  results.tests.push({ name: 'Price', ...priceResult });
  if (priceResult.success) results.passed++;
  else results.failed++;

  // Test 3: Order Create workflow
  results.total++;
  const createResult = await testWorkflow(
    'DRCT Order Create',
    '/drct/order/create',
    TEST_DATA.order_create,
    ['order_id', 'status', 'price', 'passengers'],
    { 'Idempotency-Key': `test-create-${Date.now()}` }
  );
  results.tests.push({ name: 'Order Create', ...createResult });
  if (createResult.success) results.passed++;
  else results.failed++;

  // Test 4: Order Issue workflow
  results.total++;
  const issueResult = await testWorkflow(
    'DRCT Order Issue',
    '/drct/order/issue',
    TEST_DATA.order_issue,
    ['order_id', 'status', 'tickets'],
    { 'Idempotency-Key': `test-issue-${Date.now()}` }
  );
  results.tests.push({ name: 'Order Issue', ...issueResult });
  if (issueResult.success) results.passed++;
  else results.failed++;

  // Test 5: Order Cancel workflow
  results.total++;
  const cancelResult = await testWorkflow(
    'DRCT Order Cancel',
    '/drct/order/cancel',
    TEST_DATA.order_cancel,
    ['order_id', 'status', 'cancelled_at']
  );
  results.tests.push({ name: 'Order Cancel', ...cancelResult });
  if (cancelResult.success) results.passed++;
  else results.failed++;

  // Summary
  logSection('Test Summary');

  log(`Total tests: ${results.total}`);
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }

  log('\nDetailed Results:', colors.bright);
  results.tests.forEach(test => {
    const status = test.success ? '✓' : '✗';
    const color = test.success ? colors.green : colors.red;
    const duration = test.duration ? `(${test.duration}ms)` : '';
    log(`  ${status} ${test.name} ${duration}`, color);
  });

  // Exit with appropriate code
  const exitCode = results.failed > 0 ? 1 : 0;

  if (exitCode === 0) {
    log('\n✓ All tests passed!', colors.green);
  } else {
    log('\n✗ Some tests failed. Check the logs above for details.', colors.red);
  }

  return exitCode;
}

// Main execution
if (require.main === module) {
  runAllTests()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      logError(`\nUnexpected error: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  checkN8nAvailability,
  testWorkflow,
  runAllTests
};
