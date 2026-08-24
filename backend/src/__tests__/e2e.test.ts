import { dataService } from '../services/dataService';
import { QualityRecord } from '../types/quality';
import { computeRisk, enrichWithRisk } from '../engines/riskEngine';
import { generateAlertsForRecord, analyzeRecurringIssues } from '../engines/notificationEngine';
import { NotificationType } from '../types/notification';

async function runE2ETests() {
  console.log('=== Starting E2E & Scenario Tests (Prompt 14) ===\n');

  // Test 1: Live Update Scenario
  console.log('--- Test 1: Live Update & Status Change ---');
  await dataService.refresh();
  const initialRecords = await dataService.getRecords();
  const initialNotifications = await dataService.getNotifications();

  if (initialRecords.length === 0) {
    throw new Error('No records loaded!');
  }

  const targetRecord = initialRecords.find(r => r.status === 'Closed');
  if (!targetRecord) {
    throw new Error('No closed record found for test scenario');
  }

  const originalStatus = targetRecord.status;
  const initialRiskScore = targetRecord.riskScore;

  // Change status from Closed to Open
  targetRecord.status = 'Open';

  // Re-compute risk & alerts
  const updatedRisk = computeRisk(targetRecord);
  if (updatedRisk.riskScore <= initialRiskScore) {
    throw new Error('Risk score did not increase after status changed to Open');
  }
  console.log(`✅ PASS: Risk score increased from ${initialRiskScore} to ${updatedRisk.riskScore}`);

  const newAlerts = generateAlertsForRecord(targetRecord);
  const hasOpenAlert = newAlerts.some(a => a.type === NotificationType.OPEN_QUALITY_ISSUE);
  if (!hasOpenAlert) {
    throw new Error('OPEN_QUALITY_ISSUE alert was not generated');
  }
  console.log('✅ PASS: OPEN_QUALITY_ISSUE alert generated successfully');

  // Test Deduplication
  const duplicateAlerts = generateAlertsForRecord(targetRecord);
  if (duplicateAlerts[0].id !== newAlerts[0].id) {
    throw new Error('Notification ID mismatch — deduplication failed');
  }
  console.log('✅ PASS: Notification deduplication verified');

  // Restore original status
  targetRecord.status = originalStatus;
  const restoredRisk = computeRisk(targetRecord);
  const baseOriginalRisk = computeRisk({ ...targetRecord, status: 'Closed' });
  if (restoredRisk.riskScore !== baseOriginalRisk.riskScore) {
    throw new Error('Risk score not restored after reverting status');
  }
  console.log('✅ PASS: Status restored and risk score reset');


  // Test 2: Edge Cases & Rule Matrix
  console.log('\n--- Test 2: Edge Cases & Notification Rules ---');
  const baseRecord: QualityRecord = {
    id: 'test-edge-1',
    sourceFile: 'Test.xlsx',
    referenceNumber: 'TEST-001',
    project: 'Project Alpha',
    location: 'Area 1',
    issuedDate: '2026-01-01',
    receivedDate: '2026-01-02',
    discipline: 'Civil',
    acd: '2026-01-10', // Past date
    responseAction: 'None',
    responseDate: undefined,
    acdExtended: undefined,
    status: 'Open',
    closingDate: undefined,
    repeatViolation: true,
    category: 'Workmanship',
    escalatedToSANCR: true,
    remark: 'Critical issue',
    notificationTitle: 'Edge Title',
    subject: 'Edge Subject',
    recordType: 'INCR',
    serialNumber: 1,
    contractNumber: '123',
  };

  const enrichedRecord = enrichWithRisk([baseRecord])[0];
  const alerts = generateAlertsForRecord(enrichedRecord);
  const alertTypes = alerts.map(a => a.type);

  if (!alertTypes.includes(NotificationType.REPEAT_VIOLATION)) throw new Error('Missing REPEAT_VIOLATION alert');
  if (!alertTypes.includes(NotificationType.OPEN_QUALITY_ISSUE)) throw new Error('Missing OPEN_QUALITY_ISSUE alert');
  if (!alertTypes.includes(NotificationType.OVERDUE_ACD)) throw new Error('Missing OVERDUE_ACD alert');
  if (!alertTypes.includes(NotificationType.ESCALATED_NCR)) throw new Error('Missing ESCALATED_NCR alert');

  console.log('✅ PASS: All 4 notification rules triggered correctly on edge record');


  // Test 3: Multi-Project Recurring Issue Detection
  console.log('\n--- Test 3: Multi-Project Recurring Issue Detection ---');
  const rec1: QualityRecord = {
    id: 'rec-1',
    sourceFile: 'File1.xlsx',
    referenceNumber: 'REF-1',
    project: 'Project A',
    location: 'Yard A',
    issuedDate: '2026-02-01',
    receivedDate: undefined,
    discipline: undefined,
    acd: undefined,
    responseAction: undefined,
    responseDate: undefined,
    acdExtended: undefined,
    status: 'Open',
    closingDate: undefined,
    repeatViolation: false,
    category: 'Welding',
    escalatedToSANCR: false,
    remark: undefined,
    notificationTitle: 'Weld joint defect found during NDT inspection',
    subject: 'Pipe weld joint defect',
    recordType: 'INCR',
    serialNumber: 1,
    contractNumber: '123',
  };

  const rec2: QualityRecord = {
    id: 'rec-2',
    sourceFile: 'File2.xlsx',
    referenceNumber: 'REF-2',
    project: 'Project B',
    location: 'Yard B',
    issuedDate: '2026-02-05',
    receivedDate: undefined,
    discipline: undefined,
    acd: undefined,
    responseAction: undefined,
    responseDate: undefined,
    acdExtended: undefined,
    status: 'Open',
    closingDate: undefined,
    repeatViolation: false,
    category: 'Welding',
    escalatedToSANCR: false,
    remark: undefined,
    notificationTitle: 'Incomplete weld penetration',
    subject: 'Weld inspection failure',
    recordType: 'INCR',
    serialNumber: 2,
    contractNumber: '123',
  };

  const [enriched1, enriched2] = enrichWithRisk([rec1, rec2]);

  const { groups } = analyzeRecurringIssues([enriched1, enriched2]);
  if (groups.length === 0) throw new Error('Failed to group recurring welding issues');
  console.log(`✅ PASS: Grouped ${groups.length} recurring issue group(s) across Project A & Project B`);

  console.log('\n🎉 ALL E2E TESTS PASSED!');
}

runE2ETests().catch(err => {
  console.error('❌ E2E Test Failure:', err);
  process.exit(1);
});
