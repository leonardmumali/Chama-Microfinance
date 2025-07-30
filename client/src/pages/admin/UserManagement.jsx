import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

const UserManagement = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`py-4 ${isDarkMode ? "bg-dark text-light" : "bg-light"}`}>
      <div className="container">
        <div
          className={`card ${
            isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
          }`}
        >
          <div className="card-header">
            <h4 className="mb-0">User Management</h4>
          </div>
          <div className="card-body">
            <p>User management page coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
