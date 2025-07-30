import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaTachometerAlt,
  FaHandshake,
  FaPiggyBank,
  FaUser,
  FaSignOutAlt,
  FaBuilding,
  FaChartLine,
} from "react-icons/fa";

const Sidebar = () => {
  const { isDarkMode } = useTheme();
  const { logout, user } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      path: "/dashboard",
      name: "Dashboard",
      icon: FaTachometerAlt,
    },
    {
      path: "/accounts",
      name: "Accounts",
      icon: FaBuilding,
    },
    {
      path: "/loans",
      name: "Loans",
      icon: FaHandshake,
    },
    {
      path: "/savings",
      name: "Savings",
      icon: FaPiggyBank,
    },
    {
      path: "/investments",
      name: "Investments",
      icon: FaChartLine,
    },
    {
      path: "/profile",
      name: "Profile",
      icon: FaUser,
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div
      className={`sidebar ${isDarkMode ? "bg-dark text-light" : "bg-light"}`}
      style={{
        width: "250px",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        paddingTop: "70px", // Account for navbar height
        borderRight: isDarkMode ? "1px solid #495057" : "1px solid #dee2e6",
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <div className="p-3">
        {/* User Info */}
        <div className="text-center mb-4">
          <div
            className="avatar bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
            style={{ width: "60px", height: "60px" }}
          >
            <FaUser size={24} />
          </div>
          <h6 className="mb-1">
            {user?.first_name} {user?.last_name}
          </h6>
          <small className="text-muted">{user?.email}</small>
        </div>

        {/* Navigation Menu */}
        <nav className="mb-4">
          <ul className="nav flex-column">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li className="nav-item" key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`nav-link d-flex align-items-center py-3 px-3 ${
                      isActive
                        ? "active bg-primary text-white"
                        : isDarkMode
                        ? "text-light hover-bg-dark"
                        : "text-dark hover-bg-light"
                    }`}
                    style={{
                      borderRadius: "8px",
                      marginBottom: "4px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <IconComponent className="me-3" size={18} />
                    {item.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className={`btn w-100 d-flex align-items-center justify-content-center ${
              isDarkMode ? "btn-outline-light" : "btn-outline-danger"
            }`}
            style={{ borderRadius: "8px" }}
          >
            <FaSignOutAlt className="me-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
