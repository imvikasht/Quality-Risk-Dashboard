# Quality Risk & Notification Dashboard Architecture

## 1. System Overview

The Quality Risk & Notification Dashboard is a full-stack web application designed to analyze quality-management datasets (LBE and INCR records) to detect risks, recurring problems, and track resolutions. 

The architecture is divided into a decoupled frontend (React + Vite) and backend (Node.js + Express), connected via a RESTful API.

```mermaid
graph LR
    subgraph Frontend [Frontend (React + Vite)]
        UI[UI Components] --> State[State Management / Hooks]
        State --> ApiClient[API Client]
    end

    subgraph Backend [Backend (Node.js + Express)]
        Router[API Routes] --> Controller[Controllers]
        Controller --> Service[Data Service]
        Service --> RiskEngine[Risk Engine]
        Service --> Parser[Data Normalizer]
    end

    subgraph Data Layer
        Parser -.-> Excel[Excel Files]
        Parser -.-> GSheets[Google Sheets API (Future)]
    end

    ApiClient -- HTTP GET/POST --> Router
```

## 2. Shared Data Model

A core principle of this architecture is the **Unified Data Model**. Both INCR (formal Internal Non-Conformance Reports) and LBE (Letters Before Escalation) are parsed from wildly different Excel schemas into a single normalized TypeScript interface: `QualityRecord`.

This allows the frontend and risk engine to operate uniformly across all quality findings without worrying about whether a record came from the Dorra INCR log or the CRPO-160 LBE log.

## 3. Backend Architecture

The backend is structured into distinct layers to maintain separation of concerns:

- **`config/fileConfigs.ts`**: Maps original Excel column names and metadata (project, record type, header row) to the unified data model.
- **`parsers/`**: 
  - `excelReader.ts`: A dumb extractor. Reads raw rows based on header definitions.
  - `dataNormalizer.ts`: The smart parser. Handles missing values, generated IDs, and date format quirks.
- **`utils/normalize.ts`**: Dedicated utilities for date conversion (handling Excel serials vs DD-MM-YYYY strings), enums, and boolean coercion.
- **`engines/riskEngine.ts`**: Pure business logic that evaluates a `QualityRecord` to calculate an overall `RiskLevel` (Critical, High, Medium, Low) and lists `riskFactors`.
- **`services/dataService.ts`**: A singleton that orchestrates data loading, caching, and provides querying capabilities (filters, stats). It uses the **Adapter Pattern** (`DataSource` interface) to allow future swap-out of Excel for Google Sheets.
- **`controllers/` & `routes/`**: Standard Express layer exposing REST endpoints.

## 4. Frontend Architecture (Planned)

The frontend will use React, Vite, and Tailwind CSS.

- **`components/`**: Reusable UI elements (Buttons, Badges, Table Rows).
- **`pages/`**: Full route views (Dashboard Home, Record List, Record Detail).
- **`charts/`**: Recharts implementations for data visualization.
- **`services/`**: Axios wrappers for API calls.
- **`types/`**: Shared TypeScript definitions imported from the backend model.

## 5. Data Flow (Ingestion)

1. The server starts and `DataService` initializes.
2. `excelReader` scans `/data`, extracting raw JSON based on `fileConfigs`.
3. `dataNormalizer` iterates over the raw data, casting to the `QualityRecord` shape.
4. `riskEngine` attaches computed fields (`isOverdue`, `riskLevel`).
5. The final enriched array is cached in `DataService`.
6. Clients request `/api/records` or `/api/summary` to drive the UI.
