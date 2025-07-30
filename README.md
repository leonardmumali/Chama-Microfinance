# Chama Microfinance System

A comprehensive microfinance management system built with React + Vite frontend and Express + Node.js backend with SQLite database.

## Features

### Core Functionality
- **User Management**: Registration, authentication, profile management
- **Loan Management**: Apply for loans, track payments, loan approval workflow
- **Savings Management**: Deposit, withdrawal, account balance tracking
- **Group Management**: Create and manage microfinance groups
- **Transaction History**: Complete transaction tracking and reporting
- **Role-based Access**: Admin, Manager, and Member roles

### Technical Features
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: SQLite with comprehensive schema for microfinance operations
- **API**: RESTful API with proper error handling and validation
- **Security**: Rate limiting, CORS, helmet security headers
- **Modern UI**: React with Vite for fast development and modern UX

## Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **React Router** for navigation
- **Axios** for API communication
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **Recharts** for data visualization

### Backend
- **Node.js** with Express.js
- **SQLite** database with comprehensive schema
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** and **Helmet** for security
- **Rate limiting** for API protection

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chama
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   DB_PATH=./server/database/chama.db
   ```

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start them separately:
   npm run server    # Backend only
   npm run client    # Frontend only
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Default admin credentials: username: `admin`, password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Loans
- `POST /api/loans/apply` - Apply for loan
- `GET /api/loans/my-loans` - Get user's loans
- `GET /api/loans` - Get all loans (admin/manager)
- `GET /api/loans/:id` - Get loan details
- `PUT /api/loans/:id/approve` - Approve/reject loan
- `POST /api/loans/:id/pay` - Make loan payment

### Savings
- `GET /api/savings/my-account` - Get user's savings account
- `POST /api/savings/deposit` - Deposit money
- `POST /api/savings/withdraw` - Withdraw money
- `GET /api/savings/transactions` - Get transaction history

### Groups
- `POST /api/groups` - Create new group
- `GET /api/groups` - Get all groups
- `GET /api/groups/my-groups` - Get user's groups
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Transactions
- `GET /api/transactions/my-transactions` - Get user's transactions
- `GET /api/transactions` - Get all transactions (admin/manager)

## Database Schema

The application uses SQLite with the following main tables:

- **users**: User accounts and profiles
- **groups**: Microfinance groups
- **group_members**: Group membership and roles
- **savings**: Savings accounts
- **loans**: Loan applications and details
- **loan_payments**: Loan payment tracking
- **transactions**: All financial transactions
- **notifications**: System notifications

## Default Admin Account

The system creates a default admin account on first run:
- **Username**: admin
- **Password**: admin123

**Important**: Change these credentials in production!

## Development

### Project Structure
```
chama/
├── server/                 # Backend code
│   ├── database/          # Database configuration
│   ├── middleware/        # Authentication middleware
│   ├── routes/           # API routes
│   └── index.js          # Main server file
├── client/               # Frontend React app
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── package.json
├── package.json          # Root package.json
└── README.md
```

### Available Scripts
- `npm run dev` - Start both frontend and backend
- `npm run server` - Start backend only
- `npm run client` - Start frontend only
- `npm run build` - Build frontend for production
- `npm run install-all` - Install all dependencies

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Helmet security headers
- Input validation and sanitization
- Role-based access control

## Production Deployment

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use a strong `JWT_SECRET`
   - Configure proper database path

2. **Build the Frontend**
   ```bash
   npm run build
   ```

3. **Database Setup**
   - Ensure SQLite database is properly configured
   - Backup database regularly

4. **Security Considerations**
   - Change default admin credentials
   - Use HTTPS in production
   - Configure proper CORS origins
   - Set up proper logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue in the repository. 