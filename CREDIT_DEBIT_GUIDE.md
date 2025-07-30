# Credit/Debit Account Functionality Guide

## Overview

I've added comprehensive credit and debit functionality to your Chama system. This allows administrators and managers to credit (add money) and debit (remove money) from user accounts.

## New API Endpoints

### 1. Credit Account

**Endpoint:** `POST /api/accounts/:id/credit`
**Access:** Admin/Manager only

**Request Body:**

```json
{
  "amount": 1000.0,
  "description": "Bonus payment",
  "reference": "BONUS_2024_001"
}
```

**Response:**

```json
{
  "message": "Account credited successfully",
  "transaction_number": "TXN1234567890123",
  "new_balance": 2500.0,
  "credited_amount": 1000.0
}
```

### 2. Debit Account

**Endpoint:** `POST /api/accounts/:id/debit`
**Access:** Admin/Manager only

**Request Body:**

```json
{
  "amount": 500.0,
  "description": "Service fee",
  "reference": "FEE_2024_001"
}
```

**Response:**

```json
{
  "message": "Account debited successfully",
  "transaction_number": "TXN1234567890124",
  "new_balance": 2000.0,
  "debited_amount": 500.0
}
```

### 3. Get Account Balance

**Endpoint:** `GET /api/accounts/:id/balance`
**Access:** Account owner or Admin/Manager

**Response:**

```json
{
  "account_id": 1,
  "account_number": "CH123456789",
  "account_name": "Main Savings",
  "balance": 2000.0
}
```

## Frontend Components

### 1. Admin Account Management (`/admin/account-management`)

- **Location:** `client/src/pages/admin/AccountManagement.jsx`
- **Features:**
  - View all accounts with balances
  - Credit accounts (add money)
  - Debit accounts (remove money)
  - Real-time balance updates
  - Transaction history

### 2. User Account View (`/accounts`)

- **Location:** `client/src/pages/accounts/Accounts.jsx`
- **Features:**
  - View own accounts
  - Check account balances
  - View transaction history
  - Account details

## Security Features

1. **Role-based Access Control:**

   - Only admins and managers can credit/debit accounts
   - Users can only view their own accounts

2. **Validation:**

   - Amount must be positive
   - Account must be active
   - Sufficient balance check for debits
   - Minimum balance protection

3. **Transaction Tracking:**
   - All operations create transaction records
   - Audit trail with before/after balances
   - Unique transaction numbers

## How to Use

### For Administrators:

1. **Access the Admin Panel:**

   - Login as an admin user
   - Navigate to Account Management

2. **Credit an Account:**

   - Select the account from the dropdown
   - Choose "Credit (Add Money)"
   - Enter the amount
   - Add description and reference (optional)
   - Click "Credit Account"

3. **Debit an Account:**
   - Select the account from the dropdown
   - Choose "Debit (Remove Money)"
   - Enter the amount
   - Add description and reference (optional)
   - Click "Debit Account"

### For Users:

1. **View Your Accounts:**
   - Login to your account
   - Navigate to "Accounts" section
   - View account balances and transaction history

## Testing the Functionality

Use the provided test script:

```bash
node test_credit_debit.js
```

**Before running:**

1. Update `ADMIN_TOKEN` with a real admin JWT token
2. Update `TEST_ACCOUNT_ID` with a real account ID
3. Ensure your server is running on port 3001

## Database Schema

The functionality uses existing tables:

- `accounts` - Account information and balances
- `transactions` - Transaction history and audit trail

## Error Handling

The system handles various error scenarios:

1. **Insufficient Balance:**

   ```json
   {
     "message": "Insufficient balance",
     "current_balance": 1000.0,
     "requested_amount": 1500.0
   }
   ```

2. **Minimum Balance Violation:**

   ```json
   {
     "message": "Debit would violate minimum balance requirement",
     "minimum_balance": 100.0,
     "remaining_balance": 50.0
   }
   ```

3. **Access Denied:**
   ```json
   {
     "message": "Access denied. Admin or Manager role required."
   }
   ```

## Transaction Types

The system now supports these transaction types:

- `credit` - Account credit (admin operation)
- `debit` - Account debit (admin operation)
- `deposit` - User deposit
- `withdrawal` - User withdrawal
- `loan_disbursement` - Loan disbursement
- `loan_repayment` - Loan repayment

## Integration with Existing Features

The credit/debit functionality integrates seamlessly with:

- Existing deposit/withdrawal system
- Transaction history
- Account statements
- Balance calculations
- Audit trails

## Troubleshooting

### Common Issues:

1. **"Access denied" error:**

   - Ensure you're logged in as admin/manager
   - Check your JWT token is valid

2. **"Account not found" error:**

   - Verify the account ID exists
   - Ensure the account is active

3. **"Insufficient balance" error:**

   - Check current account balance
   - Reduce debit amount

4. **"Invalid amount" error:**
   - Ensure amount is positive
   - Check for valid number format

## Future Enhancements

Potential improvements:

1. Bulk credit/debit operations
2. Scheduled transactions
3. Approval workflows
4. Enhanced reporting
5. SMS/Email notifications
6. Transaction limits and restrictions

## Support

If you encounter any issues:

1. Check the server logs for error details
2. Verify your authentication token
3. Ensure the account exists and is active
4. Test with the provided test script
