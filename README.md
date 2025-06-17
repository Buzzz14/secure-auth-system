# Secure Authentication System

A robust, secure authentication system built with Next.js, featuring comprehensive security measures and user-friendly features.

## Features

### Security Features
- **Password Security**
  - Strong password requirements
  - Password history tracking
  - Password expiration and renewal policies
  - Secure password reset flow

- **Authentication Security**
  - JWT-based authentication
  - Secure token storage
  - Email verification
  - Rate limiting through captcha
  - Login attempt throttling
  - Session management

- **OTP Security**
  - Time-based OTP implementation
  - Automatic OTP expiration
  - Cooldown periods
  - Secure OTP delivery

- **CAPTCHA Protection**
  - Math-based captcha
  - Client and server-side validation
  - Dynamic question generation

- **API Security**
  - Input validation
  - Error handling
  - Proper HTTP status codes
  - Request size limits

- **Protection Against**
  - CORS attacks
  - CSRF attacks
  - XSS attacks
  - NoSQL injection
  - Brute force attacks

### User Features
- Email/Username login
- Secure password reset
- Email verification
- Account management
- Session control

## Tech Stack

- **Frontend**
  - Next.js 14
  - React
  - TypeScript
  - Tailwind CSS
  - React Hook Form
  - Zod

- **Backend**
  - Next.js API Routes
  - MongoDB
  - Mongoose
  - JWT
  - Bcrypt

- **Security**
  - mongo-sanitize
  - CSRF protection
  - Rate limiting
  - Input validation

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/secure-auth-system.git
cd secure-auth-system
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Security Features in Detail

### Login Throttling
- 5 failed attempts: 30 seconds block
- 6 failed attempts: 1 minute block
- 7 failed attempts: 30 minutes block
- 8 failed attempts: 1 hour block
- 9 failed attempts: 24 hours block
- 10+ failed attempts: Permanent block

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No common passwords
- Password history tracking

### CAPTCHA System
- Math-based questions
- Client-side validation
- Server-side verification
- Dynamic question generation
- Rate limiting integration

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/resend-reset-code` - Resend reset code

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the database
- All contributors who have helped improve this project
