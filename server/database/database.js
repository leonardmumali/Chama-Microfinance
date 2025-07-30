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

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Users table with enhanced fields
    await runQuery(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                phone TEXT,
                role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'loan_officer', 'borrower', 'member')),
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
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
                FOREIGN KEY (kyc_verified_by) REFERENCES users(id)
            )
        `);

    // Roles and permissions table
    await runQuery(`
            CREATE TABLE IF NOT EXISTS roles_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                permission TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(role, permission)
            )
        `);

    // Groups table
    await runQuery(`
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                max_members INTEGER DEFAULT 20,
                current_members INTEGER DEFAULT 0,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
                meeting_schedule TEXT,
                meeting_location TEXT,
                contribution_amount DECIMAL(10,2) DEFAULT 0,
                contribution_frequency TEXT DEFAULT 'monthly',
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);

    // Group members table
    await runQuery(`
            CREATE TABLE IF NOT EXISTS group_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role TEXT DEFAULT 'member' CHECK(role IN ('leader', 'member')),
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
                FOREIGN KEY (group_id) REFERENCES groups(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(group_id, user_id)
            )
        `);

    // Savings accounts table
    await runQuery(`
            CREATE TABLE IF NOT EXISTS savings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                account_number TEXT UNIQUE NOT NULL,
                balance DECIMAL(10,2) DEFAULT 0,
                interest_rate DECIMAL(5,2) DEFAULT 5.0,
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'frozen', 'closed')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_interest_date DATE,
                minimum_balance DECIMAL(10,2) DEFAULT 0,
                account_type TEXT DEFAULT 'personal' CHECK(account_type IN ('personal', 'group')),
                group_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (group_id) REFERENCES groups(id)
            )
        `);

    // Enhanced loans table
    await runQuery(`
            CREATE TABLE IF NOT EXISTS loans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                loan_number TEXT UNIQUE NOT NULL,
                loan_type TEXT NOT NULL CHECK(loan_type IN ('personal', 'business', 'emergency', 'education', 'agriculture')),
                amount DECIMAL(10,2) NOT NULL,
                interest_rate DECIMAL(5,2) NOT NULL,
                interest_type TEXT DEFAULT 'reducing' CHECK(interest_type IN ('flat', 'reducing')),
                duration_months INTEGER NOT NULL,
                purpose TEXT NOT NULL,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'disbursed', 'rejected', 'paid', 'defaulted')),
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
                group_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id),
                FOREIGN KEY (disbursed_by) REFERENCES users(id),
                FOREIGN KEY (loan_officer_id) REFERENCES users(id),
                FOREIGN KEY (group_id) REFERENCES groups(id)
            )
        `);

    // Loan payments table
    await runQuery(`
            CREATE TABLE IF NOT EXISTS loan_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                loan_id INTEGER NOT NULL,
                payment_number TEXT UNIQUE NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_date DATE NOT NULL,
                payment_method TEXT CHECK(payment_method IN ('cash', 'mpesa', 'bank_transfer', 'paypal', 'stripe')),
                payment_reference TEXT,
                late_fee DECIMAL(10,2) DEFAULT 0,
                penalty_fee DECIMAL(10,2) DEFAULT 0,
                received_by INTEGER,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'failed')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (loan_id) REFERENCES loans(id),
                FOREIGN KEY (received_by) REFERENCES users(id)
            )
        `);

    // Transactions table
    await runQuery(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_number TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal', 'loan_disbursement', 'loan_repayment', 'interest_credit', 'fee_charge')),
                amount DECIMAL(10,2) NOT NULL,
                balance_before DECIMAL(10,2) NOT NULL,
                balance_after DECIMAL(10,2) NOT NULL,
                description TEXT NOT NULL,
                reference_id INTEGER,
                reference_type TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed', 'cancelled')),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);

    // Documents table for KYC
    await runQuery(`
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                document_type TEXT NOT NULL CHECK(document_type IN ('id_card', 'passport', 'drivers_license', 'utility_bill', 'bank_statement', 'payslip', 'employment_letter', 'business_license', 'tax_clearance')),
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                verified_at DATETIME,
                verified_by INTEGER,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected')),
                rejection_reason TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (verified_by) REFERENCES users(id)
            )
        `);

    // Notifications table
    await runQuery(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'error')),
                is_read BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                action_url TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

    // Audit logs table
    await runQuery(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                table_name TEXT,
                record_id INTEGER,
                old_values TEXT,
                new_values TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

    // Settings table
    await runQuery(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT UNIQUE NOT NULL,
                setting_value TEXT,
                description TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Create indexes for better performance
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    );
    await runQuery(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`
    );
    await runQuery(
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`
    );

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const adminExists = await getRow("SELECT id FROM users WHERE role = ?", [
      "admin",
    ]);
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await runQuery(
        `
                INSERT INTO users (username, email, password, first_name, last_name, role, status, kyc_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
        [
          "admin",
          "admin@chama.com",
          hashedPassword,
          "System",
          "Administrator",
          "admin",
          "active",
          "verified",
        ]
      );

      // Create personal savings account for admin
      await runQuery(
        `
                INSERT INTO savings (user_id, account_number, balance, status)
                VALUES (?, ?, ?, ?)
            `,
        [1, "ADMIN001", 0, "active"]
      );

      console.log("Default admin user created");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};

// Insert default roles and permissions
const insertDefaultRolesPermissions = async () => {
  try {
    const permissions = [
      // Admin permissions
      ["admin", "user_management"],
      ["admin", "loan_management"],
      ["admin", "savings_management"],
      ["admin", "transaction_management"],
      ["admin", "group_management"],
      ["admin", "kyc_verification"],
      ["admin", "reports_access"],
      ["admin", "settings_management"],
      ["admin", "audit_logs"],

      // Loan officer permissions
      ["loan_officer", "loan_management"],
      ["loan_officer", "kyc_verification"],
      ["loan_officer", "reports_access"],

      // Borrower permissions
      ["borrower", "loan_application"],
      ["borrower", "loan_view"],
      ["borrower", "savings_management"],
      ["borrower", "profile_management"],

      // Member permissions
      ["member", "savings_management"],
      ["member", "profile_management"],
      ["member", "group_management"],
    ];

    for (const [role, permission] of permissions) {
      await runQuery(
        `
                INSERT OR IGNORE INTO roles_permissions (role, permission)
                VALUES (?, ?)
            `,
        [role, permission]
      );
    }

    console.log("Default roles and permissions inserted");
  } catch (error) {
    console.error("Error inserting default roles and permissions:", error);
  }
};

// Insert default settings
const insertDefaultSettings = async () => {
  try {
    const settings = [
      ["organization_name", "Chama Microfinance", "Organization name"],
      ["organization_email", "info@chama.com", "Organization email"],
      ["organization_phone", "+254700000000", "Organization phone"],
      ["organization_address", "Nairobi, Kenya", "Organization address"],
      ["default_interest_rate", "12.0", "Default loan interest rate (%)"],
      ["default_loan_duration", "12", "Default loan duration (months)"],
      ["minimum_loan_amount", "1000", "Minimum loan amount"],
      ["maximum_loan_amount", "100000", "Maximum loan amount"],
      ["savings_interest_rate", "5.0", "Savings account interest rate (%)"],
      ["late_payment_penalty", "5.0", "Late payment penalty rate (%)"],
      ["mpesa_shortcode", "123456", "M-PESA shortcode"],
      ["mpesa_passkey", "", "M-PESA passkey"],
      ["smtp_host", "", "SMTP host for emails"],
      ["smtp_port", "587", "SMTP port"],
      ["smtp_user", "", "SMTP username"],
      ["smtp_pass", "", "SMTP password"],
      ["sms_api_key", "", "SMS API key"],
      ["sms_api_secret", "", "SMS API secret"],
    ];

    for (const [key, value, description] of settings) {
      await runQuery(
        `
                INSERT OR IGNORE INTO settings (setting_key, setting_value, description)
                VALUES (?, ?, ?)
            `,
        [key, value, description]
      );
    }

    console.log("Default settings inserted");
  } catch (error) {
    console.error("Error inserting default settings:", error);
  }
};

// Initialize everything
const init = async () => {
  await initializeDatabase();
  await createDefaultAdmin();
  await insertDefaultRolesPermissions();
  await insertDefaultSettings();
};

// Initialize when this module is loaded
init().catch(console.error);

module.exports = {
  db,
  runQuery,
  getRow,
  getAll,
  init,
};
