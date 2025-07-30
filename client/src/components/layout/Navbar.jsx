import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in the dashboard area
  const isDashboardArea = [
    "/dashboard",
    "/accounts",
    "/loans",
    "/savings",
    "/investments",
    "/profile",
    "/transactions",
    "/groups",
  ].some((path) => location.pathname.startsWith(path));

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav
      className={`navbar navbar-expand-lg ${
        isDarkMode ? "navbar-dark bg-dark" : "navbar-light bg-light"
      }`}
    >
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <span className="text-primary">Chama</span> Microfinance
        </Link>

        <button
          className="btn btn-outline-primary me-2"
          onClick={toggleTheme}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>

        <div className="navbar-nav ms-auto">
          {user ? (
            <>
              {!isDashboardArea && (
                <>
                  <Link className="nav-link" to="/dashboard">
                    Dashboard
                  </Link>
                  <Link className="nav-link" to="/loans">
                    Loans
                  </Link>
                  <Link className="nav-link" to="/savings">
                    Savings
                  </Link>
                  <Link className="nav-link" to="/profile">
                    Profile
                  </Link>
                </>
              )}
              <button
                className="btn btn-outline-danger ms-2"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">
                Login
              </Link>
              <Link className="btn btn-primary ms-2" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
