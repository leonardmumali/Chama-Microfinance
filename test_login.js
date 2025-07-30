const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('Testing admin login...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testLogin(); 