import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const Profile = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  return (
    <div className={`p-4 ${isDarkMode ? "bg-dark text-light" : "bg-light"}`}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-8 mx-auto">
            <div
              className={`card ${
                isDarkMode ? "bg-dark text-light border-secondary" : "bg-white"
              }`}
            >
              <div className="card-header">
                <h4 className="mb-0">Profile</h4>
              </div>
              <div className="card-body">
                <p>Profile page coming soon...</p>
                <p>
                  User: {user?.first_name} {user?.last_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
