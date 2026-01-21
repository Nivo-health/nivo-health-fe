// Print utilities for A4 and Thermal layouts

import type { Patient, Visit, Prescription } from '../types';

const CLINIC_NAME = (import.meta as any).env?.VITE_CLINIC_NAME || 'Clinic OPD Management';

export const printUtils = {
  /**
   * Generate A4 prescription HTML
   */
  generateA4Prescription(
    patient: Patient,
    visit: Visit,
    prescription: Prescription
  ): string {
    const date = new Date(visit.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const medicinesHtml = prescription.medicines
      .map(
        (med) => `
      <tr>
        <td class="border px-4 py-2">${med.name}</td>
        <td class="border px-4 py-2">${med.dosage}</td>
        <td class="border px-4 py-2">${med.duration}</td>
        <td class="border px-4 py-2">${med.notes || '-'}</td>
      </tr>
    `
      )
      .join('');

    const followUpHtml = prescription.followUp
      ? `<p class="mt-4"><strong>Follow-up:</strong> After ${prescription.followUp.value} ${prescription.followUp.unit}</p>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Prescription - ${patient.name}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 8mm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 210mm;
              margin: 0 auto;
              padding: 5mm;
              color: #000;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
            }
            .clinic-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .patient-info {
              margin-bottom: 20px;
            }
            .patient-info p {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }
            .signature {
              margin-top: 50px;
              text-align: right;
            }
            .signature-line {
              border-top: 1px solid #000;
              width: 200px;
              margin-left: auto;
              margin-top: 50px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">${CLINIC_NAME}</div>
          </div>
          <div class="patient-info">
            <p><strong>Patient Name:</strong> ${patient.name}</p>
            <p><strong>Age:</strong> ${patient.age || 'N/A'} ${patient.gender ? `| Gender: ${patient.gender === 'M' ? 'Male' : 'Female'}` : ''}</p>
            <p><strong>Mobile:</strong> ${patient.mobile}</p>
            <p><strong>Date:</strong> ${date}</p>
          </div>
          ${visit.notes ? `<div class="notes"><strong>Notes:</strong> ${visit.notes}</div>` : ''}
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Duration</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${medicinesHtml}
            </tbody>
          </table>
          ${followUpHtml}
          <div class="signature">
            <div class="signature-line"></div>
            <p>Doctor's Signature</p>
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Generate Thermal prescription HTML
   */
  generateThermalPrescription(
    patient: Patient,
    visit: Visit,
    prescription: Prescription
  ): string {
    const date = new Date(visit.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const medicinesHtml = prescription.medicines
      .map(
        (med) => `
      <div class="medicine-item">
        <div class="medicine-name">${med.name}</div>
        <div class="medicine-details">${med.dosage} - ${med.duration}${med.notes ? ` (${med.notes})` : ''}</div>
      </div>
    `
      )
      .join('');

    const followUpHtml = prescription.followUp
      ? `<div class="follow-up">Follow-up: ${prescription.followUp.value} ${prescription.followUp.unit}</div>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Prescription - ${patient.name}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 5mm;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              max-width: 70mm;
              margin: 0 auto;
              padding: 5mm;
              color: #000;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 1px dashed #000;
              padding-bottom: 5px;
            }
            .clinic-name {
              font-size: 14px;
              font-weight: bold;
            }
            .patient-info {
              font-size: 11px;
              margin-bottom: 10px;
              line-height: 1.4;
            }
            .medicine-item {
              margin: 8px 0;
              padding-bottom: 8px;
              border-bottom: 1px dotted #ccc;
            }
            .medicine-name {
              font-weight: bold;
              margin-bottom: 2px;
            }
            .medicine-details {
              font-size: 10px;
              margin-left: 5px;
            }
            .follow-up {
              margin-top: 10px;
              font-weight: bold;
              text-align: center;
            }
            .signature {
              margin-top: 20px;
              text-align: center;
              font-size: 10px;
            }
            .signature-line {
              border-top: 1px solid #000;
              width: 60mm;
              margin: 10px auto;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">${CLINIC_NAME}</div>
          </div>
          <div class="patient-info">
            <div><strong>${patient.name}</strong></div>
            <div>${patient.age ? `Age: ${patient.age}` : ''} ${patient.gender ? `| ${patient.gender === 'M' ? 'M' : 'F'}` : ''}</div>
            <div>${patient.mobile} | ${date}</div>
          </div>
          ${medicinesHtml}
          ${followUpHtml}
          <div class="signature">
            <div class="signature-line"></div>
            <div>Doctor's Signature</div>
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Print prescription in A4 format
   */
  printA4(patient: Patient, visit: Visit, prescription: Prescription) {
    const html = this.generateA4Prescription(patient, visit, prescription);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  },

  /**
   * Print prescription in Thermal format
   */
  printThermal(patient: Patient, visit: Visit, prescription: Prescription) {
    const html = this.generateThermalPrescription(patient, visit, prescription);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  },
};
