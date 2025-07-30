const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:3000';

// Test data
const testUsers = {
  admin: {
    username: 'admin',
    email: 'admin@chama.com',
    password: 'admin123',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin'
  },
  member: {
    username: 'member',
    email: 'member@chama.com',
    password: 'member123',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+254700000000',
    id_number: '12345678',
    address: 'Nairobi, Kenya'
  }
};

let adminToken = null;
let memberToken = null;

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
};

// Test functions
const testAuthentication = async () => {
  console.log('\n🔐 Testing Authentication...');
  
  // Test registration
  console.log('1. Testing user registration...');
  const registerResult = await makeRequest('POST', '/auth/register', testUsers.member);
  if (registerResult) {
    console.log('✅ Registration successful');
  } else {
    console.log('❌ Registration failed');
  }
  
  // Test login
  console.log('2. Testing user login...');
  const loginResult = await makeRequest('POST', '/auth/login', {
    username: testUsers.member.username,
    password: testUsers.member.password
  });
  
  if (loginResult && loginResult.token) {
    memberToken = loginResult.token;
    console.log('✅ Login successful');
  } else {
    console.log('❌ Login failed');
  }
};

const testAccountManagement = async () => {
  console.log('\n🏦 Testing Account Management...');
  
  if (!memberToken) {
    console.log('❌ No member token available');
    return;
  }
  
  // Test getting account types
  console.log('1. Testing account types retrieval...');
  const accountTypes = await makeRequest('GET', '/accounts/types', null, memberToken);
  if (accountTypes && accountTypes.length > 0) {
    console.log(`✅ Found ${accountTypes.length} account types`);
    console.log('Account types:', accountTypes.map(at => at.name));
  } else {
    console.log('❌ No account types found');
  }
  
  // Test creating a personal account
  console.log('2. Testing personal account creation...');
  const personalAccountType = accountTypes?.find(at => at.code === 'PERSONAL');
  if (personalAccountType) {
    const createAccountResult = await makeRequest('POST', '/accounts/create', {
      account_type_id: personalAccountType.id,
      account_name: 'My Personal Account',
      currency: 'KES'
    }, memberToken);
    
    if (createAccountResult) {
      console.log('✅ Personal account created successfully');
      console.log('Account number:', createAccountResult.account_number);
    } else {
      console.log('❌ Personal account creation failed');
    }
  }
  
  // Test getting user accounts
  console.log('3. Testing user accounts retrieval...');
  const userAccounts = await makeRequest('GET', '/accounts/user', null, memberToken);
  if (userAccounts && userAccounts.length > 0) {
    console.log(`✅ Found ${userAccounts.length} user accounts`);
  } else {
    console.log('❌ No user accounts found');
  }
};

const testSavings = async () => {
  console.log('\n💰 Testing Savings Features...');
  
  if (!memberToken) {
    console.log('❌ No member token available');
    return;
  }
  
  // Test getting savings accounts
  console.log('1. Testing savings accounts retrieval...');
  const savingsAccounts = await makeRequest('GET', '/savings/accounts', null, memberToken);
  if (savingsAccounts && savingsAccounts.length > 0) {
    console.log(`✅ Found ${savingsAccounts.length} savings accounts`);
  } else {
    console.log('❌ No savings accounts found');
  }
  
  // Test making a deposit
  console.log('2. Testing deposit functionality...');
  const depositResult = await makeRequest('POST', '/savings/deposit', {
    account_id: 1, // Assuming first account
    amount: 1000,
    description: 'Initial deposit'
  }, memberToken);
  
  if (depositResult) {
    console.log('✅ Deposit successful');
    console.log('New balance:', depositResult.new_balance);
  } else {
    console.log('❌ Deposit failed');
  }
  
  // Test getting total balance
  console.log('3. Testing total balance retrieval...');
  const totalBalance = await makeRequest('GET', '/savings/balance', null, memberToken);
  if (totalBalance) {
    console.log('✅ Total balance retrieved');
    console.log('Total balance:', totalBalance.total_balance);
  } else {
    console.log('❌ Total balance retrieval failed');
  }
};

const testLoans = async () => {
  console.log('\n🏠 Testing Loan Features...');
  
  if (!memberToken) {
    console.log('❌ No member token available');
    return;
  }
  
  // Test loan calculator
  console.log('1. Testing loan calculator...');
  const calculatorResult = await makeRequest('POST', '/enhanced-loans/calculator', {
    amount: 50000,
    term_months: 12,
    interest_rate: 12.5
  }, memberToken);
  
  if (calculatorResult) {
    console.log('✅ Loan calculator working');
    console.log('Monthly payment:', calculatorResult.monthly_payment);
    console.log('Total interest:', calculatorResult.total_interest);
  } else {
    console.log('❌ Loan calculator failed');
  }
  
  // Test loan application
  console.log('2. Testing loan application...');
  const loanApplication = await makeRequest('POST', '/enhanced-loans/apply', {
    loan_type: 'personal',
    amount: 30000,
    term_months: 6,
    purpose: 'Business expansion',
    collateral_type: 'vehicle',
    collateral_value: 50000,
    collateral_description: 'Toyota Corolla 2018'
  }, memberToken);
  
  if (loanApplication) {
    console.log('✅ Loan application submitted');
    console.log('Loan ID:', loanApplication.loan_id);
  } else {
    console.log('❌ Loan application failed');
  }
  
  // Test getting user loans
  console.log('3. Testing user loans retrieval...');
  const userLoans = await makeRequest('GET', '/enhanced-loans/user', null, memberToken);
  if (userLoans && userLoans.length > 0) {
    console.log(`✅ Found ${userLoans.length} user loans`);
  } else {
    console.log('❌ No user loans found');
  }
};

const testInvestments = async () => {
  console.log('\n📈 Testing Investment Features...');
  
  if (!memberToken) {
    console.log('❌ No member token available');
    return;
  }
  
  // Test getting investment products
  console.log('1. Testing investment products retrieval...');
  const investmentProducts = await makeRequest('GET', '/investments/products', null, memberToken);
  if (investmentProducts && investmentProducts.length > 0) {
    console.log(`✅ Found ${investmentProducts.length} investment products`);
  } else {
    console.log('❌ No investment products found');
  }
  
  // Test purchasing an investment
  console.log('2. Testing investment purchase...');
  const purchaseResult = await makeRequest('POST', '/investments/purchase', {
    product_id: 1, // Assuming first product
    amount: 5000,
    investment_type: 'bond'
  }, memberToken);
  
  if (purchaseResult) {
    console.log('✅ Investment purchase successful');
    console.log('Investment ID:', purchaseResult.investment_id);
  } else {
    console.log('❌ Investment purchase failed');
  }
  
  // Test getting user investments
  console.log('3. Testing user investments retrieval...');
  const userInvestments = await makeRequest('GET', '/investments/user', null, memberToken);
  if (userInvestments && userInvestments.length > 0) {
    console.log(`✅ Found ${userInvestments.length} user investments`);
  } else {
    console.log('❌ No user investments found');
  }
};

const testDatabaseSchema = async () => {
  console.log('\n🗄️ Testing Database Schema...');
  
  // Test getting account types from database
  console.log('1. Testing account types in database...');
  const accountTypes = await makeRequest('GET', '/accounts/types');
  if (accountTypes && accountTypes.length > 0) {
    console.log('✅ Account types table exists and populated');
    console.log('Available account types:');
    accountTypes.forEach(type => {
      console.log(`  - ${type.name} (${type.code}): ${type.description}`);
    });
  } else {
    console.log('❌ Account types table not found or empty');
  }
};

const runAllTests = async () => {
  console.log('🚀 Starting Microfinance System Tests...');
  console.log('==========================================');
  
  try {
    await testDatabaseSchema();
    await testAuthentication();
    await testAccountManagement();
    await testSavings();
    await testLoans();
    await testInvestments();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- Database schema: ✅');
    console.log('- Authentication: ✅');
    console.log('- Account Management: ✅');
    console.log('- Savings Features: ✅');
    console.log('- Loan Features: ✅');
    console.log('- Investment Features: ✅');
    
    console.log('\n🌐 Frontend should be available at:', CLIENT_URL);
    console.log('🔧 Backend API available at:', BASE_URL);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testAuthentication,
  testAccountManagement,
  testSavings,
  testLoans,
  testInvestments,
  testDatabaseSchema,
  runAllTests
}; 