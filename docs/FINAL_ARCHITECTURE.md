# Quality Risk Dashboard — Final Architecture & System Design

## 1. Executive Summary
The **Quality Risk & Notification Dashboard** is an enterprise-grade quality management application designed to ingest quality records (LBE and INCR logs) from heterogeneous data sources (local Excel spreadsheets or Google Sheets), execute automated risk scoring, detect systemic/recurring quality violations, and deliver real-time notifications to quality managers.

---

## 2. High-Level System Architecture

```
                       +-----------------------------+
                       |    Heterogeneous Sources    |
                       |  (Excel Files / Google)     |
                       +--------------+--------------+
                                      |
                                      v
                       +-----------------------------+
                       |   DataSource Abstraction    |
                       | (Excel / GoogleSheets Source)|
                       +--------------+--------------+
                                      |
                                      v
                       +-----------------------------+
                       |  DataNormalizer & Sanitizer |
                       | (Produces QualityRecord[])  |
                       +--------------+--------------+
                                      |
                                      v
                       +-----------------------------+
                       |    Risk Scoring Engine      |
                       | (Point Weights & Factors)   |
                       +--------------+--------------+
                                      |
                                      v
                       +-----------------------------+
                       |   Notification Engine       |
                       | (Alert Rules 1-5 + Rule 6)  |
                       +--------------+--------------+
                                      |
                                      v
                       +-----------------------------+
                       |   In-Memory Data Service    |
                       | (Deduplicated State Cache)  |
                       +--------------+--------------+
                                      |
                                      v
                       +-----------------------------+
                       |      RESTful API Layer      |
                       |      (Express Routes)       |
                       +--------------+--------------+
                                      |
                                      v
                       +-----------------------------+
                       |      React 19 Frontend      |
                       |  (Vite + Tailwind + Charts) |
                       +-----------------------------+
```

---

## 3. Core Engine Details

### Data Normalization Pipeline
- **Raw Data Ingestion**: Parses Excel sheets or fetches Google Sheet cells.
- **Field Normalization**: Maps diverse column titles (e.g., `LBE No.`, `NCR No.`, `Discipline`) into a unified `QualityRecord` interface.
- **Date Parsing**: Robust date normalizer parses `YYYY-MM-DD`, `DD/MM/YYYY`, and Excel serial dates.

### Risk Engine (`riskEngine.ts`)
Calculates a cumulative risk score based on configurable weightings:
- **Overdue ACD**: +25 pts (+1 pt per overdue day)
- **Repeat Violation**: +30 pts
- **Critical Severity**: +35 pts
- **Open Status**: +20 pts
- **Recurring Group Member**: +25 pts
- **Risk Level Bands**: Low (0-30), Medium (31-50), High (51-70), Critical (71+).

### Notification Engine (`notificationEngine.ts`)
- **Rules 1–5**: Evaluates records against alert criteria (`REPEAT_VIOLATION`, `OPEN_QUALITY_ISSUE`, `OVERDUE_ACD`, `ACD_DUE_SOON`, `ESCALATED_NCR`).
- **Rule 6 (Semantic Keyword Clustering)**: Uses tokenized matching against a dictionary of quality domain topics (e.g., `weld`, `concrete`, `fit-up`, `coating`) to aggregate systemic quality issues across multiple projects.

---

## 4. Frontend Design Architecture
- **Framework**: React 19 + Vite + TypeScript.
- **UI & Styling**: Tailwind CSS v4, Lucide React Icons, Recharts visualizer.
- **State Management**: Reactive state with 30-second background polling via `/api/refresh` and event-driven updates via `dataRefreshed`.
