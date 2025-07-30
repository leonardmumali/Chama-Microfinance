import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const AccountManagement = () => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [operation, setOperation] = useState('credit'); // 'credit' or 'debit'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/api/accounts/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountOperation = async (e) => {
    e.preventDefault();
    
    if (!selectedAccount) {
      setError('Please select an account');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      const endpoint = operation === 'credit' ? 'credit' : 'debit';
      const response = await axios.post(
        `/api/accounts/${selectedAccount}/${endpoint}`,
        {
          amount: parseFloat(amount),
          description,
          reference
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage(response.data.message);
      setAmount('');
      setDescription('');
      setReference('');
      fetchAccounts(); // Refresh accounts to get updated balances
    } catch (error) {
      console.error(`Error ${operation}ing account:`, error);
      setError(error.response?.data?.message || `Failed to ${operation} account`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Account Management</h1>
        
        {/* Credit/Debit Form */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Credit/Debit Account</h2>
          
          <form onSubmit={handleAccountOperation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Account
                </label>
                <select
                  value={selectedAccount || ''}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose an account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_number} - {account.account_name} ({account.first_name} {account.last_name}) - {formatCurrency(account.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operation Type
                </label>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="credit">Credit (Add Money)</option>
                  <option value="debit">Debit (Remove Money)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (KES)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Transaction description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional reference"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded-md text-white font-medium ${
                  operation === 'credit'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Processing...' : operation === 'credit' ? 'Credit Account' : 'Debit Account'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setAmount('');
                  setDescription('');
                  setReference('');
                  setSelectedAccount(null);
                  setError('');
                  setMessage('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Clear Form
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              {message}
            </div>
          )}
        </div>

        {/* Accounts List */}
        <div className="bg-white rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">All Accounts</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.account_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.account_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.account_type_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.first_name} {account.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(account.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : account.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {account.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {accounts.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No accounts found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountManagement; 