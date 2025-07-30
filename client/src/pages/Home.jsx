import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  FaHandshake,
  FaPiggyBank,
  FaChartLine,
  FaUsers,
  FaShieldAlt,
  FaMobileAlt,
} from "react-icons/fa";

const Home = () => {
  const { isDarkMode } = useTheme();

  const services = [
    {
      icon: <FaHandshake className="text-primary" size={40} />,
      title: "Personal Loans",
      description:
        "Quick and easy personal loans with competitive interest rates and flexible repayment terms.",
      features: [
        "No collateral required",
        "Fast approval process",
        "Flexible repayment options",
      ],
    },
    {
      icon: <FaPiggyBank className="text-success" size={40} />,
      title: "Savings Accounts",
      description:
        "Start saving with our high-yield savings accounts that help you build wealth over time.",
      features: [
        "High interest rates",
        "No minimum balance",
        "Monthly interest payments",
      ],
    },
    {
      icon: <FaChartLine className="text-warning" size={40} />,
      title: "Business Loans",
      description:
        "Grow your business with our tailored business loan solutions and expert financial advice.",
      features: [
        "Business expansion",
        "Equipment financing",
        "Working capital",
      ],
    },
    {
      icon: <FaUsers className="text-info" size={40} />,
      title: "Group Lending",
      description:
        "Join our community-based lending groups for mutual support and better loan terms.",
      features: [
        "Community support",
        "Lower interest rates",
        "Shared responsibility",
      ],
    },
  ];

  const features = [
    {
      icon: <FaShieldAlt />,
      title: "Secure & Safe",
      description:
        "Your financial data is protected with bank-level security measures.",
    },
    {
      icon: <FaMobileAlt />,
      title: "Mobile Access",
      description:
        "Access your account anytime, anywhere with our mobile-friendly platform.",
    },
    {
      icon: <FaHandshake />,
      title: "24/7 Support",
      description:
        "Get help whenever you need it with our round-the-clock customer support.",
    },
  ];

  return (
    <div className={isDarkMode ? "bg-dark text-light" : "bg-light"}>
      {/* Hero Section */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Financial Freedom Starts Here
              </h1>
              <p className="lead mb-4">
                Access affordable loans, build your savings, and grow your
                wealth with Chama Microfinance. We're committed to empowering
                communities through accessible financial services.
              </p>
              <div className="d-flex gap-3">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline-primary btn-lg">
                  Login
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="text-center">
                <div
                  className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "300px", height: "300px" }}
                >
                  <FaHandshake size={100} className="text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Our Services</h2>
            <p className="lead">
              Comprehensive financial solutions tailored to your needs
            </p>
          </div>
          <div className="row g-4">
            {services.map((service, index) => (
              <div key={index} className="col-md-6 col-lg-3">
                <div
                  className={`card h-100 ${
                    isDarkMode
                      ? "bg-dark text-light border-secondary"
                      : "bg-white"
                  }`}
                >
                  <div className="card-body text-center">
                    <div className="mb-3">{service.icon}</div>
                    <h5 className="card-title">{service.title}</h5>
                    <p className="card-text">{service.description}</p>
                    <ul className="list-unstyled text-start">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="mb-1">
                          <small className="text-muted">✓ {feature}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className={`py-5 ${
          isDarkMode ? "bg-secondary bg-opacity-10" : "bg-white"
        }`}
      >
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Why Choose Us</h2>
            <p className="lead">
              Experience the difference with our customer-focused approach
            </p>
          </div>
          <div className="row g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-md-4">
                <div className="text-center">
                  <div
                    className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3 ${
                      isDarkMode ? "bg-dark" : "bg-light"
                    }`}
                    style={{ width: "80px", height: "80px" }}
                  >
                    {feature.icon}
                  </div>
                  <h5>{feature.title}</h5>
                  <p className="text-muted">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="display-5 fw-bold mb-4">
                Ready to Start Your Financial Journey?
              </h2>
              <p className="lead mb-4">
                Join thousands of satisfied customers who have achieved their
                financial goals with Chama Microfinance.
              </p>
              <Link to="/register" className="btn btn-primary btn-lg">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
