# Environment Variables Setup

This project uses a single `.env` file for configuration.

## Setup Instructions

1. **Create the .env file:**
   - Create a `.env` file in the `server` directory
   - Copy the example values from `.env.example` (if available) or use the template below

2. **Update the values:**
   - Open `.env` and update all placeholder values with your actual configuration
   - Make sure to set appropriate values for your environment (development or production)

## Environment Variables

The following environment variables are used:

- `PORT` - Server port number
- `ORIGIN` - CORS allowed origin URL
- `MONGODB_URL` - MongoDB connection string
- `DB_NAME` - Default database name
- `SECRET_KEY` - JWT secret key (use a strong random string in production)
- `JWT_EXPIRY` - JWT token expiration time (e.g., "24h")
- `EMAIL_HOST` - SMTP server host
- `EMAIL_PORT` - SMTP server port
- `EMAIL_USER` - Email account username
- `EMAIL_PASS` - Email account password
- `OTP_EXPIRY_MINUTES` - OTP expiration time in minutes

## Security Notes

- **Never commit** the `.env` file to version control
- Use strong, unique `SECRET_KEY` values
- Keep credentials secure and never share them
- The `.env.example` file (if present) is safe to commit as it doesn't contain real credentials

