import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import Sidebar from "./Sidebar";

const DashboardLayout = ({ children }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div
        className="main-content"
        style={{
          marginLeft: "250px", // Match sidebar width
          minHeight: "100vh",
          paddingTop: "70px", // Account for navbar height
        }}
      >
        <div
          className={`main-content-inner ${
            isDarkMode ? "bg-dark text-light" : "bg-light"
          }`}
          style={{ minHeight: "calc(100vh - 70px)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
