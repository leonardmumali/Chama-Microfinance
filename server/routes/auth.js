const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { runQuery, getRow } = require("../database/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      id_number,
      date_of_birth,
      address,
      occupation,
      monthly_income,
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["username", "email", "password", "first_name", "last_name"],
      });
    }

    // Check if user already exists
    const existingUser = await getRow(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists with this username or email",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate account number
    const accountNumber =
      "CH" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Insert new user
    const result = await runQuery(
      `
      INSERT INTO users (
        username, email, password, first_name, last_name, 
        phone, id_number, date_of_birth, address, occupation, monthly_income
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        username,
        email,
        passwordHash,
        first_name,
        last_name,
        phone,
        id_number,
        date_of_birth,
        address,
        occupation,
        monthly_income,
      ]
    );

    // Create savings account for new user
    await runQuery(
      `
      INSERT INTO savings (user_id, account_number, account_type, balance, interest_rate)
      VALUES (?, ?, 'personal', 0, 2.5)
    `,
      [result.id, accountNumber]
    );

    // Get the created user (without password)
    const newUser = await getRow(
      `
      SELECT id, username, email, first_name, last_name, phone, role, status, created_at
      FROM users WHERE id = ?
    `,
      [result.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token,
      account_number: accountNumber,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Registration failed",
      message: error.message,
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    // Find user by username or email
    const user = await getRow(
      `
      SELECT id, username, email, password, first_name, last_name, 
             phone, role, status, created_at
      FROM users WHERE username = ? OR email = ?
    `,
      [username, username]
    );

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(401).json({
        error: "Account is not active. Please contact administrator.",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Remove password from response
    delete user.password;

    res.json({
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Login failed",
      message: error.message,
    });
  }
});

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await getRow(
      `
      SELECT id, username, email, first_name, last_name, phone, id_number,
             date_of_birth, address, occupation, monthly_income, profile_image,
             role, status, created_at, updated_at
      FROM users WHERE id = ?
    `,
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      error: "Failed to get profile",
      message: error.message,
    });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      address,
      occupation,
      monthly_income,
    } = req.body;

    const result = await runQuery(
      `
      UPDATE users SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        occupation = COALESCE(?, occupation),
        monthly_income = COALESCE(?, monthly_income),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        first_name,
        last_name,
        phone,
        address,
        occupation,
        monthly_income,
        req.user.userId,
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Get updated user
    const updatedUser = await getRow(
      `
      SELECT id, username, email, first_name, last_name, phone, id_number,
             date_of_birth, address, occupation, monthly_income, profile_image,
             role, status, created_at, updated_at
      FROM users WHERE id = ?
    `,
      [req.user.userId]
    );

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      error: "Failed to update profile",
      message: error.message,
    });
  }
});

// Change password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    // Get current password
    const user = await getRow(
      `
      SELECT password FROM users WHERE id = ?
    `,
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      current_password,
      user.password
    );
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(new_password, 10);

    // Update password
    await runQuery(
      `
      UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [newPasswordHash, req.user.userId]
    );

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({
      error: "Failed to change password",
      message: error.message,
    });
  }
});

// Verify token
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

module.exports = router;
