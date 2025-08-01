import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  FaChartLine,
  FaPiggyBank,
  FaHandshake,
  FaArrowUp,
  FaDollarSign,
  FaShieldAlt,
  FaHistory,
  FaChartBar,
  FaExchangeAlt,
  FaEye,
  FaPlus,
  FaInfoCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

const Investments = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [portfolio, setPortfolio] = useState({
    totalValue: 245000,
    totalInvested: 200000,
    totalReturns: 45000,
    returnRate: 22.5,
    riskScore: 65,
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedBond, setSelectedBond] = useState(null);
  const [tradeType, setTradeType] = useState("buy");
  const [tradeAmount, setTradeAmount] = useState("");

  const availableBonds = [
    {
      id: 1,
      name: "Kenya Government Bond 2025",
      type: "government",
      issuer: "Government of Kenya",
      faceValue: 100000,
      currentPrice: 98500,
      yield: 13.2,
      risk: "low",
      minInvestment: 50000,
    },
    {
      id: 2,
      name: "Safaricom Corporate Bond 2026",
      type: "corporate",
      issuer: "Safaricom PLC",
      faceValue: 100000,
      currentPrice: 97500,
      yield: 15.1,
      risk: "medium",
      minInvestment: 25000,
    },
    {
      id: 3,
      name: "KCB Bank Bond 2027",
      type: "corporate",
      issuer: "KCB Group",
      faceValue: 100000,
      currentPrice: 96500,
      yield: 16.8,
      risk: "medium",
      minInvestment: 10000,
    },
    {
      id: 4,
      name: "Treasury Bill 91-Day",
      type: "treasury",
      issuer: "Central Bank of Kenya",
      faceValue: 100000,
      currentPrice: 97000,
      yield: 11.2,
      risk: "very_low",
      minInvestment: 5000,
    },
  ];

  const tradingHistory = [
    {
      id: 1,
      bondName: "Kenya Government Bond 2025",
      type: "buy",
      amount: 100000,
      price: 98500,
      date: "2024-01-15",
      status: "completed",
    },
    {
      id: 2,
      bondName: "Safaricom Corporate Bond 2026",
      type: "sell",
      amount: 50000,
      price: 97500,
      date: "2024-01-10",
      status: "completed",
    },
  ];

  const payouts = [
    {
      id: 1,
      bondName: "Kenya Government Bond 2025",
      amount: 6250,
      date: "2024-01-31",
      type: "coupon",
      status: "paid",
    },
    {
      id: 2,
      bondName: "Safaricom Corporate Bond 2026",
      amount: 3500,
      date: "2024-01-15",
      type: "coupon",
      status: "paid",
    },
  ];

  const riskProfile = {
    score: 65,
    level: "Moderate",
    recommendations: [
      "Consider diversifying into corporate bonds for higher yields",
      "Maintain emergency fund equivalent to 6 months expenses",
      "Review portfolio quarterly for rebalancing opportunities",
    ],
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "very_low":
        return "text-success";
      case "low":
        return "text-info";
      case "medium":
        return "text-warning";
      case "high":
        return "text-danger";
      default:
        return "text-secondary";
    }
  };

  const getRiskLevel = (score) => {
    if (score < 30) return "Conservative";
    if (score < 60) return "Moderate";
    if (score < 80) return "Aggressive";
    return "Very Aggressive";
  };

  const getRiskColorClass = (score) => {
    if (score < 30) return "text-success";
    if (score < 60) return "text-warning";
    if (score < 80) return "text-danger";
    return "text-danger";
  };

  const handleTrade = () => {
    if (!selectedBond || !tradeAmount) {
      toast.error("Please select a bond and enter amount");
      return;
    }

    toast.success(
      `${tradeType === "buy" ? "Purchase" : "Sale"} order placed successfully`
    );
    setShowTradeModal(false);
    setSelectedBond(null);
    setTradeAmount("");
  };

  return (
    <div className={`p-4 ${isDarkMode ? "bg-dark text-light" : "bg-light"}`}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center mb-3">
              <FaChartLine className="text-primary me-3" size={32} />
              <div>
                <h1 className="h3 mb-1">Investment Dashboard</h1>
                <p className="text-muted mb-0">
                  Manage your bond portfolio, track performance, and make
                  informed investment decisions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
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
                    <FaChartLine className="text-success" size={30} />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title mb-1">Portfolio Value</h6>
                    <h4 className="mb-0">
                      KES {portfolio.totalValue.toLocaleString()}
                    </h4>
                    <small className="text-success">
                      <FaArrowUp className="me-1" />+{portfolio.returnRate}%
                    </small>
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
                    <FaPiggyBank className="text-primary" size={30} />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title mb-1">Total Invested</h6>
                    <h4 className="mb-0">
                      KES {portfolio.totalInvested.toLocaleString()}
                    </h4>
                    <small className="text-muted">Principal amount</small>
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
                    <FaHandshake className="text-warning" size={30} />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title mb-1">Total Returns</h6>
                    <h4 className="mb-0">
                      KES {portfolio.totalReturns.toLocaleString()}
                    </h4>
                    <small className="text-success">
                      <FaArrowUp className="me-1" />+{portfolio.returnRate}%
                    </small>
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
                    <FaShieldAlt className="text-info" size={30} />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title mb-1">Risk Score</h6>
                    <h4
                      className={`mb-0 ${getRiskColorClass(
                        portfolio.riskScore
                      )}`}
                    >
                      {portfolio.riskScore}/100
                    </h4>
                    <small className="text-muted">
                      {getRiskLevel(portfolio.riskScore)}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="row mb-4">
          <div className="col-12">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "dashboard" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("dashboard")}
                >
                  <FaChartBar className="me-2" />
                  Dashboard
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "bonds" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("bonds")}
                >
                  <FaDollarSign className="me-2" />
                  Available Bonds
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "trading" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("trading")}
                >
                  <FaHistory className="me-2" />
                  Trading History
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "payouts" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("payouts")}
                >
                  <FaHandshake className="me-2" />
                  Payouts
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "risk" ? "active" : ""}`}
                  onClick={() => setActiveTab("risk")}
                >
                  <FaShieldAlt className="me-2" />
                  Risk Profile
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="row">
            <div className="col-md-8">
              <div
                className={`card ${
                  isDarkMode
                    ? "bg-dark text-light border-secondary"
                    : "bg-white"
                }`}
              >
                <div className="card-header">
                  <h5 className="mb-0">Portfolio Performance</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Asset Allocation</h6>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Government Bonds</span>
                          <span>60%</span>
                        </div>
                        <div className="progress">
                          <div
                            className="progress-bar bg-success"
                            style={{ width: "60%" }}
                          ></div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Corporate Bonds</span>
                          <span>30%</span>
                        </div>
                        <div className="progress">
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: "30%" }}
                          ></div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Treasury Bills</span>
                          <span>10%</span>
                        </div>
                        <div className="progress">
                          <div
                            className="progress-bar bg-warning"
                            style={{ width: "10%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6>Recent Activity</h6>
                      <div className="list-group list-group-flush">
                        <div className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-muted">Coupon Payment</small>
                            <div>Kenya Government Bond</div>
                          </div>
                          <span className="text-success">+KES 6,250</span>
                        </div>
                        <div className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-muted">Bond Purchase</small>
                            <div>Safaricom Corporate Bond</div>
                          </div>
                          <span className="text-primary">-KES 50,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className={`card ${
                  isDarkMode
                    ? "bg-dark text-light border-secondary"
                    : "bg-white"
                }`}
              >
                <div className="card-header">
                  <h5 className="mb-0">Quick Actions</h5>
                </div>
                <div className="card-body">
                  <button
                    className="btn btn-primary w-100 mb-2"
                    onClick={() => setActiveTab("bonds")}
                  >
                    <FaPlus className="me-2" />
                    Buy Bonds
                  </button>
                  <button
                    className="btn btn-outline-primary w-100 mb-2"
                    onClick={() => setActiveTab("trading")}
                  >
                    <FaHistory className="me-2" />
                    View Trading History
                  </button>
                  <button
                    className="btn btn-outline-info w-100 mb-2"
                    onClick={() => setActiveTab("risk")}
                  >
                    <FaShieldAlt className="me-2" />
                    Risk Assessment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Bonds Tab */}
        {activeTab === "bonds" && (
          <div className="row">
            <div className="col-12">
              <div
                className={`card ${
                  isDarkMode
                    ? "bg-dark text-light border-secondary"
                    : "bg-white"
                }`}
              >
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Available Bonds</h5>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowTradeModal(true)}
                  >
                    <FaExchangeAlt className="me-2" />
                    Trade Bonds
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Bond Name</th>
                          <th>Type</th>
                          <th>Face Value</th>
                          <th>Current Price</th>
                          <th>Yield</th>
                          <th>Risk</th>
                          <th>Min Investment</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableBonds.map((bond) => (
                          <tr key={bond.id}>
                            <td>
                              <div>
                                <div className="fw-bold">{bond.name}</div>
                                <small className="text-muted">
                                  {bond.issuer}
                                </small>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  bond.type === "government"
                                    ? "bg-success"
                                    : bond.type === "corporate"
                                    ? "bg-primary"
                                    : "bg-warning"
                                }`}
                              >
                                {bond.type.charAt(0).toUpperCase() +
                                  bond.type.slice(1)}
                              </span>
                            </td>
                            <td>KES {bond.faceValue.toLocaleString()}</td>
                            <td>KES {bond.currentPrice.toLocaleString()}</td>
                            <td>
                              <span className="text-success fw-bold">
                                {bond.yield}%
                              </span>
                            </td>
                            <td>
                              <span className={getRiskColor(bond.risk)}>
                                {bond.risk.replace("_", " ").toUpperCase()}
                              </span>
                            </td>
                            <td>KES {bond.minInvestment.toLocaleString()}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary me-1"
                                onClick={() => {
                                  setSelectedBond(bond);
                                  setTradeType("buy");
                                  setShowTradeModal(true);
                                }}
                              >
                                Buy
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => {
                                  setSelectedBond(bond);
                                  setTradeType("sell");
                                  setShowTradeModal(true);
                                }}
                              >
                                Sell
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trading History Tab */}
        {activeTab === "trading" && (
          <div className="row">
            <div className="col-12">
              <div
                className={`card ${
                  isDarkMode
                    ? "bg-dark text-light border-secondary"
                    : "bg-white"
                }`}
              >
                <div className="card-header">
                  <h5 className="mb-0">Trading History</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Bond</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Price</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradingHistory.map((trade) => (
                          <tr key={trade.id}>
                            <td>{trade.date}</td>
                            <td>{trade.bondName}</td>
                            <td>
                              <span
                                className={`badge ${
                                  trade.type === "buy"
                                    ? "bg-success"
                                    : "bg-danger"
                                }`}
                              >
                                {trade.type.toUpperCase()}
                              </span>
                            </td>
                            <td>KES {trade.amount.toLocaleString()}</td>
                            <td>KES {trade.price.toLocaleString()}</td>
                            <td>
                              <span
                                className={`badge ${
                                  trade.status === "completed"
                                    ? "bg-success"
                                    : trade.status === "pending"
                                    ? "bg-warning"
                                    : "bg-danger"
                                }`}
                              >
                                {trade.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === "payouts" && (
          <div className="row">
            <div className="col-12">
              <div
                className={`card ${
                  isDarkMode
                    ? "bg-dark text-light border-secondary"
                    : "bg-white"
                }`}
              >
                <div className="card-header">
                  <h5 className="mb-0">Payout History</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Bond</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((payout) => (
                          <tr key={payout.id}>
                            <td>{payout.date}</td>
                            <td>{payout.bondName}</td>
                            <td>
                              <span className="badge bg-info">
                                {payout.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="text-success">
                              +KES {payout.amount.toLocaleString()}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  payout.status === "paid"
                                    ? "bg-success"
                                    : "bg-warning"
                                }`}
                              >
                                {payout.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Profile Tab */}
        {activeTab === "risk" && (
          <div className="row">
            <div className="col-md-6">
              <div
                className={`card ${
                  isDarkMode
                    ? "bg-dark text-light border-secondary"
                    : "bg-white"
                }`}
              >
                <div className="card-header">
                  <h5 className="mb-0">Risk Assessment</h5>
                </div>
                <div className="card-body">
                  <div className="text-center mb-4">
                    <div
                      className={`display-4 ${getRiskColorClass(
                        riskProfile.score
                      )}`}
                    >
                      {riskProfile.score}/100
                    </div>
                    <h5 className={getRiskColorClass(riskProfile.score)}>
                      {riskProfile.level}
                    </h5>
                  </div>

                  <div className="mb-4">
                    <h6>Risk Factors</h6>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Investment Horizon</span>
                        <span>Low Risk</span>
                      </div>
                      <div className="progress">
                        <div
                          className="progress-bar bg-success"
                          style={{ width: "20%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Diversification</span>
                        <span>Medium Risk</span>
                      </div>
                      <div className="progress">
                        <div
                          className="progress-bar bg-warning"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Market Volatility</span>
                        <span>Low Risk</span>
                      </div>
                      <div className="progress">
                        <div
                          className="progress-bar bg-success"
                          style={{ width: "30%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div
                className={`card ${
                  isDarkMode
                    ? "bg-dark text-light border-secondary"
                    : "bg-white"
                }`}
              >
                <div className="card-header">
                  <h5 className="mb-0">Recommendations</h5>
                </div>
                <div className="card-body">
                  {riskProfile.recommendations.map((rec, index) => (
                    <div key={index} className="d-flex align-items-start mb-3">
                      <FaInfoCircle className="text-info me-2 mt-1" />
                      <div>{rec}</div>
                    </div>
                  ))}

                  <hr />

                  <h6>Risk Tolerance Guide</h6>
                  <div className="mb-2">
                    <small className="text-muted">Conservative (0-30)</small>
                    <div className="text-success">
                      Government bonds, Treasury bills
                    </div>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">Moderate (31-60)</small>
                    <div className="text-warning">
                      Mix of government and corporate bonds
                    </div>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">Aggressive (61-100)</small>
                    <div className="text-danger">
                      High-yield corporate bonds, emerging markets
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      {showTradeModal && selectedBond && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div
              className={`modal-content ${
                isDarkMode ? "bg-dark text-light" : ""
              }`}
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  {tradeType === "buy" ? "Buy" : "Sell"} {selectedBond.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTradeModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Current Price</label>
                    <div className="form-control-plaintext">
                      KES {selectedBond.currentPrice.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Yield</label>
                    <div className="form-control-plaintext text-success">
                      {selectedBond.yield}%
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Amount (KES)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={selectedBond.minInvestment}
                  />
                  <small className="text-muted">
                    Minimum investment: KES{" "}
                    {selectedBond.minInvestment.toLocaleString()}
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Estimated Cost</label>
                  <div className="form-control-plaintext">
                    KES{" "}
                    {tradeAmount
                      ? (
                          (parseFloat(tradeAmount) *
                            selectedBond.currentPrice) /
                          selectedBond.faceValue
                        ).toLocaleString()
                      : "0"}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTradeModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${
                    tradeType === "buy" ? "btn-success" : "btn-danger"
                  }`}
                  onClick={handleTrade}
                  disabled={
                    !tradeAmount ||
                    parseFloat(tradeAmount) < selectedBond.minInvestment
                  }
                >
                  {tradeType === "buy" ? "Buy" : "Sell"} Bonds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
