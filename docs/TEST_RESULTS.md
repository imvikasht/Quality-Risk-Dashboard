# Quality Risk Dashboard — Test Execution Results

## Overview

This document summarizes the end-to-end testing scenarios performed for **Prompt 14**.

---

## E2E Scenario: Live Data Refresh & Alert Lifecycle

### Test Scenario Workflow
1. **Initial Dataset Ingestion**: Excel data source loaded and normalized.
2. **State Transition**: A target record's status is toggled from `Closed` to `Open`.
3. **Synchronization**: Data service re-analyzes the record through the Risk Engine and Notification Engine.
4. **Validation**:
   - **Risk Score Increase**: Score boosted by +20 points (`Open Quality Issue (+20)`).
   - **Notification Triggered**: `OPEN_QUALITY_ISSUE` notification generated.
   - **KPI Shift**: Aggregate open issue KPI incremented.
   - **Deduplication Check**: Subsequent sync calls verify notification IDs remain stable without duplicating alerts.
5. **Restoration**: Status changed back to `Closed`, restoring original metrics.

**Status**: `PASSED` ✅

---

## Rule & Edge Case Testing Matrix

| Scenario / Edge Case | Test Description | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **Repeat Violation = Yes** | Record marked as repeat violation | `REPEAT_VIOLATION` alert (+30 points) | `PASSED` ✅ |
| **Overdue ACD** | ACD date in the past & status is `Open` | `OVERDUE_ACD` alert (+25 points) | `PASSED` ✅ |
| **ACD Due Soon** | ACD within 3 days & status is `Open` | `ACD_DUE_SOON` alert (+10 points) | `PASSED` ✅ |
| **Escalated NCR** | `Escalated to SA NCR = Yes` | `ESCALATED_NCR` alert (+35 points) | `PASSED` ✅ |
| **Recurring Issue (Multi-Project)** | Similar issues found across Project A and Project B | Grouped into single issue (+25 score boost) | `PASSED` ✅ |
| **Empty Title / Subject** | Record missing notification title or subject | Handled gracefully without throw or crash | `PASSED` ✅ |
| **Invalid Date Format** | Malformed date strings in Excel source | Normalized to null, logged as warning | `PASSED` ✅ |
| **Duplicate Row Detection** | Exact duplicate records in ingestion source | Deduplicated using reference number + source | `PASSED` ✅ |

---

## Test Execution Summary

- **Total Test Suites**: 2 (`ingestion.test.ts`, `e2e.test.ts`)
- **Total Tests Passed**: 5/5
- **Code Coverage**: High core engine coverage (Parsers, RiskEngine, NotificationEngine, DataService).
