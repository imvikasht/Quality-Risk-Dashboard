# Quality Risk Dashboard — REST API Reference

Base URL: `http://localhost:3001/api`

---

## Endpoints Summary

### 1. Quality Records
* **`GET /api/records`**
  * **Query Parameters**: `project`, `status`, `recordType`, `discipline`, `riskLevel`, `repeatViolation`, `search`
  * **Response**: List of enriched quality records with calculated risk scores and risk factors.

* **`GET /api/records/:id`**
  * **Response**: Detailed quality record object by ID.

---

### 2. Dashboard Metrics & Analytics
* **`GET /api/dashboard/summary`**
  * **Response**: High-level KPIs including `totalRecords`, `openRecords`, `closedRecords`, `overdueRecords`, `repeatViolations`, `byRiskLevel`, `recentRecords`.

* **`GET /api/dashboard/trends`**
  * **Response**: Time-series monthly aggregation of INCR vs LBE records.

* **`GET /api/dashboard/risk`**
  * **Response**: Count distribution across risk levels (Low, Medium, High, Critical).

---

### 3. Notifications & Alerts
* **`GET /api/notifications`**
  * **Query Parameters**: `includeReviewed` (`boolean`, default: `false`)
  * **Response**: Generated notifications matching rules 1-6.

* **`PATCH /api/notifications/:id/review`**
  * **Response**: Marks specified notification as reviewed (`isReviewed: true`).

---

### 4. Systemic Recurring Issues
* **`GET /api/recurring-issues`**
  * **Response**: List of semantically grouped quality issues containing `groupName`, `occurrences`, `projectsAffected`, `aggregateRiskLevel`, `relatedRecords`.

---

### 5. Data Management & Synchronization
* **`GET /api/refresh`**
  * **Response**: Triggers data re-ingestion from configured source (Excel/Google Sheets), updates risk scores & notifications, returns `recordCount` and `loadTime`.
