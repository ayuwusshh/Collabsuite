# Password Reset Feature - Setup Guide

This document explains how to set up and use the password reset functionality in CollabSuite.

## 📋 Overview

The password reset feature allows users to securely reset their password via email verification. The flow works as follows:

1. User clicks "Forgot password?" on the login page
2. User enters their email address
3. System sends a password reset email with a unique token
4. User clicks the link in the email
5. User enters a new password
6. System validates the token and updates the password
7. User is automatically logged in

## 🔐 Security Features

- **Token Hashing**: Reset tokens are hashed before storing in the database
- **Expiration**: Reset links expire after 1 hour
- **One-time Use**: Tokens are deleted after successful password reset
- **No User Enumeration**: System doesn't reveal if an email exists in the database

## 🛠️ Setup Instructions

### Step 1: Install Dependencies

The required packages are already installed:
- `nodemailer` - For sending emails
- `crypto` - For generating secure tokens (built-in Node.js module)

### Step 2: Configure Email Service

You need to set up email credentials in your `.env` file. We recommend using Gmail with an App Password.

#### Gmail Setup:

1. **Enable 2-Factor Authentication**:
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password

3. **Update `.env` file**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

#### Alternative Email Services:

If you want to use a different email service, update `backend/services/emailService.js`:

**For Outlook/Hotmail:**
```javascript
const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
```

**For Custom SMTP:**
```javascript
const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
```

### Step 3: Test the Feature

1. **Start the servers**:
   ```bash
   # Backend
   cd backend
   npm run nodemon

   # Frontend
   cd frontend
   npm run dev
   ```

2. **Test the flow**:
   - Go to http://localhost:5173
   - Click "Get Started" → "Sign In"
   - Click "Forgot password?"
   - Enter a registered email
   - Check your email inbox
   - Click the reset link
   - Enter a new password

## 📧 Email Template

The password reset email includes:
- Professional HTML design
- Clear call-to-action button
- Expiration notice (1 hour)
- Security warning
- Plain text link as fallback

You can customize the email template in `backend/services/emailService.js`.

## 🔧 API Endpoints

### POST `/auth/forgot-password`
Request a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### POST `/auth/reset-password/:token`
Reset password using the token from email.

**URL Parameter:**
- `token` - The reset token from the email link

**Request Body:**
```json
{
  "password": "newPassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successful",
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

## 🗄️ Database Schema

The User model includes two new fields:

```javascript
{
  resetPasswordToken: String,      // Hashed token
  resetPasswordExpires: Date       // Expiration timestamp
}
```

These fields are automatically cleared after successful password reset.

## 🎨 Frontend Routes

- `/forgot-password` - Email input page
- `/reset-password/:token` - New password input page

## ⚠️ Troubleshooting

### Email not sending:

1. **Check Gmail App Password**:
   - Make sure you're using the 16-character app password, not your regular password
   - Verify 2FA is enabled on your Google account

2. **Check Console Logs**:
   - Look for email errors in the backend console
   - Common error: "Invalid login: 535-5.7.8 Username and Password not accepted"
     - Solution: Generate a new app password

3. **Firewall/Network Issues**:
   - Some networks block SMTP ports
   - Try using a different network or VPN

### Token expired:

- Reset tokens expire after 1 hour
- User needs to request a new reset link

### Link not working:

- Ensure the `CLIENT_URL` in `.env` matches your frontend URL
- Check that the token in the URL matches the format

## 🚀 Production Deployment

Before deploying to production:

1. **Use Environment Variables**:
   - Never commit `.env` file
   - Set environment variables in your hosting platform

2. **Update CLIENT_URL**:
   ```env
   CLIENT_URL=https://your-production-domain.com
   ```

3. **Consider Using a Transactional Email Service**:
   - SendGrid
   - Mailgun
   - AWS SES
   - Postmark

   These services offer better deliverability and analytics.

4. **Rate Limiting**:
   - Consider adding rate limiting to prevent abuse
   - Example: Max 3 reset requests per hour per email

## 📝 Notes

- The system uses SHA-256 hashing for tokens
- Tokens are 32 bytes (64 hex characters)
- Password must be at least 6 characters
- User is automatically logged in after successful reset
