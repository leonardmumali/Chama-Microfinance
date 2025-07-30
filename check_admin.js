const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'server/database/chama.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking admin user in database...');

db.get("SELECT * FROM users WHERE username = 'admin'", (err, user) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  if (user) {
    console.log('Admin user found:');
    console.log('ID:', user.id);
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    console.log('Password hash:', user.password);
    
    // Test password verification
    bcrypt.compare('admin123', user.password, (err, isMatch) => {
      if (err) {
        console.error('Password verification error:', err);
      } else {
        console.log('Password verification result:', isMatch);
      }
      db.close();
    });
  } else {
    console.log('Admin user not found!');
    db.close();
  }
}); 