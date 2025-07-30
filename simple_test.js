const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:3000';

// Simple HTTP request function
const makeRequest = (method, endpoint, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (error) {
          resolve(responseData);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
};

// Test functions
const testServerConnection = async () => {
  console.log('\n🔌 Testing Server Connection...');
  
  try {
    const response = await makeRequest('GET', '/accounts/types');
    if (response) {
      console.log('✅ Server is running and responding');
      return true;
    }
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    return false;
  }
};

const testDatabaseSchema = async () => {
  console.log('\n🗄️ Testing Database Schema...');
  
  try {
    const accountTypes = await makeRequest('GET', '/accounts/types');
    if (accountTypes && Array.isArray(accountTypes) && accountTypes.length > 0) {
      console.log('✅ Account types table exists and populated');
      console.log(`Found ${accountTypes.length} account types:`);
      accountTypes.forEach(type => {
        console.log(`  - ${type.name} (${type.code}): ${type.description}`);
      });
      return true;
    } else {
      console.log('❌ Account types table not found or empty');
      return false;
    }
  } catch (error) {
    console.log('❌ Database schema test failed:', error.message);
    return false;
  }
};

const testUserRegistration = async () => {
  console.log('\n👤 Testing User Registration...');
  
  const testUser = {
    username: 'testuser',
    email: 'test@chama.com',
    password: 'test123',
    first_name: 'Test',
    last_name: 'User',
    phone: '+254700000001',
    id_number: '12345679',
    address: 'Nairobi, Kenya'
  };
  
  try {
    const result = await makeRequest('POST', '/auth/register', testUser);
    if (result && result.token) {
      console.log('✅ User registration successful');
      console.log('Token received:', result.token.substring(0, 20) + '...');
      return result.token;
    } else {
      console.log('❌ User registration failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Registration test failed:', error.message);
    return null;
  }
};

const testAccountCreation = async (token) => {
  console.log('\n🏦 Testing Account Creation...');
  
  if (!token) {
    console.log('❌ No token available for account creation test');
    return false;
  }
  
  try {
    // First get account types
    const accountTypes = await makeRequest('GET', '/accounts/types', null, token);
    const personalAccountType = accountTypes?.find(at => at.code === 'PERSONAL');
    
    if (personalAccountType) {
      const createAccountData = {
        account_type_id: personalAccountType.id,
        account_name: 'Test Personal Account',
        currency: 'KES'
      };
      
      const result = await makeRequest('POST', '/accounts/create', createAccountData, token);
      if (result && result.account_number) {
        console.log('✅ Account creation successful');
        console.log('Account number:', result.account_number);
        return true;
      } else {
        console.log('❌ Account creation failed');
        return false;
      }
    } else {
      console.log('❌ Personal account type not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Account creation test failed:', error.message);
    return false;
  }
};

const testSavingsFeatures = async (token) => {
  console.log('\n💰 Testing Savings Features...');
  
  if (!token) {
    console.log('❌ No token available for savings test');
    return false;
  }
  
  try {
    // Test getting savings accounts
    const savingsAccounts = await makeRequest('GET', '/savings/accounts', null, token);
    if (savingsAccounts && Array.isArray(savingsAccounts)) {
      console.log(`✅ Found ${savingsAccounts.length} savings accounts`);
      
      // Test deposit if we have an account
      if (savingsAccounts.length > 0) {
        const depositData = {
          account_id: savingsAccounts[0].id,
          amount: 1000,
          description: 'Test deposit'
        };
        
        const depositResult = await makeRequest('POST', '/savings/deposit', depositData, token);
        if (depositResult && depositResult.new_balance !== undefined) {
          console.log('✅ Deposit successful');
          console.log('New balance:', depositResult.new_balance);
          return true;
        } else {
          console.log('❌ Deposit failed');
          return false;
        }
      } else {
        console.log('⚠️ No savings accounts available for deposit test');
        return true;
      }
    } else {
      console.log('❌ No savings accounts found');
      return false;
    }
  } catch (error) {
    console.log('❌ Savings test failed:', error.message);
    return false;
  }
};

const testLoanCalculator = async (token) => {
  console.log('\n🏠 Testing Loan Calculator...');
  
  if (!token) {
    console.log('❌ No token available for loan calculator test');
    return false;
  }
  
  try {
    const calculatorData = {
      amount: 50000,
      term_months: 12,
      interest_rate: 12.5
    };
    
    const result = await makeRequest('POST', '/enhanced-loans/calculator', calculatorData, token);
    if (result && result.monthly_payment) {
      console.log('✅ Loan calculator working');
      console.log('Monthly payment:', result.monthly_payment);
      console.log('Total interest:', result.total_interest);
      return true;
    } else {
      console.log('❌ Loan calculator failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Loan calculator test failed:', error.message);
    return false;
  }
};

const testInvestmentProducts = async (token) => {
  console.log('\n📈 Testing Investment Products...');
  
  if (!token) {
    console.log('❌ No token available for investment test');
    return false;
  }
  
  try {
    const products = await makeRequest('GET', '/investments/products', null, token);
    if (products && Array.isArray(products) && products.length > 0) {
      console.log(`✅ Found ${products.length} investment products`);
      products.forEach(product => {
        console.log(`  - ${product.name}: ${product.description}`);
      });
      return true;
    } else {
      console.log('❌ No investment products found');
      return false;
    }
  } catch (error) {
    console.log('❌ Investment products test failed:', error.message);
    return false;
  }
};

const runAllTests = async () => {
  console.log('🚀 Starting Microfinance System Tests...');
  console.log('==========================================');
  
  const results = {
    serverConnection: false,
    databaseSchema: false,
    userRegistration: false,
    accountCreation: false,
    savingsFeatures: false,
    loanCalculator: false,
    investmentProducts: false
  };
  
  try {
    // Test server connection
    results.serverConnection = await testServerConnection();
    
    if (results.serverConnection) {
      // Test database schema
      results.databaseSchema = await testDatabaseSchema();
      
      // Test user registration
      const token = await testUserRegistration();
      results.userRegistration = !!token;
      
      if (token) {
        // Test account creation
        results.accountCreation = await testAccountCreation(token);
        
        // Test savings features
        results.savingsFeatures = await testSavingsFeatures(token);
        
        // Test loan calculator
        results.loanCalculator = await testLoanCalculator(token);
        
        // Test investment products
        results.investmentProducts = await testInvestmentProducts(token);
      }
    }
    
    // Print summary
    console.log('\n🎉 Test Summary:');
    console.log('================');
    console.log(`Server Connection: ${results.serverConnection ? '✅' : '❌'}`);
    console.log(`Database Schema: ${results.databaseSchema ? '✅' : '❌'}`);
    console.log(`User Registration: ${results.userRegistration ? '✅' : '❌'}`);
    console.log(`Account Creation: ${results.accountCreation ? '✅' : '❌'}`);
    console.log(`Savings Features: ${results.savingsFeatures ? '✅' : '❌'}`);
    console.log(`Loan Calculator: ${results.loanCalculator ? '✅' : '❌'}`);
    console.log(`Investment Products: ${results.investmentProducts ? '✅' : '❌'}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! The microfinance system is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please check the server logs for more details.');
    }
    
    console.log(`\n🌐 Frontend should be available at: ${CLIENT_URL}`);
    console.log(`🔧 Backend API available at: ${BASE_URL}`);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testServerConnection,
  testDatabaseSchema,
  testUserRegistration,
  testAccountCreation,
  testSavingsFeatures,
  testLoanCalculator,
  testInvestmentProducts,
  runAllTests
}; 