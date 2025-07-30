import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  FaPlus,
  FaUser,
  FaUsers,
  FaPiggyBank,
  FaBuilding,
  FaCog,
  FaEye,
  FaDownload,
  FaBell,
  FaEnvelope,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

const AccountManagement = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    account_type_id: "",
    account_name: "",
    group_id: "",
    joint_members: [],
    currency: "KES",
  });

  useEffect(() => {
    fetchAccounts();
    fetchAccountTypes();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get("/accounts/my-accounts");
      setAccounts(response.data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Error fetching accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountTypes = async () => {
    try {
      const response = await axios.get("/accounts/types");
      setAccountTypes(response.data);
    } catch (error) {
      console.error("Error fetching account types:", error);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/accounts/create", formData);
      toast.success("Account created successfully!");
      setShowCreateModal(false);
      setFormData({
        account_type_id: "",
        account_name: "",
        group_id: "",
        joint_members: [],
        currency: "KES",
      });
      fetchAccounts();
    } catch (error) {
      const message = error.response?.data?.message || "Error creating account";
      toast.error(message);
    }
  };

  const handleViewDetails = async (accountId) => {
    try {
      const response = await axios.get(`/accounts/${accountId}`);
      setSelectedAccount(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error("Error fetching account details");
    }
  };

  const getAccountTypeIcon = (code) => {
    switch (code) {
      case "PERSONAL":
        return <FaUser className="text-primary" />;
      case "YOUTH_GROUP":
      case "WOMEN_GROUP":
        return <FaUsers className="text-success" />;
      case "JOINT_SAVINGS":
        return <FaPiggyBank className="text-warning" />;
      case "STAFF":
        return <FaBuilding className="text-info" />;
      default:
        return <FaUser className="text-secondary" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: "badge bg-success",
      pending: "badge bg-warning",
      frozen: "badge bg-danger",
      closed: "badge bg-secondary",
    };
    return (
      <span className={statusClasses[status] || "badge bg-secondary"}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${isDarkMode ? "bg-dark text-light" : "bg-light"}`}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-2">Account Management</h1>
                <p className="text-muted">
                  Manage your savings accounts and view account details
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus className="me-2" />
                Create New Account
              </button>
            </div>
          </div>
        </div>

        {/* Account Types Overview */}
        <div className="row mb-4">
          <div className="col-12">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-header">
                <h5 className="mb-0">Available Account Types</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {accountTypes.map((type) => (
                    <div key={type.id} className="col-md-4 mb-3">
                      <div className="border rounded p-3">
                        <div className="d-flex align-items-center mb-2">
                          {getAccountTypeIcon(type.code)}
                          <h6 className="mb-0 ms-2">{type.name}</h6>
                        </div>
                        <p className="text-muted small mb-2">
                          {type.description}
                        </p>
                        <div className="row text-center">
                          <div className="col-6">
                            <small className="text-muted">Min Balance</small>
                            <div className="fw-bold">
                              KES {type.min_balance?.toLocaleString()}
                            </div>
                          </div>
                          <div className="col-6">
                            <small className="text-muted">Interest Rate</small>
                            <div className="fw-bold">{type.interest_rate}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Accounts */}
        <div className="row">
          <div className="col-12">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-header">
                <h5 className="mb-0">My Accounts</h5>
              </div>
              <div className="card-body">
                {accounts.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Type</th>
                          <th>Balance</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((account) => (
                          <tr key={account.id}>
                            <td>
                              <div>
                                <div className="fw-bold">
                                  {account.account_name}
                                </div>
                                <small className="text-muted">
                                  {account.account_number}
                                </small>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                {getAccountTypeIcon(account.account_type_code)}
                                <span className="ms-2">
                                  {account.account_type_name}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="fw-bold">
                                KES {account.balance?.toLocaleString()}
                              </div>
                              <small className="text-muted">
                                Available: KES{" "}
                                {account.available_balance?.toLocaleString()}
                              </small>
                            </td>
                            <td>{getStatusBadge(account.status)}</td>
                            <td>
                              <div className="btn-group" role="group">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleViewDetails(account.id)}
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  title="Download Statement"
                                >
                                  <FaDownload />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  title="Account Settings"
                                >
                                  <FaCog />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FaPiggyBank size={48} className="text-muted mb-3" />
                    <h5>No accounts found</h5>
                    <p className="text-muted">
                      Create your first account to start saving
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <FaPlus className="me-2" />
                      Create Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div
              className={`modal-content ${
                isDarkMode ? "bg-dark text-light" : ""
              }`}
            >
              <div className="modal-header">
                <h5 className="modal-title">Create New Account</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateAccount}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Account Type</label>
                      <select
                        className="form-select"
                        value={formData.account_type_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            account_type_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Select Account Type</option>
                        {accountTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Account Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.account_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            account_name: e.target.value,
                          })
                        }
                        placeholder="Enter account name"
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Currency</label>
                      <select
                        className="form-select"
                        value={formData.currency}
                        onChange={(e) =>
                          setFormData({ ...formData, currency: e.target.value })
                        }
                      >
                        <option value="KES">Kenyan Shilling (KES)</option>
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Notifications</label>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="smsNotifications"
                          defaultChecked
                        />
                        <label
                          className="form-check-label"
                          htmlFor="smsNotifications"
                        >
                          <FaBell className="me-1" />
                          SMS Notifications
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="emailNotifications"
                          defaultChecked
                        />
                        <label
                          className="form-check-label"
                          htmlFor="emailNotifications"
                        >
                          <FaEnvelope className="me-1" />
                          Email Notifications
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Account Details Modal */}
      {showDetailsModal && selectedAccount && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div
              className={`modal-content ${
                isDarkMode ? "bg-dark text-light" : ""
              }`}
            >
              <div className="modal-header">
                <h5 className="modal-title">Account Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Account Information</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td>Account Number:</td>
                          <td>{selectedAccount.account.account_number}</td>
                        </tr>
                        <tr>
                          <td>Virtual Account:</td>
                          <td>
                            {selectedAccount.account.virtual_account_number}
                          </td>
                        </tr>
                        <tr>
                          <td>Account Type:</td>
                          <td>{selectedAccount.account.account_type_name}</td>
                        </tr>
                        <tr>
                          <td>Status:</td>
                          <td>
                            {getStatusBadge(selectedAccount.account.status)}
                          </td>
                        </tr>
                        <tr>
                          <td>Balance:</td>
                          <td>
                            KES{" "}
                            {selectedAccount.account.balance?.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td>Interest Rate:</td>
                          <td>{selectedAccount.account.interest_rate}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6>Recent Transactions</h6>
                    {selectedAccount.recentTransactions.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedAccount.recentTransactions
                              .slice(0, 5)
                              .map((txn) => (
                                <tr key={txn.id}>
                                  <td>
                                    {new Date(
                                      txn.created_at
                                    ).toLocaleDateString()}
                                  </td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        txn.type === "deposit"
                                          ? "bg-success"
                                          : "bg-danger"
                                      }`}
                                    >
                                      {txn.type}
                                    </span>
                                  </td>
                                  <td>KES {txn.amount?.toLocaleString()}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted">No recent transactions</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
