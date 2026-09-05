import type { QualityRecordWithRisk } from '../types/quality';

export function exportRecordsToCSV(records: QualityRecordWithRisk[], filename: string = 'export.csv') {
  if (!records || !records.length) return;

  const headers = [
    'Reference Number',
    'Project',
    'Title',
    'Status',
    'Risk Level',
    'Issue Date',
    'Discipline',
    'Category',
    'Overdue',
  ];

  const csvRows = [headers.join(',')];

  for (const record of records) {
    const row = [
      `"${record.referenceNumber || ''}"`,
      `"${record.project || ''}"`,
      `"${(record.notificationTitle || '').replace(/"/g, '""')}"`, // Escape quotes in title
      `"${record.status || ''}"`,
      `"${record.riskLevel || ''}"`,
      `"${record.issuedDate || ''}"`,
      `"${record.discipline || ''}"`,
      `"${record.category || ''}"`,
      `"${record.isOverdue ? 'Yes' : 'No'}"`,
    ];
    csvRows.push(row.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
