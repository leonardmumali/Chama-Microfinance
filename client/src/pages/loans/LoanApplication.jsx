import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

const LoanApplication = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loanTypes, setLoanTypes] = useState({});
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [calculationResult, setCalculationResult] = useState(null);
  const [formData, setFormData] = useState({
    loan_type: "personal",
    amount: "",
    term_months: "",
    purpose: "",
    group_id: "",
    collateral_details: {
      type: "",
      description: "",
      value: "",
      documents: [],
    },
    guarantor_ids: [],
    insurance_required: false,
  });

  useEffect(() => {
    fetchLoanTypes();
    fetchGroups();
    fetchUsers();
  }, []);

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

  const fetchGroups = async () => {
    try {
      const response = await axios.get("/api/groups", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setGroups(response.data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const calculateLoan = async () => {
    if (!formData.amount || !formData.term_months) return;

    try {
      const response = await axios.post(
        "/api/enhanced-loans/calculate",
        {
          loan_type: formData.loan_type,
          amount: parseFloat(formData.amount),
          term_months: parseInt(formData.term_months),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setCalculationResult(response.data);
    } catch (error) {
      console.error("Error calculating loan:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCollateralChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      collateral_details: {
        ...prev.collateral_details,
        [field]: value,
      },
    }));
  };

  const handleGuarantorToggle = (userId) => {
    setFormData((prev) => ({
      ...prev,
      guarantor_ids: prev.guarantor_ids.includes(userId)
        ? prev.guarantor_ids.filter((id) => id !== userId)
        : [...prev.guarantor_ids, userId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/api/enhanced-loans/apply", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      alert("Loan application submitted successfully!");
      // Reset form or redirect
      setFormData({
        loan_type: "personal",
        amount: "",
        term_months: "",
        purpose: "",
        group_id: "",
        collateral_details: {
          type: "",
          description: "",
          value: "",
          documents: [],
        },
        guarantor_ids: [],
        insurance_required: false,
      });
      setCalculationResult(null);
    } catch (error) {
      console.error("Error submitting loan application:", error);
      alert("Error submitting loan application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedLoanType = () => {
    return loanTypes[formData.loan_type] || {};
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
        <div
          className={`card ${
            isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
          }`}
        >
          <div className="card-header">
            <h4 className="mb-0">📝 Loan Application Form</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Loan Type Selection */}
              <div className="row mb-4">
                <div className="col-12">
                  <h5>🏦 Loan Type</h5>
                  <div className="row">
                    {Object.entries(loanTypes).map(([key, type]) => (
                      <div key={key} className="col-md-6 col-lg-4 mb-3">
                        <div
                          className={`card ${
                            formData.loan_type === key ? "border-primary" : ""
                          } ${
                            isDarkMode
                              ? "bg-dark text-light border-secondary"
                              : "bg-white"
                          }`}
                        >
                          <div className="card-body">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="loan_type"
                                id={`loan_type_${key}`}
                                value={key}
                                checked={formData.loan_type === key}
                                onChange={(e) =>
                                  handleInputChange("loan_type", e.target.value)
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`loan_type_${key}`}
                              >
                                <strong>{type.name}</strong>
                                <br />
                                <small>
                                  {formatCurrency(type.minAmount)} -{" "}
                                  {formatCurrency(type.maxAmount)}
                                  <br />
                                  {type.minTerm} - {type.maxTerm} months
                                  <br />
                                  {type.baseInterestRate}% interest
                                </small>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="row mb-4">
                <div className="col-12">
                  <h5>💰 Loan Details</h5>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Loan Amount (KES)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.amount}
                        onChange={(e) =>
                          handleInputChange("amount", e.target.value)
                        }
                        min={getSelectedLoanType().minAmount}
                        max={getSelectedLoanType().maxAmount}
                        required
                      />
                      <small className="text-muted">
                        Range: {formatCurrency(getSelectedLoanType().minAmount)}{" "}
                        - {formatCurrency(getSelectedLoanType().maxAmount)}
                      </small>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Term (Months)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.term_months}
                        onChange={(e) =>
                          handleInputChange("term_months", e.target.value)
                        }
                        min={getSelectedLoanType().minTerm}
                        max={getSelectedLoanType().maxTerm}
                        required
                      />
                      <small className="text-muted">
                        Range: {getSelectedLoanType().minTerm} -{" "}
                        {getSelectedLoanType().maxTerm} months
                      </small>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Purpose of Loan</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.purpose}
                        onChange={(e) =>
                          handleInputChange("purpose", e.target.value)
                        }
                        placeholder="Describe the purpose of your loan..."
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Group (Optional)</label>
                      <select
                        className="form-select"
                        value={formData.group_id}
                        onChange={(e) =>
                          handleInputChange("group_id", e.target.value)
                        }
                      >
                        <option value="">Select a group (optional)</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="insurance_required"
                          checked={formData.insurance_required}
                          onChange={(e) =>
                            handleInputChange(
                              "insurance_required",
                              e.target.checked
                            )
                          }
                        />
                        <label
                          className="form-check-label"
                          htmlFor="insurance_required"
                        >
                          Include loan insurance (optional)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Calculator */}
              <div className="row mb-4">
                <div className="col-12">
                  <h5>📊 Loan Calculator</h5>
                  <button
                    type="button"
                    className="btn btn-primary mb-3"
                    onClick={calculateLoan}
                    disabled={!formData.amount || !formData.term_months}
                  >
                    📊 Calculate Loan Terms
                  </button>
                  {calculationResult && (
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
                            <h6>📊 Calculation Results</h6>
                            <p>
                              <strong>Credit Score:</strong>{" "}
                              {calculationResult.credit_score}
                            </p>
                            <p>
                              <strong>Interest Rate:</strong>{" "}
                              {calculationResult.loan_terms.interestRate}%
                            </p>
                            <p>
                              <strong>Monthly Payment:</strong>{" "}
                              {formatCurrency(
                                calculationResult.loan_terms.monthlyPayment
                              )}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <p>
                              <strong>Total Payable:</strong>{" "}
                              {formatCurrency(
                                calculationResult.loan_terms.totalPayable
                              )}
                            </p>
                            <p>
                              <strong>Total Interest:</strong>{" "}
                              {formatCurrency(
                                calculationResult.loan_terms.totalInterest
                              )}
                            </p>
                            <p>
                              <strong>Loan Term:</strong>{" "}
                              {calculationResult.loan_terms.termMonths} months
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Collateral Section */}
              {getSelectedLoanType().requiresCollateral && (
                <div className="row mb-4">
                  <div className="col-12">
                    <h5>🏠 Collateral Details</h5>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Collateral Type</label>
                        <select
                          className="form-select"
                          value={formData.collateral_details.type}
                          onChange={(e) =>
                            handleCollateralChange("type", e.target.value)
                          }
                          required
                        >
                          <option value="">Select collateral type</option>
                          <option value="property">Property</option>
                          <option value="vehicle">Vehicle</option>
                          <option value="equipment">Equipment</option>
                          <option value="savings">Savings Account</option>
                          <option value="investment">
                            Investment Portfolio
                          </option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">
                          Estimated Value (KES)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.collateral_details.value}
                          onChange={(e) =>
                            handleCollateralChange("value", e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-12 mb-3">
                        <label className="form-label">
                          Collateral Description
                        </label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData.collateral_details.description}
                          onChange={(e) =>
                            handleCollateralChange(
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Describe your collateral..."
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Guarantors Section */}
              {getSelectedLoanType().requiresGuarantor && (
                <div className="row mb-4">
                  <div className="col-12">
                    <h5>🤝 Guarantors</h5>
                    <p className="text-muted">
                      Select guarantors for your loan:
                    </p>
                    <div className="row">
                      {users
                        .filter((u) => u.id !== user.id)
                        .map((userItem) => (
                          <div
                            key={userItem.id}
                            className="col-md-6 col-lg-4 mb-3"
                          >
                            <div
                              className={`card ${
                                formData.guarantor_ids.includes(userItem.id)
                                  ? "border-success"
                                  : ""
                              } ${
                                isDarkMode
                                  ? "bg-dark text-light border-secondary"
                                  : "bg-white"
                              }`}
                            >
                              <div className="card-body">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`guarantor_${userItem.id}`}
                                    checked={formData.guarantor_ids.includes(
                                      userItem.id
                                    )}
                                    onChange={() =>
                                      handleGuarantorToggle(userItem.id)
                                    }
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor={`guarantor_${userItem.id}`}
                                  >
                                    <strong>
                                      {userItem.first_name} {userItem.last_name}
                                    </strong>
                                    <br />
                                    <small>{userItem.email}</small>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="row">
                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-success btn-lg w-100"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "📝 Submit Loan Application"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;
