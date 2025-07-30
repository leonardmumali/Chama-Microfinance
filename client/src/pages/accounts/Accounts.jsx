import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Accounts = () => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/api/accounts/my-accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedAccount(response.data[0].id);
        fetchTransactions(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (accountId) => {
    if (!accountId) return;
    
    try {
      setTransactionsLoading(true);
      const response = await axios.get(`/api/accounts/${accountId}/statement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleAccountChange = (accountId) => {
    setSelectedAccount(accountId);
    fetchTransactions(accountId);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'deposit':
      case 'credit':
        return 'text-green-600';
      case 'withdrawal':
      case 'debit':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Accounts</h1>
        
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-4">No accounts found</div>
            <p className="text-gray-400">You don't have any active accounts yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Selection */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Select Account</h2>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => handleAccountChange(account.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAccount === account.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        {account.account_name}
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {account.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {account.account_number}
                    </div>
                    <div className="text-sm text-gray-600">
                      {account.account_type_name}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 mt-2">
                      {formatCurrency(account.balance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Details and Transactions */}
            <div className="lg:col-span-2">
              {selectedAccount && (
                <>
                  {/* Account Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Account Details</h3>
                    {accounts.find(acc => acc.id === selectedAccount) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Account Number</div>
                          <div className="font-medium">{accounts.find(acc => acc.id === selectedAccount).account_number}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Account Type</div>
                          <div className="font-medium">{accounts.find(acc => acc.id === selectedAccount).account_type_name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Current Balance</div>
                          <div className="font-semibold text-lg">{formatCurrency(accounts.find(acc => acc.id === selectedAccount).balance)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Status</div>
                          <div className="font-medium">{accounts.find(acc => acc.id === selectedAccount).status}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent Transactions */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Transactions</h3>
                    
                    {transactionsLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No transactions found for this account
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Balance
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map((transaction) => (
                              <tr key={transaction.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(transaction.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                                    transaction.type === 'deposit' || transaction.type === 'credit'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {transaction.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {transaction.description}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTransactionTypeColor(transaction.type)}`}>
                                  {transaction.type === 'withdrawal' || transaction.type === 'debit' ? '-' : '+'}
                                  {formatCurrency(transaction.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(transaction.balance_after)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;
