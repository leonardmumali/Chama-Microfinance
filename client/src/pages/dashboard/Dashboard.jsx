import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  FaPiggyBank,
  FaHandshake,
  FaChartLine,
  FaUsers,
  FaBell,
  FaPlus,
} from "react-icons/fa";
import axios from "axios";

const Dashboard = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    savingsBalance: 0,
    activeLoans: 0,
    totalLoans: 0,
    groupMemberships: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch user's savings balance
      const savingsResponse = await axios.get("/savings/my-account");
      const loansResponse = await axios.get("/loans/my-loans");
      const transactionsResponse = await axios.get(
        "/transactions/my-transactions?limit=5"
      );

      setStats({
        savingsBalance: savingsResponse.data.balance || 0,
        activeLoans: loansResponse.data.filter(
          (loan) => loan.status === "disbursed"
        ).length,
        totalLoans: loansResponse.data.length,
        groupMemberships: 0, // Will be implemented later
      });

      setRecentTransactions(transactionsResponse.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: "badge bg-success",
      pending: "badge bg-warning",
      failed: "badge bg-danger",
      disbursed: "badge bg-primary",
      approved: "badge bg-info",
      rejected: "badge bg-danger",
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
    <div className={`py-4 ${isDarkMode ? "bg-dark text-light" : "bg-light"}`}>
      <div className="container">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <h1 className="h3 mb-2">Welcome back, {user?.first_name}!</h1>
            <p className="text-muted">
              Here's what's happening with your account today.
            </p>
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
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <FaPiggyBank className="text-success" size={30} />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title mb-1">Savings Balance</h6>
                    <h4 className="mb-0">
                      KES {stats.savingsBalance.toLocaleString()}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <FaHandshake className="text-primary" size={30} />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title mb-1">Active Loans</h6>
                    <h4 className="mb-0">{stats.activeLoans}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <FaChartLine className="text-warning" size={30} />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title mb-1">Total Loans</h6>
                    <h4 className="mb-0">{stats.totalLoans}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <FaUsers className="text-info" size={30} />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title mb-1">Groups</h6>
                    <h4 className="mb-0">{stats.groupMemberships}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row mb-4">
          <div className="col-12">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-header">
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <Link to="/loans/apply" className="btn btn-primary w-100">
                      <FaPlus className="me-2" />
                      Apply for Loan
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/savings" className="btn btn-success w-100">
                      <FaPiggyBank className="me-2" />
                      Make Deposit
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/groups" className="btn btn-info w-100">
                      <FaUsers className="me-2" />
                      Join Group
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link
                      to="/profile"
                      className="btn btn-outline-primary w-100"
                    >
                      <FaBell className="me-2" />
                      Update Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="row">
          <div className="col-12">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Transactions</h5>
                <Link
                  to="/transactions"
                  className="btn btn-sm btn-outline-primary"
                >
                  View All
                </Link>
              </div>
              <div className="card-body">
                {recentTransactions.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Description</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td>
                              {new Date(
                                transaction.created_at
                              ).toLocaleDateString()}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  transaction.type === "deposit"
                                    ? "bg-success"
                                    : transaction.type === "withdrawal"
                                    ? "bg-danger"
                                    : transaction.type === "loan_disbursement"
                                    ? "bg-primary"
                                    : "bg-secondary"
                                }`}
                              >
                                {transaction.type
                                  .replace("_", " ")
                                  .toUpperCase()}
                              </span>
                            </td>
                            <td>KES {transaction.amount.toLocaleString()}</td>
                            <td>{transaction.description}</td>
                            <td>{getStatusBadge(transaction.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No recent transactions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
