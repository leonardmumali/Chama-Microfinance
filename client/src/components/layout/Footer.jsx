import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

const Footer = () => {
  const { isDarkMode } = useTheme();

  return (
    <footer
      className={`py-4 mt-5 ${
        isDarkMode ? "bg-dark text-light" : "bg-light text-dark"
      }`}
    >
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5>Chama Microfinance</h5>
            <p className="mb-0">
              Empowering communities through accessible financial services.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-0">
              © 2024 Chama Microfinance. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
