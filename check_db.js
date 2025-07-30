const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server/database/chama.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking database at:', dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('Tables found:', tables.map(t => t.name));
  
  db.all("SELECT * FROM account_types", (err, types) => {
    if (err) {
      console.log('account_types error:', err.message);
    } else {
      console.log('account_types count:', types.length);
      if (types.length > 0) {
        console.log('First account type:', types[0]);
      }
    }
    db.close();
  });
}); 