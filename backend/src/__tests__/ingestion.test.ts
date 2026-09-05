/**
 * Ingestion Test
 *
 * Verifies that the DataService correctly parses and normalizes
 * all actual Excel files from the data directory.
 */

import path from 'path';
import { dataService } from '../services/dataService';

async function runTests() {
  console.log('=== Starting Ingestion Engine Tests ===\n');

  try {
    // 1. Load data
    await dataService.load();
    const records = await dataService.getRecords();

    // 2. Validate total record count (37)
    console.log('\n--- Test 1: Record Count ---');
    if (records.length === 37) {
      console.log('✅ PASS: Total record count is 37');
    } else {
      console.error(`❌ FAIL: Expected 37 records, got ${records.length}`);
      process.exit(1);
    }

    // 3. Validate breakdown
    console.log('\n--- Test 2: Breakdown by Record Type ---');
    const summary = await dataService.getSummary();
    if (summary.byRecordType['INCR'] === 19 && summary.byRecordType['LBE'] === 18) {
      console.log('✅ PASS: Found 19 INCR and 18 LBE records');
    } else {
      console.error(`❌ FAIL: Incorrect breakdown. Got INCR=${summary.byRecordType['INCR']}, LBE=${summary.byRecordType['LBE']}`);
      process.exit(1);
    }

    // 4. Validate specific record parsing (CRPO-160 LBE)
    console.log('\n--- Test 3: Specific Record Parsing (CRPO-160 LBE) ---');
    const crpoLbe = records.find(r => r.sourceFile === 'CRPO-160-LBE.xlsx' && r.serialNumber === 8);
    if (!crpoLbe) {
      console.error('❌ FAIL: Could not find CRPO-160 LBE record (Sl No 8)');
      process.exit(1);
    }
    
    // Check specific fields
    const lbeChecks = [
      crpoLbe.id === 'crpo160-lbe-342',
      crpoLbe.notificationTitle === 'RFI REJECTED - CONTRACTOR UTILISED UNQUALIFIED WELDER FOR TACK WELDING ACTIVITIES',
      crpoLbe.status === 'Closed',
      crpoLbe.issuedDate === '2026-07-15', // Issued Date 46218
      crpoLbe.responseDate === '2026-07-16', // First date of '16-07-2026,\r\n29-07-2026'
    ];
    
    if (lbeChecks.every(c => c)) {
      console.log('✅ PASS: CRPO-160 LBE record parsed correctly');
    } else {
      console.error('❌ FAIL: CRPO-160 LBE record field mismatch', crpoLbe);
      process.exit(1);
    }

    // 5. Validate specific record parsing (Dorra INCR)
    console.log('\n--- Test 4: Specific Record Parsing (Dorra INCR) ---');
    const dorraIncr = records.find(r => r.sourceFile === 'Dorra INCR.xlsx' && r.serialNumber === 27);
    if (!dorraIncr) {
      console.error('❌ FAIL: Could not find Dorra INCR record (SN 27)');
      process.exit(1);
    }

    const incrChecks = [
      dorraIncr.id === 'dorra-incr-dorra-pkg1-incr-027', // The reference number is DORRA-PKG1-INCR-027
      dorraIncr.subject.startsWith('During the dimensional inspection'),
      dorraIncr.notificationTitle.length <= 120, // Derived title
      dorraIncr.status === 'Closed',
      dorraIncr.issuedDate === '2026-07-03', // Issue Date 46206
      dorraIncr.repeatViolation === false
    ];

    if (incrChecks.every(c => c)) {
      console.log('✅ PASS: Dorra INCR record parsed correctly');
      console.log(`   Derived title: "${dorraIncr.notificationTitle}"`);
    } else {
      console.error('❌ FAIL: Dorra INCR record field mismatch', dorraIncr);
      process.exit(1);
    }

    // 6. Validate Repeat Violation Count (should be 5 in Dorra LBE)
    console.log('\n--- Test 5: Repeat Violations ---');
    if (summary.repeatViolations === 5) {
      console.log('✅ PASS: 5 repeat violations found in dashboard summary');
    } else {
      console.error(`❌ FAIL: Expected 5 repeat violations, got ${summary.repeatViolations}`);
      process.exit(1);
    }

    // 7. Validate Risk Engine
    console.log('\n--- Test 6: Risk Engine ---');
    // Using a future date (2026-09-01) for testing overdue logic
    const testRecords = (await import('../engines/riskEngine')).enrichWithRisk(records, '2026-09-01');
    const openRecords = testRecords.filter(r => r.status === 'Open');
    const overdue = openRecords.filter(r => r.isOverdue);
    
    if (overdue.length > 0) {
      console.log(`✅ PASS: Risk engine correctly identified ${overdue.length} overdue records (relative to 2026-09-01)`);
    } else {
      console.error('❌ FAIL: Risk engine found 0 overdue records (should be >0 since ACDs are in July/Aug 2026)');
      process.exit(1);
    }
    
    // Check if score is populated
    if (testRecords.every(r => typeof r.riskScore === 'number' && r.riskScore >= 0)) {
      console.log('✅ PASS: Risk engine correctly assigned risk scores to all records');
    } else {
      console.error('❌ FAIL: Risk engine failed to assign risk scores');
      process.exit(1);
    }

    // 8. Validate Notification Engine
    console.log('\n--- Test 7: Notification Engine ---');
    const notifications = await dataService.getNotifications(true);
    if (notifications.length > 0) {
      console.log(`✅ PASS: Notification engine generated ${notifications.length} notifications`);
      const recurringGroups = await dataService.getRecurringIssues();
      console.log(`✅ PASS: Notification engine identified ${recurringGroups.length} recurring issue groups`);
    } else {
      console.error('❌ FAIL: Notification engine failed to generate notifications');
      process.exit(1);
    }

    console.log('\n🎉 ALL TESTS PASSED!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exit(1);
  }
}

runTests();
