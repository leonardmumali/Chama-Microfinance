import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useParams } from "react-router-dom";
import axios from "axios";

const LoanDetails = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [guarantors, setGuarantors] = useState([]);
  const [collateral, setCollateral] = useState(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_date: "",
    payment_method: "mpesa",
    payment_reference: "",
  });

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/enhanced-loans/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setLoan(response.data.loan);
      setPayments(response.data.payments || []);
      setGuarantors(response.data.guarantors || []);
      setCollateral(response.data.collateral);
      setRepaymentSchedule(response.data.repayment_schedule || []);
    } catch (error) {
      console.error("Error fetching loan details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/enhanced-loans/${id}/pay`, paymentData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      alert("Payment recorded successfully!");
      setShowPaymentModal(false);
      setPaymentData({
        amount: "",
        payment_date: "",
        payment_method: "mpesa",
        payment_reference: "",
      });
      fetchLoanDetails(); // Refresh data
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Error recording payment. Please try again.");
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`p-4 ${isDarkMode ? "bg-dark text-light" : "bg-light"}`}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className={`p-4 ${isDarkMode ? "bg-dark text-light" : "bg-light"}`}>
        <div className="alert alert-danger">Loan not found</div>
      </div>
    );
  }

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
                <h4 className="mb-0">📋 Loan Details - {loan.loan_number}</h4>
                <div>
                  {loan.status === "active" && (
                    <button
                      className="btn btn-success"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      💳 Make Payment
                    </button>
                  )}
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
                <ul className="nav nav-tabs" role="tablist">
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
                        activeTab === "payments" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("payments")}
                    >
                      💰 Payments
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${
                        activeTab === "schedule" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("schedule")}
                    >
                      📅 Repayment Schedule
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${
                        activeTab === "guarantors" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("guarantors")}
                    >
                      🤝 Guarantors
                    </button>
                  </li>
                  {collateral && (
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${
                          activeTab === "collateral" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("collateral")}
                      >
                        🏠 Collateral
                      </button>
                    </li>
                  )}
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
                    <div className="col-md-6">
                      <h5>📋 Loan Information</h5>
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td>
                              <strong>Loan Number:</strong>
                            </td>
                            <td>{loan.loan_number}</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Loan Type:</strong>
                            </td>
                            <td>{loan.loan_type}</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Amount:</strong>
                            </td>
                            <td>{formatCurrency(loan.amount)}</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Interest Rate:</strong>
                            </td>
                            <td>{loan.interest_rate}%</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Term:</strong>
                            </td>
                            <td>{loan.term_months} months</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Monthly Payment:</strong>
                            </td>
                            <td>{formatCurrency(loan.monthly_payment)}</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Total Payable:</strong>
                            </td>
                            <td>{formatCurrency(loan.total_payable)}</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Status:</strong>
                            </td>
                            <td>{getStatusBadge(loan.status)}</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Due Date:</strong>
                            </td>
                            <td>{formatDate(loan.due_date)}</td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Credit Score:</strong>
                            </td>
                            <td>{loan.credit_score}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-6">
                      <h5>📝 Purpose</h5>
                      <p>{loan.purpose}</p>

                      {loan.approved_by && (
                        <>
                          <h5>✅ Approval Details</h5>
                          <p>
                            <strong>Approved by:</strong>{" "}
                            {loan.approved_by_first_name}{" "}
                            {loan.approved_by_last_name}
                          </p>
                          <p>
                            <strong>Approved on:</strong>{" "}
                            {formatDate(loan.approved_at)}
                          </p>
                        </>
                      )}

                      {loan.disbursed_at && (
                        <>
                          <h5>💰 Disbursement Details</h5>
                          <p>
                            <strong>Disbursed on:</strong>{" "}
                            {formatDate(loan.disbursed_at)}
                          </p>
                          {loan.disbursement_method && (
                            <p>
                              <strong>Method:</strong>{" "}
                              {loan.disbursement_method}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Payments Tab */}
                {activeTab === "payments" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>💰 Payment History</h5>
                      {loan.status === "active" && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => setShowPaymentModal(true)}
                        >
                          💳 Make Payment
                        </button>
                      )}
                    </div>
                    {payments.length === 0 ? (
                      <p>No payments recorded yet.</p>
                    ) : (
                      <div className="table-responsive">
                        <table
                          className={`table ${isDarkMode ? "table-dark" : ""}`}
                        >
                          <thead>
                            <tr>
                              <th>Payment #</th>
                              <th>Amount</th>
                              <th>Date</th>
                              <th>Method</th>
                              <th>Late Fee</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((payment) => (
                              <tr key={payment.id}>
                                <td>{payment.payment_number}</td>
                                <td>{formatCurrency(payment.amount)}</td>
                                <td>{formatDate(payment.payment_date)}</td>
                                <td>{payment.payment_method || "N/A"}</td>
                                <td>
                                  {payment.late_fee > 0
                                    ? formatCurrency(payment.late_fee)
                                    : "N/A"}
                                </td>
                                <td>{getStatusBadge(payment.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Repayment Schedule Tab */}
                {activeTab === "schedule" && (
                  <div>
                    <h5>📅 Repayment Schedule</h5>
                    {repaymentSchedule.length === 0 ? (
                      <p>Repayment schedule not available.</p>
                    ) : (
                      <div className="table-responsive">
                        <table
                          className={`table ${isDarkMode ? "table-dark" : ""}`}
                        >
                          <thead>
                            <tr>
                              <th>Installment</th>
                              <th>Due Date</th>
                              <th>Payment Amount</th>
                              <th>Principal</th>
                              <th>Interest</th>
                              <th>Remaining Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {repaymentSchedule.map((installment, index) => (
                              <tr key={index}>
                                <td>{installment.installment_number}</td>
                                <td>{formatDate(installment.due_date)}</td>
                                <td>
                                  {formatCurrency(installment.payment_amount)}
                                </td>
                                <td>
                                  {formatCurrency(installment.principal_amount)}
                                </td>
                                <td>
                                  {formatCurrency(installment.interest_amount)}
                                </td>
                                <td>
                                  {formatCurrency(
                                    installment.remaining_balance
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

                {/* Guarantors Tab */}
                {activeTab === "guarantors" && (
                  <div>
                    <h5>🤝 Guarantors</h5>
                    {guarantors.length === 0 ? (
                      <p>No guarantors for this loan.</p>
                    ) : (
                      <div className="row">
                        {guarantors.map((guarantor) => (
                          <div
                            key={guarantor.id}
                            className="col-md-6 col-lg-4 mb-3"
                          >
                            <div
                              className={`card ${
                                isDarkMode
                                  ? "bg-dark text-light border-secondary"
                                  : "bg-white"
                              }`}
                            >
                              <div className="card-body">
                                <h6>
                                  {guarantor.first_name} {guarantor.last_name}
                                </h6>
                                <p className="mb-1">
                                  <strong>Phone:</strong> {guarantor.phone}
                                </p>
                                <p className="mb-1">
                                  <strong>Status:</strong>{" "}
                                  {getStatusBadge(guarantor.status)}
                                </p>
                                {guarantor.approved_at && (
                                  <p className="mb-0">
                                    <strong>Approved:</strong>{" "}
                                    {formatDate(guarantor.approved_at)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Collateral Tab */}
                {activeTab === "collateral" && collateral && (
                  <div>
                    <h5>🏠 Collateral Details</h5>
                    <div
                      className={`card ${
                        isDarkMode
                          ? "bg-dark text-light border-secondary"
                          : "bg-white"
                      }`}
                    >
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6">
                            <p>
                              <strong>Type:</strong>{" "}
                              {collateral.collateral_type}
                            </p>
                            <p>
                              <strong>Value:</strong>{" "}
                              {formatCurrency(collateral.value)}
                            </p>
                            <p>
                              <strong>Verified:</strong>{" "}
                              {collateral.verified ? "✅ Yes" : "❌ No"}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <p>
                              <strong>Description:</strong>
                            </p>
                            <p>{collateral.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
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
                  <h5 className="modal-title">💳 Make Payment</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowPaymentModal(false)}
                  ></button>
                </div>
                <form onSubmit={handlePaymentSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Payment Amount (KES)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={paymentData.amount}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            amount: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Payment Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={paymentData.payment_date}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            payment_date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Payment Method</label>
                      <select
                        className="form-select"
                        value={paymentData.payment_method}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            payment_method: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="mpesa">M-Pesa</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cash">Cash</option>
                        <option value="check">Check</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Payment Reference</label>
                      <input
                        type="text"
                        className="form-control"
                        value={paymentData.payment_reference}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            payment_reference: e.target.value,
                          })
                        }
                        placeholder="Transaction reference number"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success">
                      💳 Record Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanDetails;
