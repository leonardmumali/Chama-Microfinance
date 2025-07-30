import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

const Savings = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [accounts, setAccounts] = useState([]);
  const [fixedDeposits, setFixedDeposits] = useState([]);
  const [targetSavings, setTargetSavings] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showFixedDepositModal, setShowFixedDepositModal] = useState(false);
  const [showTargetSavingsModal, setShowTargetSavingsModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    payment_method: "cash",
    payment_reference: "",
  });
  const [fixedDepositData, setFixedDepositData] = useState({
    account_id: "",
    amount: "",
    term_months: 12,
    interest_rate: 8.0,
    auto_renewal: false,
    renewal_term_months: 12,
  });
  const [targetSavingsData, setTargetSavingsData] = useState({
    account_id: "",
    target_name: "",
    target_amount: "",
    target_date: "",
    frequency: "monthly",
    contribution_amount: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsRes, fixedDepositsRes, targetSavingsRes, statisticsRes] =
        await Promise.all([
          axios.get("/api/savings/my-accounts", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          axios.get("/api/savings/fixed-deposits", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          axios.get("/api/savings/target-savings", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          axios.get("/api/savings/statistics", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);

      setAccounts(accountsRes.data);
      setFixedDeposits(fixedDepositsRes.data);
      setTargetSavings(targetSavingsRes.data);
      setStatistics(statisticsRes.data);
    } catch (error) {
      console.error("Error fetching savings data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      const response = await axios.post(
        "/api/savings/deposit",
        {
          ...formData,
          account_id: selectedAccount.id,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      alert("Deposit successful!");
      setShowDepositModal(false);
      setFormData({
        amount: "",
        description: "",
        payment_method: "cash",
        payment_reference: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error making deposit:", error);
      alert("Error making deposit. Please try again.");
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      const response = await axios.post(
        "/api/savings/withdraw",
        {
          ...formData,
          account_id: selectedAccount.id,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      alert("Withdrawal successful!");
      setShowWithdrawModal(false);
      setFormData({
        amount: "",
        description: "",
        payment_method: "cash",
        payment_reference: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error making withdrawal:", error);
      alert("Error making withdrawal. Please try again.");
    }
  };

  const handleCreateFixedDeposit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "/api/savings/fixed-deposits",
        fixedDepositData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      alert("Fixed deposit created successfully!");
      setShowFixedDepositModal(false);
      setFixedDepositData({
        account_id: "",
        amount: "",
        term_months: 12,
        interest_rate: 8.0,
        auto_renewal: false,
        renewal_term_months: 12,
      });
      fetchData();
    } catch (error) {
      console.error("Error creating fixed deposit:", error);
      alert("Error creating fixed deposit. Please try again.");
    }
  };

  const handleCreateTargetSavings = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "/api/savings/target-savings",
        targetSavingsData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      alert("Target savings created successfully!");
      setShowTargetSavingsModal(false);
      setTargetSavingsData({
        account_id: "",
        target_name: "",
        target_amount: "",
        target_date: "",
        frequency: "monthly",
        contribution_amount: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating target savings:", error);
      alert("Error creating target savings. Please try again.");
    }
  };

  const handleEarlyWithdrawal = async (depositId) => {
    if (
      !confirm(
        "Are you sure you want to withdraw this fixed deposit early? There will be a penalty."
      )
    ) {
      return;
    }

    try {
      const response = await axios.post(
        `/api/savings/fixed-deposits/${depositId}/withdraw`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      alert("Early withdrawal successful!");
      fetchData();
    } catch (error) {
      console.error("Error withdrawing fixed deposit:", error);
      alert("Error withdrawing fixed deposit. Please try again.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: "bg-success",
      completed: "bg-info",
      withdrawn: "bg-warning",
      matured: "bg-primary",
    };
    return (
      <span className={`badge ${statusColors[status] || "bg-secondary"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className={`p-4 ${isDarkMode ? "bg-dark text-light" : "bg-light"}`}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="mb-0">💰 Savings & Fixed Deposits</h4>
                <div>
                  <button
                    className="btn btn-primary me-2"
                    onClick={() => setShowDepositModal(true)}
                  >
                    💰 Deposit
                  </button>
                  <button
                    className="btn btn-success me-2"
                    onClick={() => setShowFixedDepositModal(true)}
                  >
                    📈 Create Fixed Deposit
                  </button>
                  <button
                    className="btn btn-info"
                    onClick={() => setShowTargetSavingsModal(true)}
                  >
                    🎯 Create Target Savings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-body text-center">
                <h3 className="text-primary">
                  {formatCurrency(statistics.total_balance || 0)}
                </h3>
                <p className="mb-0">Total Balance</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-body text-center">
                <h3 className="text-success">
                  {formatCurrency(statistics.fixed_deposits?.total_amount || 0)}
                </h3>
                <p className="mb-0">Fixed Deposits</p>
                <small className="text-muted">
                  {statistics.fixed_deposits?.count || 0} active
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-body text-center">
                <h3 className="text-info">
                  {formatCurrency(statistics.target_savings?.total_target || 0)}
                </h3>
                <p className="mb-0">Target Savings</p>
                <small className="text-muted">
                  {statistics.target_savings?.count || 0} active
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-body text-center">
                <h3 className="text-warning">
                  {formatCurrency(statistics.monthly_deposits || 0)}
                </h3>
                <p className="mb-0">Monthly Deposits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="row mb-4">
          <div className="col-12">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-body">
                <ul className="nav nav-tabs" id="savingsTab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${
                        activeTab === "overview" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("overview")}
                    >
                      📋 Overview
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${
                        activeTab === "accounts" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("accounts")}
                    >
                      🏦 Regular Savings
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${
                        activeTab === "fixed-deposits" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("fixed-deposits")}
                    >
                      📈 Fixed Deposits
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${
                        activeTab === "target-savings" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("target-savings")}
                    >
                      🎯 Target Savings
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="row">
          <div className="col-12">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-body">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <h5>📊 Savings Overview</h5>
                      <div className="row">
                        <div className="col-6">
                          <div className="text-center p-3">
                            <h4 className="text-primary">{accounts.length}</h4>
                            <p>Active Accounts</p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-center p-3">
                            <h4 className="text-success">
                              {
                                fixedDeposits.filter(
                                  (fd) => fd.status === "active"
                                ).length
                              }
                            </h4>
                            <p>Active Fixed Deposits</p>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-6">
                          <div className="text-center p-3">
                            <h4 className="text-info">
                              {
                                targetSavings.filter(
                                  (ts) => ts.status === "active"
                                ).length
                              }
                            </h4>
                            <p>Active Target Savings</p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-center p-3">
                            <h4 className="text-warning">
                              {formatCurrency(statistics.monthly_deposits || 0)}
                            </h4>
                            <p>This Month's Deposits</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <h5>⚡ Quick Actions</h5>
                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-primary"
                          onClick={() => setShowDepositModal(true)}
                        >
                          💰 Make Deposit
                        </button>
                        <button
                          className="btn btn-success"
                          onClick={() => setShowFixedDepositModal(true)}
                        >
                          📈 Create Fixed Deposit
                        </button>
                        <button
                          className="btn btn-info"
                          onClick={() => setShowTargetSavingsModal(true)}
                        >
                          🎯 Create Target Savings
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Regular Savings Accounts Tab */}
                {activeTab === "accounts" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>🏦 Regular Savings Accounts</h5>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={fetchData}
                        disabled={loading}
                      >
                        {loading ? "Loading..." : "🔄 Refresh"}
                      </button>
                    </div>
                    {loading ? (
                      <div className="text-center">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : accounts.length === 0 ? (
                      <div className="text-center py-4">
                        <p>No savings accounts found.</p>
                      </div>
                    ) : (
                      <div className="row">
                        {accounts.map((account) => (
                          <div
                            key={account.id}
                            className="col-md-6 col-lg-4 mb-4"
                          >
                            <div
                              className={`card h-100 ${
                                isDarkMode
                                  ? "bg-dark text-light border-secondary"
                                  : "bg-white"
                              }`}
                            >
                              <div className="card-header">
                                <h6 className="mb-0">{account.account_name}</h6>
                              </div>
                              <div className="card-body">
                                <div className="mb-2">
                                  <strong>Account Number:</strong>
                                  <br />
                                  <span className="text-muted">
                                    {account.account_number}
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <strong>Balance:</strong>
                                  <br />
                                  <span className="text-success fs-5">
                                    {formatCurrency(account.balance)}
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <strong>Account Type:</strong>
                                  <br />
                                  <span className="text-info">
                                    {account.account_type_name}
                                  </span>
                                </div>
                                {account.group_name && (
                                  <div className="mb-2">
                                    <strong>Group:</strong>
                                    <br />
                                    <span className="text-muted">
                                      {account.group_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="card-footer">
                                <div className="row">
                                  <div className="col-6">
                                    <button
                                      className="btn btn-outline-primary btn-sm w-100"
                                      onClick={() => {
                                        setSelectedAccount(account);
                                        setShowDepositModal(true);
                                      }}
                                    >
                                      💰 Deposit
                                    </button>
                                  </div>
                                  <div className="col-6">
                                    <button
                                      className="btn btn-outline-success btn-sm w-100"
                                      onClick={() => {
                                        setSelectedAccount(account);
                                        setShowWithdrawModal(true);
                                      }}
                                    >
                                      💸 Withdraw
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Fixed Deposits Tab */}
                {activeTab === "fixed-deposits" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>📈 Fixed Deposits</h5>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => setShowFixedDepositModal(true)}
                      >
                        📈 Create New
                      </button>
                    </div>
                    {loading ? (
                      <div className="text-center">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : fixedDeposits.length === 0 ? (
                      <div className="text-center py-4">
                        <p>
                          No fixed deposits found. Create your first fixed
                          deposit!
                        </p>
                        <button
                          className="btn btn-success"
                          onClick={() => setShowFixedDepositModal(true)}
                        >
                          📈 Create Fixed Deposit
                        </button>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table
                          className={`table ${isDarkMode ? "table-dark" : ""}`}
                        >
                          <thead>
                            <tr>
                              <th>Deposit #</th>
                              <th>Amount</th>
                              <th>Interest Rate</th>
                              <th>Term</th>
                              <th>Maturity Date</th>
                              <th>Total Amount</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fixedDeposits.map((deposit) => (
                              <tr key={deposit.id}>
                                <td>{deposit.deposit_number}</td>
                                <td>{formatCurrency(deposit.amount)}</td>
                                <td>{deposit.interest_rate}%</td>
                                <td>{deposit.term_months} months</td>
                                <td>
                                  {new Date(
                                    deposit.maturity_date
                                  ).toLocaleDateString()}
                                </td>
                                <td>{formatCurrency(deposit.total_amount)}</td>
                                <td>{getStatusBadge(deposit.status)}</td>
                                <td>
                                  {deposit.status === "active" && (
                                    <button
                                      className="btn btn-sm btn-warning"
                                      onClick={() =>
                                        handleEarlyWithdrawal(deposit.id)
                                      }
                                    >
                                      ⚠️ Early Withdraw
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Target Savings Tab */}
                {activeTab === "target-savings" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>🎯 Target Savings</h5>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => setShowTargetSavingsModal(true)}
                      >
                        🎯 Create New
                      </button>
                    </div>
                    {loading ? (
                      <div className="text-center">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : targetSavings.length === 0 ? (
                      <div className="text-center py-4">
                        <p>
                          No target savings found. Create your first target
                          savings goal!
                        </p>
                        <button
                          className="btn btn-info"
                          onClick={() => setShowTargetSavingsModal(true)}
                        >
                          🎯 Create Target Savings
                        </button>
                      </div>
                    ) : (
                      <div className="row">
                        {targetSavings.map((target) => (
                          <div
                            key={target.id}
                            className="col-md-6 col-lg-4 mb-4"
                          >
                            <div
                              className={`card h-100 ${
                                isDarkMode
                                  ? "bg-dark text-light border-secondary"
                                  : "bg-white"
                              }`}
                            >
                              <div className="card-header">
                                <h6 className="mb-0">{target.target_name}</h6>
                                {getStatusBadge(target.status)}
                              </div>
                              <div className="card-body">
                                <div className="mb-3">
                                  <strong>Target Amount:</strong>
                                  <br />
                                  <span className="text-primary fs-5">
                                    {formatCurrency(target.target_amount)}
                                  </span>
                                </div>
                                <div className="mb-3">
                                  <strong>Current Amount:</strong>
                                  <br />
                                  <span className="text-success fs-5">
                                    {formatCurrency(target.current_amount)}
                                  </span>
                                </div>
                                <div className="mb-3">
                                  <strong>Progress:</strong>
                                  <div className="progress">
                                    <div
                                      className="progress-bar"
                                      style={{
                                        width: `${calculateProgress(
                                          target.current_amount,
                                          target.target_amount
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <small className="text-muted">
                                    {calculateProgress(
                                      target.current_amount,
                                      target.target_amount
                                    ).toFixed(1)}
                                    %
                                  </small>
                                </div>
                                <div className="mb-2">
                                  <strong>Target Date:</strong>
                                  <br />
                                  <span className="text-muted">
                                    {new Date(
                                      target.target_date
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <strong>Frequency:</strong>
                                  <br />
                                  <span className="text-info">
                                    {target.frequency}
                                  </span>
                                </div>
                                {target.contribution_amount && (
                                  <div className="mb-2">
                                    <strong>Contribution:</strong>
                                    <br />
                                    <span className="text-warning">
                                      {formatCurrency(
                                        target.contribution_amount
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="card-footer">
                                {target.status === "active" && (
                                  <button className="btn btn-success btn-sm w-100">
                                    💰 Contribute
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Modal */}
        {showDepositModal && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog">
              <div
                className={`modal-content ${
                  isDarkMode ? "bg-dark text-light" : ""
                }`}
              >
                <div className="modal-header">
                  <h5 className="modal-title">💰 Make Deposit</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDepositModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleDeposit}>
                    <div className="mb-3">
                      <label className="form-label">Account</label>
                      <select
                        className="form-select"
                        value={selectedAccount?.id || ""}
                        onChange={(e) => {
                          const account = accounts.find(
                            (acc) => acc.id === parseInt(e.target.value)
                          );
                          setSelectedAccount(account);
                        }}
                        required
                      >
                        <option value="">Select Account</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name} - {account.account_number} (
                            {formatCurrency(account.balance)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Amount (KES)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        placeholder="Enter amount"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter description"
                        rows="3"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Payment Method</label>
                      <select
                        className="form-select"
                        value={formData.payment_method}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            payment_method: e.target.value,
                          })
                        }
                      >
                        <option value="cash">Cash</option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Payment Reference</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.payment_reference}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            payment_reference: e.target.value,
                          })
                        }
                        placeholder="Enter payment reference"
                      />
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowDepositModal(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        💰 Deposit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog">
              <div
                className={`modal-content ${
                  isDarkMode ? "bg-dark text-light" : ""
                }`}
              >
                <div className="modal-header">
                  <h5 className="modal-title">💸 Make Withdrawal</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowWithdrawModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleWithdraw}>
                    <div className="mb-3">
                      <label className="form-label">Account</label>
                      <select
                        className="form-select"
                        value={selectedAccount?.id || ""}
                        onChange={(e) => {
                          const account = accounts.find(
                            (acc) => acc.id === parseInt(e.target.value)
                          );
                          setSelectedAccount(account);
                        }}
                        required
                      >
                        <option value="">Select Account</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name} - {account.account_number} (
                            {formatCurrency(account.balance)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Amount (KES)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        placeholder="Enter amount"
                        max={selectedAccount?.balance}
                        required
                      />
                      {selectedAccount && (
                        <small className="text-muted">
                          Available: {formatCurrency(selectedAccount.balance)}
                        </small>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter description"
                        rows="3"
                      />
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowWithdrawModal(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-success">
                        💸 Withdraw
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Deposit Modal */}
        {showFixedDepositModal && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg">
              <div
                className={`modal-content ${
                  isDarkMode ? "bg-dark text-light" : ""
                }`}
              >
                <div className="modal-header">
                  <h5 className="modal-title">📈 Create Fixed Deposit</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowFixedDepositModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleCreateFixedDeposit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Source Account</label>
                          <select
                            className="form-select"
                            value={fixedDepositData.account_id}
                            onChange={(e) =>
                              setFixedDepositData({
                                ...fixedDepositData,
                                account_id: e.target.value,
                              })
                            }
                            required
                          >
                            <option value="">Select Account</option>
                            {accounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.account_name} -{" "}
                                {formatCurrency(account.balance)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Amount (KES)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={fixedDepositData.amount}
                            onChange={(e) =>
                              setFixedDepositData({
                                ...fixedDepositData,
                                amount: e.target.value,
                              })
                            }
                            placeholder="Enter amount"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Term (Months)</label>
                          <select
                            className="form-select"
                            value={fixedDepositData.term_months}
                            onChange={(e) =>
                              setFixedDepositData({
                                ...fixedDepositData,
                                term_months: parseInt(e.target.value),
                              })
                            }
                            required
                          >
                            <option value={3}>3 months</option>
                            <option value={6}>6 months</option>
                            <option value={12}>12 months</option>
                            <option value={24}>24 months</option>
                            <option value={36}>36 months</option>
                            <option value={48}>48 months</option>
                            <option value={60}>60 months</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Interest Rate (%)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={fixedDepositData.interest_rate}
                            onChange={(e) =>
                              setFixedDepositData({
                                ...fixedDepositData,
                                interest_rate: parseFloat(e.target.value),
                              })
                            }
                            step="0.1"
                            min="0"
                            max="20"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="auto_renewal"
                              checked={fixedDepositData.auto_renewal}
                              onChange={(e) =>
                                setFixedDepositData({
                                  ...fixedDepositData,
                                  auto_renewal: e.target.checked,
                                })
                              }
                            />
                            <label
                              className="form-check-label"
                              htmlFor="auto_renewal"
                            >
                              Auto-renewal on maturity
                            </label>
                          </div>
                        </div>
                        {fixedDepositData.auto_renewal && (
                          <div className="mb-3">
                            <label className="form-label">
                              Renewal Term (Months)
                            </label>
                            <select
                              className="form-select"
                              value={fixedDepositData.renewal_term_months}
                              onChange={(e) =>
                                setFixedDepositData({
                                  ...fixedDepositData,
                                  renewal_term_months: parseInt(e.target.value),
                                })
                              }
                            >
                              <option value={3}>3 months</option>
                              <option value={6}>6 months</option>
                              <option value={12}>12 months</option>
                              <option value={24}>24 months</option>
                              <option value={36}>36 months</option>
                            </select>
                          </div>
                        )}
                        <div className="alert alert-info">
                          <strong>Features:</strong>
                          <ul className="mb-0">
                            <li>Daily interest calculation</li>
                            <li>Early withdrawal penalty (2%)</li>
                            <li>Maturity notification</li>
                            <li>Auto interest crediting</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowFixedDepositModal(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-success">
                        📈 Create Fixed Deposit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Target Savings Modal */}
        {showTargetSavingsModal && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg">
              <div
                className={`modal-content ${
                  isDarkMode ? "bg-dark text-light" : ""
                }`}
              >
                <div className="modal-header">
                  <h5 className="modal-title">🎯 Create Target Savings</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowTargetSavingsModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleCreateTargetSavings}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Target Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={targetSavingsData.target_name}
                            onChange={(e) =>
                              setTargetSavingsData({
                                ...targetSavingsData,
                                target_name: e.target.value,
                              })
                            }
                            placeholder="e.g., Vacation Fund, House Down Payment"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">
                            Target Amount (KES)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={targetSavingsData.target_amount}
                            onChange={(e) =>
                              setTargetSavingsData({
                                ...targetSavingsData,
                                target_amount: e.target.value,
                              })
                            }
                            placeholder="Enter target amount"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Target Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={targetSavingsData.target_date}
                            onChange={(e) =>
                              setTargetSavingsData({
                                ...targetSavingsData,
                                target_date: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Contribution Frequency
                          </label>
                          <select
                            className="form-select"
                            value={targetSavingsData.frequency}
                            onChange={(e) =>
                              setTargetSavingsData({
                                ...targetSavingsData,
                                frequency: e.target.value,
                              })
                            }
                            required
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">
                            Contribution Amount (KES)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={targetSavingsData.contribution_amount}
                            onChange={(e) =>
                              setTargetSavingsData({
                                ...targetSavingsData,
                                contribution_amount: e.target.value,
                              })
                            }
                            placeholder="Enter contribution amount"
                          />
                        </div>
                        <div className="alert alert-info">
                          <strong>Features:</strong>
                          <ul className="mb-0">
                            <li>Goal-based savings tracking</li>
                            <li>Progress visualization</li>
                            <li>Automatic reminders</li>
                            <li>Flexible contribution amounts</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowTargetSavingsModal(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-info">
                        🎯 Create Target Savings
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Savings;
