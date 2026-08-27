import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Payment } from '../types';

interface ExportData {
  period: string;
  totalRevenue: number;
  studentsRevenue: number;
  academiesRevenue: number;
  activeStudents: number;
  activeAcademies: number;
  payments: Payment[];
}

export function exportToExcel(filename: string, data: unknown[]): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
}

export function exportPaymentsToPDF(data: ExportData): void {
  // Create a simple HTML document and print it as PDF
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relatório - ${data.period}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          color: #121212;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #00C853;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #00C853;
        }
        .period {
          font-size: 18px;
          color: #666;
          margin-top: 10px;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .card {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .card-title {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        .card-value {
          font-size: 24px;
          font-weight: bold;
          color: #121212;
        }
        .card-value.green { color: #00C853; }
        .card-value.blue { color: #3B82F6; }
        .card-value.red { color: #EF4444; }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #121212;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e5e5;
        }
        th {
          background: #f5f5f5;
          font-weight: 600;
        }
        .status-paid { color: #00C853; }
        .status-pending { color: #F59E0B; }
        .status-overdue { color: #EF4444; }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Muay Thai Manager</div>
        <div class="period">Relatório - ${data.period}</div>
      </div>

      <div class="summary">
        <div class="card">
          <div class="card-title">Receita Total</div>
          <div class="card-value green">${data.totalRevenue.toLocaleString('pt-BR')} €</div>
        </div>
        <div class="card">
          <div class="card-title">Alunos Ativos</div>
          <div class="card-value">${data.activeStudents}</div>
        </div>
        <div class="card">
          <div class="card-title">Academias Ativas</div>
          <div class="card-value">${data.activeAcademies}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Resumo de Receitas</div>
        <table>
          <tr>
            <th>Origem</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Alunos Particulares</td>
            <td class="status-paid">${data.studentsRevenue.toLocaleString('pt-BR')} €</td>
          </tr>
          <tr>
            <td>Academias</td>
            <td class="status-paid">${data.academiesRevenue.toLocaleString('pt-BR')} €</td>
          </tr>
          <tr style="font-weight: bold;">
            <td>Total</td>
            <td class="status-paid">${data.totalRevenue.toLocaleString('pt-BR')} €</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Status dos Pagamentos</div>
        <table>
          <tr>
            <th>Status</th>
            <th>Quantidade</th>
          </tr>
          <tr>
            <td class="status-paid">Pagos</td>
            <td>${data.payments.filter(p => p.status === 'paid').length}</td>
          </tr>
          <tr>
            <td class="status-pending">Pendentes</td>
            <td>${data.payments.filter(p => p.status === 'pending').length}</td>
          </tr>
          <tr>
            <td class="status-overdue">Atrasados</td>
            <td>${data.payments.filter(p => p.status === 'overdue').length}</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')} - Muay Thai Manager</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, 250);
}

export function exportAllSheets(data: {
  students: unknown[];
  academies: unknown[];
  events: unknown[];
  payments: unknown[];
}): void {
  const wb = XLSX.utils.book_new();

  const wsStudents = XLSX.utils.json_to_sheet(data.students);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Alunos');

  const wsAcademies = XLSX.utils.json_to_sheet(data.academies);
  XLSX.utils.book_append_sheet(wb, wsAcademies, 'Academias');

  const wsEvents = XLSX.utils.json_to_sheet(data.events);
  XLSX.utils.book_append_sheet(wb, wsEvents, 'Agenda');

  const wsPayments = XLSX.utils.json_to_sheet(data.payments);
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Financeiro');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'muay_thai_manager_backup.xlsx');
}
