# Quality Risk Dashboard — Deployment Guide

## Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

## 1. Backend Setup & Configuration

### Environment Variables
Copy `.env.example` to `.env` in `backend/`:
```bash
cp backend/.env.example backend/.env
```

Set the target data source:
```ini
PORT=3001
NODE_ENV=production
DATA_SOURCE=excel # Or 'google-sheets'

# Google Sheets Configuration (Required if DATA_SOURCE=google-sheets)
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### Installation & Build
```bash
cd backend
npm install
npm run build
```

### Starting Backend Server
```bash
npm run start
```

---

## 2. Frontend Build & Deployment

### Installation & Build
```bash
cd frontend
npm install
npm run build
```

The production assets will be output to `frontend/dist/`. Serve these files using NGINX, Vercel, Netlify, or any static file web server.

---

## 3. Production Verification
- Verify `GET http://localhost:3001/api/dashboard/summary` returns JSON data.
- Open the frontend application in browser and confirm background refresh works seamlessly every 30 seconds.
