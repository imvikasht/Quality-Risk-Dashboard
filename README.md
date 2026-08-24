# Quality Risk & Notification Dashboard

An enterprise full-stack application for quality record ingestion, automated risk scoring, systemic issue detection, and real-time alerts.

---

## Features
- **Multi-Source Data Ingestion**: Abstracted `DataSource` architecture supporting local Excel spreadsheets (`.xlsx`) and live Google Sheets.
- **Dynamic Risk Engine**: Point-based risk scoring algorithm with transparent factor explanations (`Overdue ACD`, `Repeat Violation`, `Escalated NCR`).
- **Stateful Notification Engine**: Real-time alert generation for high-risk conditions and 30-second automated data polling.
- **Semantic Recurring Issue Clustering**: Groups similar quality defects across different projects using domain keyword matching.
- **Enterprise React UI**: Built with React 19, Tailwind CSS v4, Lucide React, and Recharts.

---

## Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend server runs at `http://localhost:3001`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend UI runs at `http://localhost:5173`.

---

## Data Source Configuration

To switch between **Excel** and **Google Sheets**:

Edit `backend/.env`:
```ini
# Use local Excel files in data/
DATA_SOURCE=excel

# OR use live Google Sheets
DATA_SOURCE=google-sheets
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## Testing & Build

### Running Backend Tests
```bash
cd backend
npm run test
```

### Production Build
```bash
# Build Backend
cd backend && npm run build

# Build Frontend
cd frontend && npm run build
```

---

## Documentation
- [Architecture & System Design](docs/FINAL_ARCHITECTURE.md)
- [REST API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [E2E Test Results](docs/TEST_RESULTS.md)
