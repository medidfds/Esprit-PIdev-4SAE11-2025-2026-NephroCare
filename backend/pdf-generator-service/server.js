const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const winston = require('winston');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import PDF generation modules
const { jsPDF } = require('jspdf');
const puppeteer = require('puppeteer');
const ejs = require('ejs');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://localhost:4201',
    'http://localhost:3000',
    'http://localhost:4369'
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/pdf-generator-service.log' })
  ]
});

// Configuration
const config = {
  PORT: process.env.PORT || 4000,
  HOSPITALIZATION_SERVICE_URL: process.env.HOSPITALIZATION_SERVICE_URL || 'http://localhost:8070/hospitalization/api',
  MONITORING_SERVICE_URL: process.env.MONITORING_SERVICE_URL || 'http://localhost:8799/api',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, 'reports');
fs.mkdir(reportsDir, { recursive: true }).catch(console.error);

// Helper Functions
async function fetchHospitalizationData(hospitalizationId) {
  try {
    const response = await axios.get(`${config.HOSPITALIZATION_SERVICE_URL}/hospitalizations/${hospitalizationId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch hospitalization data: ${error.message}`);
    throw new Error('Failed to fetch hospitalization data');
  }
}

async function fetchPatientAlerts(patientId) {
  try {
    const response = await axios.get(`${config.MONITORING_SERVICE_URL}/alerts/patient/${patientId}/stats`);
    return response.data;
  } catch (error) {
    logger.warn(`Failed to fetch patient alerts: ${error.message}`);
    return [];
  }
}

async function fetchPatientInfo(userId) {
  try {
    // This would typically call a user/patient service
    // For now, return basic info
    return {
      id: userId,
      name: `Patient ${userId}`,
      age: 45,
      gender: 'Male'
    };
  } catch (error) {
    logger.warn(`Failed to fetch patient info: ${error.message}`);
    return { id: userId, name: `Patient ${userId}` };
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function calculateHospitalizationDuration(admissionDate, dischargeDate) {
  const admission = new Date(admissionDate);
  const discharge = dischargeDate ? new Date(dischargeDate) : new Date();

  const diffTime = Math.abs(discharge - admission);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// PDF Generation Functions
async function generateHospitalizationReport(data) {
  const { hospitalization, patient, alerts } = data;

  // Create PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('NEPHROCARE HOSPITAL', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;
  doc.setFontSize(16);
  doc.text('Hospitalization Report', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 20;

  // Patient Information Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 20, yPosition);

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  doc.text(`Patient ID: ${patient.id}`, 30, yPosition);
  yPosition += 8;
  doc.text(`Name: ${patient.name}`, 30, yPosition);
  yPosition += 8;
  doc.text(`Age: ${patient.age || 'N/A'}`, 30, yPosition);
  yPosition += 8;
  doc.text(`Gender: ${patient.gender || 'N/A'}`, 30, yPosition);

  yPosition += 15;

  // Hospitalization Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Hospitalization Details', 20, yPosition);

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  doc.text(`Admission Date: ${formatDate(hospitalization.admissionDate)}`, 30, yPosition);
  yPosition += 8;
  doc.text(`Discharge Date: ${hospitalization.dischargeDate ? formatDate(hospitalization.dischargeDate) : 'Ongoing'}`, 30, yPosition);
  yPosition += 8;
  doc.text(`Duration: ${calculateHospitalizationDuration(hospitalization.admissionDate, hospitalization.dischargeDate)} days`, 30, yPosition);
  yPosition += 8;
  doc.text(`Status: ${hospitalization.status}`, 30, yPosition);
  yPosition += 8;
  doc.text(`Admission Reason: ${hospitalization.admissionReason}`, 30, yPosition);

  yPosition += 15;

  // Room Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Room Information', 20, yPosition);

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  if (hospitalization.room) {
    doc.text(`Room Number: ${hospitalization.room.roomNumber}`, 30, yPosition);
    yPosition += 8;
    doc.text(`Room Type: ${hospitalization.room.type}`, 30, yPosition);
    yPosition += 8;
    doc.text(`Capacity: ${hospitalization.room.capacity}`, 30, yPosition);
  }

  yPosition += 15;

  // Medical Staff
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Medical Staff', 20, yPosition);

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  doc.text(`Attending Doctor ID: ${hospitalization.attendingDoctorId}`, 30, yPosition);

  yPosition += 15;

  // Alerts Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Health Alerts Summary', 20, yPosition);

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  if (alerts && alerts.length > 0) {
    const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL').length;
    const totalAlerts = alerts.length;

    doc.text(`Total Alerts: ${totalAlerts}`, 30, yPosition);
    yPosition += 8;
    doc.text(`Critical Alerts: ${criticalAlerts}`, 30, yPosition);
  } else {
    doc.text('No alerts recorded during hospitalization', 30, yPosition);
  }

  yPosition += 15;

  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated on ${new Date().toLocaleString()}`, 20, footerY);
  doc.text('NephroCare Hospital Management System', pageWidth - 20, footerY, { align: 'right' });

  return doc;
}

async function generateAdvancedHospitalizationReport(data) {
  const { hospitalization, patient, alerts } = data;

  // HTML template for advanced report
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Hospitalization Report - ${patient.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .title { font-size: 18px; margin-top: 10px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .status-active { background: #dcfce7; color: #166534; }
            .status-completed { background: #dbeafe; color: #1e40af; }
            .alerts-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .alerts-table th, .alerts-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
            .alerts-table th { background: #f9fafb; font-weight: bold; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">NEPHROCARE HOSPITAL</div>
            <div class="title">Hospitalization Report</div>
        </div>

        <div class="section">
            <div class="section-title">Patient Information</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Patient ID:</span>
                    <span class="value">${patient.id}</span>
                </div>
                <div class="info-item">
                    <span class="label">Name:</span>
                    <span class="value">${patient.name}</span>
                </div>
                <div class="info-item">
                    <span class="label">Age:</span>
                    <span class="value">${patient.age || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Gender:</span>
                    <span class="value">${patient.gender || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Hospitalization Details</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Admission Date:</span>
                    <span class="value">${formatDate(hospitalization.admissionDate)}</span>
                </div>
                <div class="info-item">
                    <span class="label">Discharge Date:</span>
                    <span class="value">${hospitalization.dischargeDate ? formatDate(hospitalization.dischargeDate) : 'Ongoing'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Duration:</span>
                    <span class="value">${calculateHospitalizationDuration(hospitalization.admissionDate, hospitalization.dischargeDate)} days</span>
                </div>
                <div class="info-item">
                    <span class="label">Status:</span>
                    <span class="value">
                        <span class="status status-${hospitalization.status.toLowerCase()}">${hospitalization.status}</span>
                    </span>
                </div>
                <div class="info-item" style="grid-column: span 2;">
                    <span class="label">Admission Reason:</span>
                    <span class="value">${hospitalization.admissionReason}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Room Information</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Room Number:</span>
                    <span class="value">${hospitalization.room?.roomNumber || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Room Type:</span>
                    <span class="value">${hospitalization.room?.type || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Capacity:</span>
                    <span class="value">${hospitalization.room?.capacity || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Medical Staff</div>
            <div class="info-item">
                <span class="label">Attending Doctor ID:</span>
                <span class="value">${hospitalization.attendingDoctorId}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Health Alerts Summary</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Total Alerts:</span>
                    <span class="value">${alerts ? alerts.length : 0}</span>
                </div>
                <div class="info-item">
                    <span class="label">Critical Alerts:</span>
                    <span class="value">${alerts ? alerts.filter(a => a.severity === 'CRITICAL').length : 0}</span>
                </div>
            </div>

            ${alerts && alerts.length > 0 ? `
            <table class="alerts-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Message</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${alerts.slice(0, 10).map(alert => `
                        <tr>
                            <td>${alert.type || 'N/A'}</td>
                            <td>${alert.severity || 'N/A'}</td>
                            <td>${alert.message || 'N/A'}</td>
                            <td>${alert.createdAt ? formatDate(alert.createdAt) : 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<p>No alerts recorded during hospitalization.</p>'}
        </div>

        <div class="footer">
            <div>Report generated on ${new Date().toLocaleString()}</div>
            <div>NephroCare Hospital Management System</div>
        </div>
    </body>
    </html>
  `;

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm'
    }
  });

  await browser.close();

  return pdfBuffer;
}

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'PDF Generator Service',
    version: '1.0.0'
  });
});

app.get('/reports/hospitalization/:id', async (req, res) => {
  try {
    const hospitalizationId = req.params.id;
    const format = req.query.format || 'basic'; // 'basic' or 'advanced'

    logger.info(`Generating hospitalization report for ID: ${hospitalizationId}, format: ${format}`);

    // Fetch hospitalization data
    const hospitalization = await fetchHospitalizationData(hospitalizationId);

    // Fetch related data
    const patient = await fetchPatientInfo(hospitalization.userId);
    const alerts = await fetchPatientAlerts(hospitalization.userId);

    const reportData = {
      hospitalization,
      patient,
      alerts,
      generatedAt: new Date()
    };

    let pdfBuffer;

    if (format === 'advanced') {
      pdfBuffer = await generateAdvancedHospitalizationReport(reportData);
    } else {
      const doc = await generateHospitalizationReport(reportData);
      pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    }

    // Generate filename
    const filename = `hospitalization_report_${hospitalizationId}_${Date.now()}.pdf`;

    // Save to file (optional)
    const filePath = path.join(reportsDir, filename);
    await fs.writeFile(filePath, pdfBuffer);

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

    logger.info(`Hospitalization report generated successfully: ${filename}`);

  } catch (error) {
    logger.error(`Error generating hospitalization report: ${error.message}`);
    res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

app.get('/api/reports/hospitalization/:id/preview', async (req, res) => {
  try {
    const hospitalizationId = req.params.id;

    // Fetch basic data for preview
    const hospitalization = await fetchHospitalizationData(hospitalizationId);
    const patient = await fetchPatientInfo(hospitalization.userId);

    res.json({
      hospitalizationId,
      patientName: patient.name,
      admissionDate: hospitalization.admissionDate,
      status: hospitalization.status,
      roomNumber: hospitalization.room?.roomNumber,
      duration: calculateHospitalizationDuration(hospitalization.admissionDate, hospitalization.dischargeDate),
      preview: true
    });

  } catch (error) {
    logger.error(`Error fetching report preview: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch preview',
      message: error.message
    });
  }
});

app.get('/api/reports/list', async (req, res) => {
  try {
    // In a real implementation, this would query a database
    // For now, return mock data
    const reports = [
      {
        id: 'sample-1',
        type: 'hospitalization',
        filename: 'hospitalization_report_1_1640995200000.pdf',
        createdAt: new Date(),
        size: '245KB'
      }
    ];

    res.json({ reports });

  } catch (error) {
    logger.error(`Error listing reports: ${error.message}`);
    res.status(500).json({
      error: 'Failed to list reports',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error(`Unhandled error: ${error.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.PORT;

app.listen(PORT, () => {
  logger.info(`PDF Generator Service running on port ${PORT}`);
  console.log(`🚀 PDF Generator Service listening on port ${PORT}`);
  console.log(`📄 PDF reports available at http://localhost:${PORT}/api/reports`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = { app };