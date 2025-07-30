const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

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

// Enhanced database schema with all requested features
const initializeEnhancedDatabase = async () => {
  try {
    // Enhanced Users table with biometric and 2FA support
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'loan_officer', 'borrower', 'member', 'staff')),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended', 'pending_approval')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        profile_picture TEXT,
        address TEXT,
        city TEXT,
        country TEXT DEFAULT 'Kenya',
        id_number TEXT,
        date_of_birth DATE,
        gender TEXT CHECK(gender IN ('male', 'female', 'other')),
        marital_status TEXT,
        employment_status TEXT,
        employer_name TEXT,
        monthly_income DECIMAL(10,2),
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        emergency_contact_relationship TEXT,
        kyc_status TEXT DEFAULT 'pending' CHECK(kyc_status IN ('pending', 'verified', 'rejected')),
        kyc_verified_at DATETIME,
        kyc_verified_by INTEGER,
        two_factor_enabled BOOLEAN DEFAULT 0,
        two_factor_secret TEXT,
        biometric_enabled BOOLEAN DEFAULT 0,
        biometric_data TEXT,
        credit_score INTEGER DEFAULT 0,
        risk_profile TEXT DEFAULT 'low' CHECK(risk_profile IN ('low', 'medium', 'high')),
        FOREIGN KEY (kyc_verified_by) REFERENCES users(id)
      )
    `);

    // Account Types table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS account_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        min_balance DECIMAL(10,2) DEFAULT 0,
        max_balance DECIMAL(10,2),
        interest_rate DECIMAL(5,2) DEFAULT 0,
        monthly_fee DECIMAL(10,2) DEFAULT 0,
        transaction_limit DECIMAL(10,2),
        daily_transaction_limit DECIMAL(10,2),
        requires_kyc BOOLEAN DEFAULT 1,
        requires_approval BOOLEAN DEFAULT 1,
        allows_joint_accounts BOOLEAN DEFAULT 0,
        allows_group_accounts BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Enhanced Accounts table with multiple account types
    await runQuery(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_number TEXT UNIQUE NOT NULL,
        virtual_account_number TEXT UNIQUE,
        account_type_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        group_id INTEGER,
        account_name TEXT NOT NULL,
        balance DECIMAL(10,2) DEFAULT 0,
        available_balance DECIMAL(10,2) DEFAULT 0,
        blocked_amount DECIMAL(10,2) DEFAULT 0,
        interest_rate DECIMAL(5,2) DEFAULT 0,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'frozen', 'closed', 'suspended')),
        opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME,
        last_activity DATETIME,
        last_interest_date DATE,
        minimum_balance DECIMAL(10,2) DEFAULT 0,
        daily_limit DECIMAL(10,2),
        monthly_limit DECIMAL(10,2),
        currency TEXT DEFAULT 'KES',
        linked_bank_accounts TEXT,
        sms_notifications BOOLEAN DEFAULT 1,
        email_notifications BOOLEAN DEFAULT 1,
        created_by INTEGER,
        approved_by INTEGER,
        approved_at DATETIME,
        FOREIGN KEY (account_type_id) REFERENCES account_types(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);

    // Joint Account Members
    await runQuery(`
      CREATE TABLE IF NOT EXISTS joint_account_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'member' CHECK(role IN ('primary', 'secondary', 'member')),
        permissions TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(account_id, user_id)
      )
    `);

    // Fixed Deposits table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS fixed_deposits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        deposit_number TEXT UNIQUE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        interest_rate DECIMAL(5,2) NOT NULL,
        term_months INTEGER NOT NULL,
        start_date DATE NOT NULL,
        maturity_date DATE NOT NULL,
        interest_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'matured', 'withdrawn', 'renewed')),
        early_withdrawal_penalty DECIMAL(5,2) DEFAULT 0,
        auto_renewal BOOLEAN DEFAULT 0,
        renewal_term_months INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        matured_at DATETIME,
        withdrawn_at DATETIME,
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      )
    `);

    // Target Savings table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS target_savings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        target_name TEXT NOT NULL,
        target_amount DECIMAL(10,2) NOT NULL,
        current_amount DECIMAL(10,2) DEFAULT 0,
        target_date DATE,
        frequency TEXT DEFAULT 'monthly' CHECK(frequency IN ('daily', 'weekly', 'monthly')),
        contribution_amount DECIMAL(10,2),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      )
    `);

    // Enhanced Loans table with more loan types
    await runQuery(`
      CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_number TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        group_id INTEGER,
        loan_type TEXT NOT NULL CHECK(loan_type IN ('personal', 'business', 'emergency', 'education', 'agriculture', 'mortgage', 'bond', 'women_empowerment', 'youth_empowerment', 'group_loan')),
        amount DECIMAL(10,2) NOT NULL,
        interest_rate DECIMAL(5,2) NOT NULL,
        interest_type TEXT DEFAULT 'reducing' CHECK(interest_type IN ('flat', 'reducing')),
        duration_months INTEGER NOT NULL,
        purpose TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'disbursed', 'rejected', 'paid', 'defaulted', 'restructured')),
        approved_by INTEGER,
        approved_at DATETIME,
        disbursed_at DATETIME,
        disbursed_by INTEGER,
        disbursement_method TEXT,
        disbursement_reference TEXT,
        monthly_payment DECIMAL(10,2),
        total_interest DECIMAL(10,2),
        total_amount DECIMAL(10,2),
        remaining_balance DECIMAL(10,2),
        next_payment_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        rejection_reason TEXT,
        guarantor_name TEXT,
        guarantor_phone TEXT,
        guarantor_id_number TEXT,
        collateral_description TEXT,
        risk_score INTEGER DEFAULT 0,
        loan_officer_id INTEGER,
        credit_score INTEGER DEFAULT 0,
        insurance_policy_number TEXT,
        insurance_provider TEXT,
        restructuring_reason TEXT,
        original_loan_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (approved_by) REFERENCES users(id),
        FOREIGN KEY (disbursed_by) REFERENCES users(id),
        FOREIGN KEY (loan_officer_id) REFERENCES users(id),
        FOREIGN KEY (original_loan_id) REFERENCES loans(id)
      )
    `);

    // Collateral Management
    await runQuery(`
      CREATE TABLE IF NOT EXISTS collaterals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id INTEGER NOT NULL,
        collateral_type TEXT NOT NULL CHECK(collateral_type IN ('vehicle', 'property', 'equipment', 'savings', 'guarantor', 'insurance')),
        description TEXT NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        documents TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'released', 'seized')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        released_at DATETIME,
        FOREIGN KEY (loan_id) REFERENCES loans(id)
      )
    `);

    // Guarantors table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS guarantors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        id_number TEXT,
        relationship TEXT,
        monthly_income DECIMAL(10,2),
        guarantor_amount DECIMAL(10,2),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'released')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id)
      )
    `);

    // Investments table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        investment_number TEXT UNIQUE NOT NULL,
        investment_type TEXT NOT NULL CHECK(investment_type IN ('bonds', 'stocks', 'mutual_funds', 'fixed_deposit')),
        amount DECIMAL(10,2) NOT NULL,
        interest_rate DECIMAL(5,2),
        term_months INTEGER,
        start_date DATE NOT NULL,
        maturity_date DATE,
        current_value DECIMAL(10,2),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'matured', 'sold', 'cancelled')),
        risk_profile TEXT DEFAULT 'low' CHECK(risk_profile IN ('low', 'medium', 'high')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Bonds table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS bonds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        investment_id INTEGER NOT NULL,
        bond_type TEXT NOT NULL CHECK(bond_type IN ('government', 'corporate', 'municipal')),
        issuer TEXT NOT NULL,
        face_value DECIMAL(10,2) NOT NULL,
        coupon_rate DECIMAL(5,2),
        maturity_date DATE NOT NULL,
        purchase_price DECIMAL(10,2) NOT NULL,
        current_price DECIMAL(10,2),
        yield_to_maturity DECIMAL(5,2),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'matured', 'sold')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (investment_id) REFERENCES investments(id)
      )
    `);

    // Exchange Rates table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_currency TEXT NOT NULL,
        to_currency TEXT NOT NULL,
        rate DECIMAL(10,4) NOT NULL,
        effective_date DATE NOT NULL,
        source TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(from_currency, to_currency, effective_date)
      )
    `);

    // Enhanced Transactions table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_number TEXT UNIQUE NOT NULL,
        account_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal', 'transfer', 'loan_disbursement', 'loan_repayment', 'interest_credit', 'fee_charge', 'investment_purchase', 'investment_sale', 'bond_purchase', 'bond_sale')),
        amount DECIMAL(10,2) NOT NULL,
        balance_before DECIMAL(10,2) NOT NULL,
        balance_after DECIMAL(10,2) NOT NULL,
        description TEXT NOT NULL,
        reference_id INTEGER,
        reference_type TEXT,
        currency TEXT DEFAULT 'KES',
        exchange_rate DECIMAL(10,4) DEFAULT 1,
        foreign_amount DECIMAL(10,2),
        payment_method TEXT CHECK(payment_method IN ('cash', 'mpesa', 'bank_transfer', 'paypal', 'stripe', 'airtel_money')),
        payment_reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed', 'cancelled')),
        sms_sent BOOLEAN DEFAULT 0,
        email_sent BOOLEAN DEFAULT 0,
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Group Account Features
    await runQuery(`
      CREATE TABLE IF NOT EXISTS group_meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        meeting_date DATE NOT NULL,
        meeting_time TIME,
        location TEXT,
        agenda TEXT,
        minutes TEXT,
        attendance_count INTEGER,
        contributions_collected DECIMAL(10,2),
        loans_approved INTEGER,
        loans_disbursed DECIMAL(10,2),
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Group Voting table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS group_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        vote_type TEXT NOT NULL CHECK(vote_type IN ('loan_approval', 'member_removal', 'rule_change', 'leadership_election')),
        subject_id INTEGER,
        subject_type TEXT,
        description TEXT NOT NULL,
        voting_deadline DATETIME,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed', 'cancelled')),
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Vote Responses
    await runQuery(`
      CREATE TABLE IF NOT EXISTS vote_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vote_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        response TEXT CHECK(response IN ('yes', 'no', 'abstain')),
        comments TEXT,
        voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vote_id) REFERENCES group_votes(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(vote_id, user_id)
      )
    `);

    // Dispute Resolution
    await runQuery(`
      CREATE TABLE IF NOT EXISTS disputes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        complainant_id INTEGER NOT NULL,
        respondent_id INTEGER NOT NULL,
        dispute_type TEXT NOT NULL CHECK(dispute_type IN ('payment', 'contribution', 'loan', 'behavior', 'other')),
        description TEXT NOT NULL,
        evidence TEXT,
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'under_review', 'resolved', 'closed')),
        resolution TEXT,
        resolved_by INTEGER,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (complainant_id) REFERENCES users(id),
        FOREIGN KEY (respondent_id) REFERENCES users(id),
        FOREIGN KEY (resolved_by) REFERENCES users(id)
      )
    `);

    // Enhanced Notifications table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'error', 'transaction', 'loan', 'investment')),
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        action_url TEXT,
        sms_sent BOOLEAN DEFAULT 0,
        email_sent BOOLEAN DEFAULT 0,
        push_sent BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // System Alerts table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS system_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT NOT NULL CHECK(alert_type IN ('security', 'system', 'transaction', 'loan', 'investment')),
        severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'warning', 'error', 'critical')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        affected_users TEXT,
        is_resolved BOOLEAN DEFAULT 0,
        resolved_by INTEGER,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resolved_by) REFERENCES users(id)
      )
    `);

    // API Keys for integrations
    await runQuery(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_name TEXT NOT NULL CHECK(service_name IN ('mpesa', 'airtel_money', 'sms_gateway', 'email_service', 'kyc_api')),
        api_key TEXT NOT NULL,
        api_secret TEXT,
        endpoint_url TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_fixed_deposits_account_id ON fixed_deposits(account_id)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id)`
    );

    console.log("Enhanced database schema initialized successfully");
  } catch (error) {
    console.error("Error initializing enhanced database:", error);
    throw error;
  }
};

// Insert default account types
const insertDefaultAccountTypes = async () => {
  try {
    const accountTypes = [
      {
        name: "Personal Account",
        code: "PERSONAL",
        description: "Individual personal savings account",
        min_balance: 0,
        interest_rate: 5.0,
        requires_kyc: 1,
        allows_joint_accounts: 0,
        allows_group_accounts: 0,
      },
      {
        name: "Youth Group Account",
        code: "YOUTH_GROUP",
        description: "Account for youth group members",
        min_balance: 100,
        interest_rate: 6.0,
        requires_kyc: 1,
        allows_joint_accounts: 0,
        allows_group_accounts: 1,
      },
      {
        name: "Women Group Account",
        code: "WOMEN_GROUP",
        description: "Account for women empowerment groups",
        min_balance: 100,
        interest_rate: 6.5,
        requires_kyc: 1,
        allows_joint_accounts: 0,
        allows_group_accounts: 1,
      },
      {
        name: "Joint Savings Account",
        code: "JOINT_SAVINGS",
        description: "Joint account for multiple individuals",
        min_balance: 500,
        interest_rate: 5.5,
        requires_kyc: 1,
        allows_joint_accounts: 1,
        allows_group_accounts: 0,
      },
      {
        name: "Staff Account",
        code: "STAFF",
        description: "Internal account for staff members",
        min_balance: 0,
        interest_rate: 4.0,
        requires_kyc: 0,
        allows_joint_accounts: 0,
        allows_group_accounts: 0,
      },
    ];

    for (const accountType of accountTypes) {
      await runQuery(
        `
        INSERT OR IGNORE INTO account_types (
          name, code, description, min_balance, interest_rate, 
          requires_kyc, allows_joint_accounts, allows_group_accounts
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          accountType.name,
          accountType.code,
          accountType.description,
          accountType.min_balance,
          accountType.interest_rate,
          accountType.requires_kyc,
          accountType.allows_joint_accounts,
          accountType.allows_group_accounts,
        ]
      );
    }

    console.log("Default account types inserted");
  } catch (error) {
    console.error("Error inserting default account types:", error);
  }
};

// Initialize enhanced database
const initEnhanced = async () => {
  await initializeEnhancedDatabase();
  await insertDefaultAccountTypes();
};

module.exports = {
  db,
  runQuery,
  getRow,
  getAll,
  initEnhanced,
};
