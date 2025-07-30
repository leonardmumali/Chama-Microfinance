import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import LoanApplication from "./LoanApplication";

const Loans = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loans, setLoans] = useState([]);
  const [loanTypes, setLoanTypes] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showApplication, setShowApplication] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    loan_type: "personal",
    amount: "",
    term_months: "",
  });
  const [calculationResult, setCalculationResult] = useState(null);

  useEffect(() => {
    fetchLoans();
    fetchLoanTypes();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/enhanced-loans/my-loans", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setLoans(response.data.loans);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanTypes = async () => {
    try {
      const response = await axios.get("/api/enhanced-loans/types", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setLoanTypes(response.data.loan_types);
    } catch (error) {
      console.error("Error fetching loan types:", error);
    }
  };

  const calculateLoan = async () => {
    try {
      const response = await axios.post(
        "/api/enhanced-loans/calculate",
        calculatorData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setCalculationResult(response.data);
    } catch (error) {
      console.error("Error calculating loan:", error);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "bg-warning",
      approved: "bg-success",
      active: "bg-primary",
      completed: "bg-info",
      defaulted: "bg-danger",
      rejected: "bg-secondary",
    };
    return (
      <span className={`badge ${statusColors[status] || "bg-secondary"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
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
                <h4 className="mb-0">🏠 Loans Module</h4>
                <div>
                  <button
                    className="btn btn-primary me-2"
                    onClick={() => setShowCalculator(true)}
                  >
                    📊 Loan Calculator
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => setShowApplication(true)}
                  >
                    📝 Apply for Loan
                  </button>
                </div>
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
                <ul className="nav nav-tabs" id="loansTab" role="tablist">
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
                        activeTab === "my-loans" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("my-loans")}
                    >
                      💰 My Loans
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${
                        activeTab === "types" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("types")}
                    >
                      🏦 Loan Types
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
                      <div
                        className={`card ${
                          isDarkMode
                            ? "bg-dark text-light border-secondary"
                            : "bg-white"
                        }`}
                      >
                        <div className="card-header">
                          <h5>📊 Loan Statistics</h5>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-6">
                              <div className="text-center">
                                <h3 className="text-primary">{loans.length}</h3>
                                <p>Total Loans</p>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center">
                                <h3 className="text-success">
                                  {
                                    loans.filter((l) => l.status === "active")
                                      .length
                                  }
                                </h3>
                                <p>Active Loans</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div
                        className={`card ${
                          isDarkMode
                            ? "bg-dark text-light border-secondary"
                            : "bg-white"
                        }`}
                      >
                        <div className="card-header">
                          <h5>⚡ Quick Actions</h5>
                        </div>
                        <div className="card-body">
                          <div className="d-grid gap-2">
                            <button
                              className="btn btn-primary"
                              onClick={() => setShowCalculator(true)}
                            >
                              📊 Calculate Loan
                            </button>
                            <button
                              className="btn btn-success"
                              onClick={() => setShowApplication(true)}
                            >
                              📝 Apply for Loan
                            </button>
                            <button
                              className="btn btn-info"
                              onClick={() => setActiveTab("types")}
                            >
                              🏦 View Loan Types
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* My Loans Tab */}
                {activeTab === "my-loans" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>💰 My Loans</h5>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={fetchLoans}
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
                    ) : loans.length === 0 ? (
                      <div className="text-center py-4">
                        <p>No loans found. Apply for your first loan!</p>
                        <button
                          className="btn btn-success"
                          onClick={() => setShowApplication(true)}
                        >
                          📝 Apply for Loan
                        </button>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table
                          className={`table ${isDarkMode ? "table-dark" : ""}`}
                        >
                          <thead>
                            <tr>
                              <th>Loan #</th>
                              <th>Type</th>
                              <th>Amount</th>
                              <th>Monthly Payment</th>
                              <th>Status</th>
                              <th>Due Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loans.map((loan) => (
                              <tr key={loan.id}>
                                <td>{loan.loan_number}</td>
                                <td>
                                  {loanTypes[loan.loan_type]?.name ||
                                    loan.loan_type}
                                </td>
                                <td>{formatCurrency(loan.amount)}</td>
                                <td>{formatCurrency(loan.monthly_payment)}</td>
                                <td>{getStatusBadge(loan.status)}</td>
                                <td>
                                  {new Date(loan.due_date).toLocaleDateString()}
                                </td>
                                <td>
                                  <button className="btn btn-sm btn-info me-1">
                                    👁️ View
                                  </button>
                                  {loan.status === "active" && (
                                    <button className="btn btn-sm btn-success">
                                      💳 Pay
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

                {/* Loan Types Tab */}
                {activeTab === "types" && (
                  <div>
                    <h5>🏦 Available Loan Types</h5>
                    <p className="text-muted mb-4">
                      Choose from our comprehensive range of loan products
                      designed to meet your financial needs.
                    </p>
                    <div className="row">
                      {Object.entries(loanTypes).map(([key, type]) => (
                        <div key={key} className="col-md-6 col-lg-4 mb-4">
                          <div
                            className={`card h-100 ${
                              isDarkMode
                                ? "bg-dark text-light border-secondary"
                                : "bg-white"
                            }`}
                          >
                            <div className="card-header d-flex justify-content-between align-items-center">
                              <h6 className="mb-0">
                                {key === "personal" && "👤 "}
                                {key === "group" && "👥 "}
                                {key === "business" && "💼 "}
                                {key === "women_youth" && "🌟 "}
                                {key === "mortgage" && "🏠 "}
                                {key === "bonds" && "📈 "}
                                {type.name}
                              </h6>
                              <span
                                className={`badge ${
                                  type.requiresCollateral &&
                                  type.requiresGuarantor
                                    ? "bg-warning"
                                    : type.requiresCollateral
                                    ? "bg-info"
                                    : type.requiresGuarantor
                                    ? "bg-success"
                                    : "bg-primary"
                                }`}
                              >
                                {type.requiresCollateral &&
                                type.requiresGuarantor
                                  ? "Collateral + Guarantor"
                                  : type.requiresCollateral
                                  ? "Collateral Required"
                                  : type.requiresGuarantor
                                  ? "Guarantor Required"
                                  : "Simple"}
                              </span>
                            </div>
                            <div className="card-body">
                              <div className="mb-3">
                                <strong>💰 Amount Range:</strong>
                                <br />
                                <span className="text-primary">
                                  {formatCurrency(type.minAmount)} -{" "}
                                  {formatCurrency(type.maxAmount)}
                                </span>
                              </div>
                              <div className="mb-3">
                                <strong>⏱️ Term Range:</strong>
                                <br />
                                <span className="text-info">
                                  {type.minTerm} - {type.maxTerm} months
                                </span>
                              </div>
                              <div className="mb-3">
                                <strong>📊 Interest Rate:</strong>
                                <br />
                                <span className="text-success">
                                  {type.baseInterestRate}% per annum
                                </span>
                              </div>
                              <div className="mb-3">
                                <strong>📋 Requirements:</strong>
                                <br />
                                <div className="mt-1">
                                  {type.requiresCollateral && (
                                    <span className="badge bg-info me-1">
                                      🏠 Collateral
                                    </span>
                                  )}
                                  {type.requiresGuarantor && (
                                    <span className="badge bg-success me-1">
                                      🤝 Guarantor
                                    </span>
                                  )}
                                  {!type.requiresCollateral &&
                                    !type.requiresGuarantor && (
                                      <span className="badge bg-primary">
                                        ✅ No Requirements
                                      </span>
                                    )}
                                </div>
                              </div>
                              <div className="mb-2">
                                <strong>🎯 Best For:</strong>
                                <br />
                                <small className="text-muted">
                                  {key === "personal" &&
                                    "Personal expenses, emergencies, debt consolidation"}
                                  {key === "group" &&
                                    "Group projects, community development, collective investments"}
                                  {key === "business" &&
                                    "Business expansion, equipment purchase, working capital"}
                                  {key === "women_youth" &&
                                    "Women and youth empowerment, skill development, entrepreneurship"}
                                  {key === "mortgage" &&
                                    "Home purchase, property investment, real estate development"}
                                  {key === "bonds" &&
                                    "Investment instruments, capital markets, institutional financing"}
                                </small>
                              </div>
                            </div>
                            <div className="card-footer">
                              <div className="row">
                                <div className="col-6">
                                  <button
                                    className="btn btn-outline-primary btn-sm w-100"
                                    onClick={() => {
                                      setCalculatorData({
                                        ...calculatorData,
                                        loan_type: key,
                                      });
                                      setShowCalculator(true);
                                    }}
                                  >
                                    📊 Calculate
                                  </button>
                                </div>
                                <div className="col-6">
                                  <button
                                    className="btn btn-success btn-sm w-100"
                                    onClick={() => {
                                      setCalculatorData({
                                        ...calculatorData,
                                        loan_type: key,
                                      });
                                      setShowApplication(true);
                                    }}
                                  >
                                    📝 Apply
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loan Calculator Modal */}
        {showCalculator && (
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
                  <h5 className="modal-title">📊 Loan Calculator</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowCalculator(false);
                      setCalculationResult(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="mb-3">📊 Loan Calculator</h6>
                      <div className="mb-3">
                        <label className="form-label">Loan Type</label>
                        <select
                          className="form-select"
                          value={calculatorData.loan_type}
                          onChange={(e) =>
                            setCalculatorData({
                              ...calculatorData,
                              loan_type: e.target.value,
                            })
                          }
                        >
                          {Object.entries(loanTypes).map(([key, type]) => (
                            <option key={key} value={key}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Loan Amount (KES)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={calculatorData.amount}
                          onChange={(e) =>
                            setCalculatorData({
                              ...calculatorData,
                              amount: e.target.value,
                            })
                          }
                          placeholder="Enter amount"
                        />
                        {loanTypes[calculatorData.loan_type] && (
                          <small className="text-muted">
                            Range:{" "}
                            {formatCurrency(
                              loanTypes[calculatorData.loan_type].minAmount
                            )}{" "}
                            -{" "}
                            {formatCurrency(
                              loanTypes[calculatorData.loan_type].maxAmount
                            )}
                          </small>
                        )}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Term (Months)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={calculatorData.term_months}
                          onChange={(e) =>
                            setCalculatorData({
                              ...calculatorData,
                              term_months: e.target.value,
                            })
                          }
                          placeholder="Enter term in months"
                        />
                        {loanTypes[calculatorData.loan_type] && (
                          <small className="text-muted">
                            Range: {loanTypes[calculatorData.loan_type].minTerm}{" "}
                            - {loanTypes[calculatorData.loan_type].maxTerm}{" "}
                            months
                          </small>
                        )}
                      </div>
                      <button
                        className="btn btn-primary w-100"
                        onClick={calculateLoan}
                        disabled={
                          !calculatorData.amount || !calculatorData.term_months
                        }
                      >
                        📊 Calculate
                      </button>
                    </div>
                    <div className="col-md-6">
                      {calculationResult && (
                        <div
                          className={`card ${
                            isDarkMode
                              ? "bg-dark text-light border-secondary"
                              : "bg-white"
                          }`}
                        >
                          <div className="card-header">
                            <h6>📊 Calculation Results</h6>
                          </div>
                          <div className="card-body">
                            <div className="mb-2">
                              <strong>Credit Score:</strong>{" "}
                              {calculationResult.credit_score}
                            </div>
                            <div className="mb-2">
                              <strong>Interest Rate:</strong>{" "}
                              {calculationResult.loan_terms.interestRate}%
                            </div>
                            <div className="mb-2">
                              <strong>Monthly Payment:</strong>{" "}
                              {formatCurrency(
                                calculationResult.loan_terms.monthlyPayment
                              )}
                            </div>
                            <div className="mb-2">
                              <strong>Total Payable:</strong>{" "}
                              {formatCurrency(
                                calculationResult.loan_terms.totalPayable
                              )}
                            </div>
                            <div className="mb-2">
                              <strong>Total Interest:</strong>{" "}
                              {formatCurrency(
                                calculationResult.loan_terms.totalInterest
                              )}
                            </div>
                            <hr />
                            <button
                              className="btn btn-success w-100"
                              onClick={() => {
                                setShowCalculator(false);
                                setShowApplication(true);
                              }}
                            >
                              📝 Apply for This Loan
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Loan Types Overview */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <h6 className="mb-3">🏦 Available Loan Types</h6>
                      <div className="row">
                        {Object.entries(loanTypes).map(([key, type]) => (
                          <div key={key} className="col-md-6 col-lg-4 mb-3">
                            <div
                              className={`card h-100 ${
                                calculatorData.loan_type === key
                                  ? "border-primary"
                                  : ""
                              } ${
                                isDarkMode
                                  ? "bg-dark text-light border-secondary"
                                  : "bg-white"
                              }`}
                            >
                              <div className="card-header">
                                <h6 className="mb-0">{type.name}</h6>
                              </div>
                              <div className="card-body">
                                <div className="mb-2">
                                  <strong>Amount Range:</strong>
                                  <br />
                                  {formatCurrency(type.minAmount)} -{" "}
                                  {formatCurrency(type.maxAmount)}
                                </div>
                                <div className="mb-2">
                                  <strong>Term Range:</strong>
                                  <br />
                                  {type.minTerm} - {type.maxTerm} months
                                </div>
                                <div className="mb-2">
                                  <strong>Interest Rate:</strong>
                                  <br />
                                  {type.baseInterestRate}% per annum
                                </div>
                                <div className="mb-2">
                                  <strong>Requirements:</strong>
                                  <br />
                                  {type.requiresCollateral && "🏠 Collateral "}
                                  {type.requiresGuarantor && "🤝 Guarantor "}
                                  {!type.requiresCollateral &&
                                    !type.requiresGuarantor &&
                                    "None"}
                                </div>
                              </div>
                              <div className="card-footer">
                                <button
                                  className="btn btn-outline-primary btn-sm w-100"
                                  onClick={() => {
                                    setCalculatorData({
                                      ...calculatorData,
                                      loan_type: key,
                                    });
                                  }}
                                >
                                  📊 Select
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loan Application Modal */}
        {showApplication && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-xl">
              <div
                className={`modal-content ${
                  isDarkMode ? "bg-dark text-light" : ""
                }`}
              >
                <div className="modal-header">
                  <h5 className="modal-title">📝 Loan Application</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowApplication(false)}
                  ></button>
                </div>
                <div
                  className="modal-body"
                  style={{ maxHeight: "80vh", overflowY: "auto" }}
                >
                  <LoanApplication />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loans;
