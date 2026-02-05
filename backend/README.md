# Teacher Housing Management System - Backend

Node.js + Express.js backend for Teacher Housing Management System.

## Tech Stack

- Node.js 18+
- Express.js
- Google Sheets API (for data storage)
- Google Drive API (for file storage)
- Ready for Render deployment

## Project Structure

```
backend/
├── index.js              # Express app entry point
├── package.json          # Dependencies
├── routes/               # API routes
│   ├── auth.js          # Authentication
│   ├── users.js         # User management
│   ├── housing.js       # Housing operations
│   ├── report.js        # Reports
│   └── notify.js        # Notifications
├── services/            # Business logic
│   ├── db.js           # Google Sheets API layer
│   ├── drive.js        # Google Drive API layer
│   └── logic.js        # Core logic functions
├── middleware/         # Express middleware
│   └── auth.js        # Authentication middleware
└── README.md
```

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

Server runs on `PORT` environment variable (default: 3000).

## Environment Variables

Required:
- `GOOGLE_CREDENTIALS` - Service account JSON credentials (as string)

Optional:
- `PORT` - Server port (default: 3000)
- `PASSWORD_SALT` - Password hashing salt (default: THR_DEFAULT_SALT)
- `SPREADSHEET_ID` - Google Spreadsheet ID (default: 1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY)
- `DRIVE_FOLDER_PAYMENT_SLIPS` - Payment slips folder ID
- `DRIVE_FOLDER_ABOUT_IMAGES` - About images folder ID
- `DRIVE_FOLDER_EXPORTS` - Exports folder ID
- `NOTIFICATION_WEBHOOK_URL` - Webhook URL for notifications

## Google Cloud Setup

1. Create a Google Cloud Project
2. Enable Google Sheets API and Google Drive API
3. Create a Service Account
4. Download JSON credentials
5. Set `GOOGLE_CREDENTIALS` environment variable to the JSON content (as string)
6. Share the Spreadsheet with the service account email

## API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - Login
- `POST /logout` - Logout
- `GET /session` - Get session
- `POST /change-password` - Change password
- `POST /request-password-reset` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /register-request` - Registration request

### Users (`/api/users`)
- `GET /profile` - Get my profile
- `POST /profile` - Update my profile
- `GET /list` - List users (Admin/Deputy)
- `POST /set-status-or-role` - Set user status/role (Admin/Deputy)
- `POST /move-out` - Move out user (Admin/Deputy) - เปลี่ยนสถานะเป็น moved_out, อัปเดต unit เป็น vacant, เก็บข้อมูลย้อนหลัง

### Housing (`/api/housing`)
- `GET /billing/:unitId` - Get billing for unit
- `GET /payment-status` - Get payment status list
- `POST /payment` - Submit payment
- `GET /payment-history/:unitId` - Get payment history
- `GET /water-form/:unitId` - Get water form data
- `POST /water-reading` - Submit water reading
- `GET /water-report/:roundId` - Get water report for round (for executive report)
- `GET /electric-form/:roundId` - Get electric form data
- `POST /electric-reading` - Submit electric readings
- `POST /repair-request` - Submit repair request
- `POST /application` - Submit application
- `GET /queue-status/:applicationId` - Get queue status
- `GET /applications-queue` - List applications and queue (Admin)
- `POST /application-approve` - Approve application (Admin)
- `POST /application-reject` - Reject application (Admin)
- `POST /reorder-queue` - Reorder queue (Admin)

### Reports (`/api/report`)
- `GET /billing-rounds` - Get list of billing rounds
- `GET /executive-dashboard` - Executive dashboard
- `GET /period` - Report by period
- `GET /round-summary/:roundId` - Round summary
- `GET /central-ledger/:roundId` - Central ledger
- `POST /verify-bank-balance` - Verify bank balance
- `GET /audit-log` - Get audit log

### Notifications (`/api/notify`)
- `POST /payment-submitted` - Payment submitted notification
- `POST /new-application` - New application notification
- `POST /repair-request` - Repair request notification
- `POST /water-recorded` - Water recorded notification
- `POST /electric-recorded` - Electric recorded notification
- `POST /accounting-closed` - Accounting closed notification
- `POST /outstanding-found` - Outstanding found notification

## Authentication

Most endpoints require authentication via `X-Session-Id` header or `sessionId` in request body/query.

## Database

Uses Google Sheets as database. All data stored in:
- Spreadsheet ID: `1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY`
- Sheets: Users, Units, SysConfig, WaterReadings, ElectricReadings, BillingRounds, Payments, CentralLedger, Applications, Queue, AboutContent, AuditLog, RegistrationRequests, RepairRequests

## File Storage

Uses Google Drive for file storage:
- Payment Slips: Folder ID `1RK8PFdrFFGw_6gsmUxDrUqtCWZYuhUJF`
- About Images: Folder ID `1wVbFJ90GOoxM0FHe8ks8ddpRdw3OCrwQ`
- Exports: Folder ID `1JCt9ooyxkGvvKyhG-HuEysqf0ghKbgsg`

## Deployment

### Railway

1. Connect GitHub repository
2. Set environment variables (especially `GOOGLE_CREDENTIALS`)
3. Deploy

Railway will automatically:
- Run `npm install`
- Run `npm start`
- Use `PORT` from environment

## Notes

- Sessions stored in memory (expire after 24 hours)
- Password reset tokens stored in memory (expire after 1 hour)
- All data operations use Google Sheets API
- File uploads use Google Drive API
