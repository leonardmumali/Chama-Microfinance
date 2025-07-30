const axios = require("axios");

// Test configuration
const BASE_URL = "http://localhost:3001/api";
const TEST_ACCOUNT_ID = 1; // Replace with actual account ID from your database

// Test data
const testData = {
  credit: {
    amount: 1000,
    description: "Test credit transaction",
    reference: "TEST_CREDIT_001",
  },
  debit: {
    amount: 500,
    description: "Test debit transaction",
    reference: "TEST_DEBIT_001",
  },
};

// Mock admin token (you'll need to replace this with a real admin token)
const ADMIN_TOKEN = "your_admin_token_here";

async function testCreditAccount() {
  try {
    console.log("Testing credit account functionality...");

    const response = await axios.post(
      `${BASE_URL}/accounts/${TEST_ACCOUNT_ID}/credit`,
      testData.credit,
      {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Credit test successful:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Credit test failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function testDebitAccount() {
  try {
    console.log("Testing debit account functionality...");

    const response = await axios.post(
      `${BASE_URL}/accounts/${TEST_ACCOUNT_ID}/debit`,
      testData.debit,
      {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Debit test successful:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Debit test failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function testGetAccountBalance() {
  try {
    console.log("Testing get account balance...");

    const response = await axios.get(
      `${BASE_URL}/accounts/${TEST_ACCOUNT_ID}/balance`,
      {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      }
    );

    console.log("✅ Get balance test successful:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Get balance test failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function runTests() {
  console.log("🚀 Starting credit/debit functionality tests...\n");

  try {
    // Test 1: Get initial balance
    console.log("=== Test 1: Get Account Balance ===");
    const initialBalance = await testGetAccountBalance();

    // Test 2: Credit account
    console.log("\n=== Test 2: Credit Account ===");
    const creditResult = await testCreditAccount();

    // Test 3: Get balance after credit
    console.log("\n=== Test 3: Get Balance After Credit ===");
    const balanceAfterCredit = await testGetAccountBalance();

    // Test 4: Debit account
    console.log("\n=== Test 4: Debit Account ===");
    const debitResult = await testDebitAccount();

    // Test 5: Get final balance
    console.log("\n=== Test 5: Get Final Balance ===");
    const finalBalance = await testGetAccountBalance();

    console.log("\n📊 Test Summary:");
    console.log(`Initial Balance: ${initialBalance.balance}`);
    console.log(`Credited Amount: ${creditResult.credited_amount}`);
    console.log(`Balance After Credit: ${balanceAfterCredit.balance}`);
    console.log(`Debited Amount: ${debitResult.debited_amount}`);
    console.log(`Final Balance: ${finalBalance.balance}`);

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error.message);
  }
}

// Instructions for running the tests
console.log(`
📋 Instructions for testing credit/debit functionality:

1. Make sure your server is running on http://localhost:3001
2. Replace 'your_admin_token_here' with a real admin JWT token
3. Replace TEST_ACCOUNT_ID with an actual account ID from your database
4. Run this script with: node test_credit_debit.js

To get an admin token, you can:
1. Login as an admin user through your frontend
2. Check the browser's developer tools Network tab
3. Copy the Authorization header from any API request
4. Replace the ADMIN_TOKEN variable with that token

To find an account ID:
1. Check your database directly
2. Or use the admin panel to list all accounts
3. Replace TEST_ACCOUNT_ID with a real account ID
`);

// Uncomment the line below to run tests
// runTests();

module.exports = {
  testCreditAccount,
  testDebitAccount,
  testGetAccountBalance,
  runTests,
};
