const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create database connection
const dbPath = path.join(__dirname, "chama.db");
const db = new sqlite3.Database(dbPath);

// Helper functions for database operations
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const getRow = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const getAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Enhanced Loans Database Schema
const initializeEnhancedLoansDatabase = async () => {
  try {
    // Enhanced Loans table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS enhanced_loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        group_id INTEGER,
        loan_number TEXT UNIQUE NOT NULL,
        loan_type TEXT NOT NULL CHECK(loan_type IN ('personal', 'group', 'business', 'women_youth', 'mortgage', 'bonds')),
        amount DECIMAL(12,2) NOT NULL,
        interest_rate DECIMAL(5,2) NOT NULL,
        term_months INTEGER NOT NULL,
        monthly_payment DECIMAL(12,2) NOT NULL,
        total_payable DECIMAL(12,2) NOT NULL,
        purpose TEXT NOT NULL,
        due_date DATE NOT NULL,
        credit_score INTEGER DEFAULT 0,
        collateral_details TEXT,
        insurance_required BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'defaulted')),
        approved_by INTEGER,
        approved_at DATETIME,
        disbursed_at DATETIME,
        disbursement_method TEXT,
        disbursement_details TEXT,
        rejection_reason TEXT,
        restructured_at DATETIME,
        restructured_by INTEGER,
        restructuring_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (approved_by) REFERENCES users(id),
        FOREIGN KEY (restructured_by) REFERENCES users(id)
      )
    `);

    // Loan Guarantors table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS loan_guarantors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id INTEGER NOT NULL,
        guarantor_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        approved_at DATETIME,
        rejection_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES enhanced_loans(id),
        FOREIGN KEY (guarantor_id) REFERENCES users(id)
      )
    `);

    // Loan Collateral table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS loan_collateral (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id INTEGER NOT NULL,
        collateral_type TEXT NOT NULL,
        description TEXT,
        value DECIMAL(12,2) NOT NULL,
        documents TEXT,
        verified BOOLEAN DEFAULT 0,
        verified_by INTEGER,
        verified_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES enhanced_loans(id),
        FOREIGN KEY (verified_by) REFERENCES users(id)
      )
    `);

    // Enhanced Loan Payments table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS enhanced_loan_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id INTEGER NOT NULL,
        payment_number TEXT UNIQUE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status TEXT DEFAULT 'paid' CHECK(status IN ('paid', 'pending', 'failed')),
        late_fee DECIMAL(12,2) DEFAULT 0,
        payment_method TEXT,
        payment_reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES enhanced_loans(id)
      )
    `);

    // Loan Insurance table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS loan_insurance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id INTEGER NOT NULL,
        insurance_provider TEXT NOT NULL,
        policy_number TEXT UNIQUE NOT NULL,
        premium_amount DECIMAL(12,2) NOT NULL,
        coverage_amount DECIMAL(12,2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES enhanced_loans(id)
      )
    `);

    // Loan Disbursement Logs table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS loan_disbursement_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id INTEGER NOT NULL,
        disbursement_method TEXT NOT NULL,
        disbursement_details TEXT,
        amount DECIMAL(12,2) NOT NULL,
        transaction_reference TEXT,
        status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed')),
        processed_by INTEGER NOT NULL,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES enhanced_loans(id),
        FOREIGN KEY (processed_by) REFERENCES users(id)
      )
    `);

    // Loan Penalties table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS loan_penalties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id INTEGER NOT NULL,
        penalty_type TEXT NOT NULL CHECK(penalty_type IN ('late_payment', 'default', 'restructuring')),
        amount DECIMAL(12,2) NOT NULL,
        reason TEXT,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        applied_by INTEGER NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'waived', 'paid')),
        FOREIGN KEY (loan_id) REFERENCES enhanced_loans(id),
        FOREIGN KEY (applied_by) REFERENCES users(id)
      )
    `);

    // Loan Credit Scoring table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS loan_credit_scoring (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        credit_score INTEGER NOT NULL,
        scoring_factors TEXT,
        calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('Enhanced loans database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing enhanced loans database schema:', error);
    throw error;
  }
};

// Insert default loan types configuration
const insertDefaultLoanTypes = async () => {
  try {
    const loanTypes = [
      {
        code: 'personal',
        name: 'Personal Loans',
        minAmount: 1000,
        maxAmount: 500000,
        minTerm: 3,
        maxTerm: 36,
        baseInterestRate: 12.0,
        requiresCollateral: false,
        requiresGuarantor: false,
        maxLoanToValue: 0.8
      },
      {
        code: 'group',
        name: 'Group Loans',
        minAmount: 5000,
        maxAmount: 2000000,
        minTerm: 6,
        maxTerm: 60,
        baseInterestRate: 10.0,
        requiresCollateral: false,
        requiresGuarantor: true,
        maxLoanToValue: 0.9
      },
      {
        code: 'business',
        name: 'Business Loans',
        minAmount: 10000,
        maxAmount: 5000000,
        minTerm: 12,
        maxTerm: 84,
        baseInterestRate: 15.0,
        requiresCollateral: true,
        requiresGuarantor: true,
        maxLoanToValue: 0.7
      },
      {
        code: 'women_youth',
        name: 'Women/Youth Empowerment Loans',
        minAmount: 2000,
        maxAmount: 300000,
        minTerm: 6,
        maxTerm: 48,
        baseInterestRate: 8.0,
        requiresCollateral: false,
        requiresGuarantor: true,
        maxLoanToValue: 0.85
      },
      {
        code: 'mortgage',
        name: 'Mortgages',
        minAmount: 500000,
        maxAmount: 50000000,
        minTerm: 120,
        maxTerm: 360,
        baseInterestRate: 9.5,
        requiresCollateral: true,
        requiresGuarantor: false,
        maxLoanToValue: 0.8
      },
      {
        code: 'bonds',
        name: 'Bonds (Loan-backed instruments)',
        minAmount: 100000,
        maxAmount: 10000000,
        minTerm: 60,
        maxTerm: 240,
        baseInterestRate: 11.0,
        requiresCollateral: true,
        requiresGuarantor: true,
        maxLoanToValue: 0.75
      }
    ];

    for (const loanType of loanTypes) {
      await runQuery(`
        INSERT OR IGNORE INTO loan_types (
          code, name, min_amount, max_amount, min_term, max_term,
          base_interest_rate, requires_collateral, requires_guarantor, max_loan_to_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        loanType.code, loanType.name, loanType.minAmount, loanType.maxAmount,
        loanType.minTerm, loanType.maxTerm, loanType.baseInterestRate,
        loanType.requiresCollateral, loanType.requiresGuarantor, loanType.maxLoanToValue
      ]);
    }

    console.log('Default loan types inserted successfully');
  } catch (error) {
    console.error('Error inserting default loan types:', error);
    throw error;
  }
};

// Initialize the enhanced loans database
const initEnhancedLoans = async () => {
  try {
    await initializeEnhancedLoansDatabase();
    await insertDefaultLoanTypes();
    console.log('Enhanced loans database initialized successfully');
  } catch (error) {
    console.error('Error initializing enhanced loans database:', error);
    throw error;
  }
};

module.exports = {
  initEnhancedLoans,
  runQuery,
  getRow,
  getAll
}; 