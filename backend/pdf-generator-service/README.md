# PDF Generator Service

A Node.js microservice for generating PDF reports from hospitalization data in the NephroCare healthcare system.

## Features

- **Hospitalization Reports**: Generate comprehensive PDF reports for patient hospitalizations
- **Multiple Formats**: Basic PDF generation and advanced HTML-to-PDF conversion
- **Data Integration**: Fetches data from hospitalization and monitoring services
- **Patient Information**: Includes patient details, medical staff, room information
- **Health Alerts**: Integrates patient alert history into reports
- **Professional Layout**: Medical-grade report formatting

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **PDF Generation**: jsPDF + Puppeteer
- **HTTP Client**: Axios
- **Logging**: Winston
- **Security**: Helmet, CORS
- **Deployment**: Docker

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Access to hospitalization service (port 8070)
- Access to monitoring service (port 8799)

### Installation

```bash
# Navigate to the service directory
cd backend/pdf-generator-service

# Install dependencies
npm install

# Start in development mode
npm run dev

# Or start in production mode
npm start
```

### Docker Deployment

```bash
# Build and run with Docker
docker-compose up --build

# Run in background
docker-compose up -d --build
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Service port |
| `NODE_ENV` | `development` | Environment mode |
| `LOG_LEVEL` | `info` | Logging level |
| `HOSPITALIZATION_SERVICE_URL` | `http://localhost:8070/hospitalization/api` | Hospitalization service URL |
| `MONITORING_SERVICE_URL` | `http://localhost:8799/api` | Monitoring service URL |

## API Endpoints

### Health Check
```
GET /health
```
Returns service health status.

### Generate Hospitalization Report
```
GET /api/reports/hospitalization/:id
```

Generate a PDF report for a specific hospitalization.

**Parameters:**
- `id` (path): Hospitalization ID
- `format` (query, optional): Report format (`basic` or `advanced`)

**Example:**
```bash
curl -o report.pdf "http://localhost:4000/api/reports/hospitalization/123?format=advanced"
```

### Report Preview
```
GET /api/reports/hospitalization/:id/preview
```

Get preview information for a hospitalization report without generating the PDF.

**Response:**
```json
{
  "hospitalizationId": 123,
  "patientName": "John Doe",
  "admissionDate": "2026-04-01",
  "status": "ACTIVE",
  "roomNumber": "101",
  "duration": 5,
  "preview": true
}
```

### List Reports
```
GET /api/reports/list
```

Get a list of generated reports (for future implementation).

## Report Content

### Basic Format (jsPDF)
- Patient Information
- Hospitalization Details
- Room Information
- Medical Staff Details
- Health Alerts Summary

### Advanced Format (Puppeteer)
- Professional HTML layout
- Styled tables and sections
- Better typography
- Detailed alerts table
- Medical report styling

## Data Integration

The service integrates with multiple NephroCare services:

### Hospitalization Service
- **Endpoint**: `GET /api/hospitalizations/{id}`
- **Data**: Patient info, admission details, room assignment, medical staff

### Monitoring Service
- **Endpoint**: `GET /api/alerts/patient/{patientId}/stats`
- **Data**: Health alerts and monitoring data during hospitalization

## Report Structure

### Patient Information Section
- Patient ID and name
- Age and gender
- Contact information (when available)

### Hospitalization Details
- Admission and discharge dates
- Duration of stay
- Admission reason
- Current status
- Attending physician

### Room Information
- Room number and type
- Capacity and occupancy
- Room description

### Health Alerts Summary
- Total number of alerts
- Critical alerts count
- Recent alerts table (advanced format)

### Medical Timeline
- Key events during hospitalization
- Treatment milestones
- Recovery progress

## Usage Examples

### Frontend Integration

```typescript
// Angular service integration
@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  generateHospitalizationReport(hospitalizationId: number, format: 'basic' | 'advanced' = 'advanced') {
    const params = new HttpParams().set('format', format);
    return this.http.get(`${this.apiUrl}/reports/hospitalization/${hospitalizationId}`, {
      params,
      responseType: 'blob'
    });
  }

  getReportPreview(hospitalizationId: number) {
    return this.http.get(`${this.apiUrl}/reports/hospitalization/${hospitalizationId}/preview`);
  }
}

// Component usage
export class HospitalizationDetailComponent {
  constructor(private reportService: ReportService) {}

  downloadReport() {
    this.reportService.generateHospitalizationReport(this.hospitalizationId)
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hospitalization_report_${this.hospitalizationId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      });
  }
}
```

### Direct API Usage

```bash
# Generate basic report
curl -X GET "http://localhost:4000/api/reports/hospitalization/123?format=basic" \
  -H "accept: application/pdf" \
  --output hospitalization_report.pdf

# Get report preview
curl -X GET "http://localhost:4000/api/reports/hospitalization/123/preview" \
  -H "accept: application/json"
```

## Development

### Running Tests

```bash
npm test
```

### Code Formatting

```bash
# Install Prettier
npm install --save-dev prettier

# Format code
npx prettier --write .
```

### API Documentation

When running, visit `http://localhost:4000/health` for basic API info.

## Deployment

### Production Environment Setup

```bash
# Set production environment variables
export NODE_ENV=production
export HOSPITALIZATION_SERVICE_URL=https://api.nephrocare.com/hospitalization
export MONITORING_SERVICE_URL=https://api.nephrocare.com/monitoring
export LOG_LEVEL=warn
```

### PM2 Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "pdf-generator-service"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Docker Production

```yaml
version: '3.8'
services:
  pdf-generator-service:
    image: nephrocare/pdf-generator-service:latest
    environment:
      - NODE_ENV=production
    ports:
      - "4000:4000"
    restart: always
```

## Security Considerations

- Input validation for hospitalization IDs
- Rate limiting for API endpoints
- Secure file handling for generated PDFs
- CORS configuration for frontend access
- Error handling to prevent information leakage

## Performance Optimization

- PDF caching for frequently requested reports
- Asynchronous PDF generation
- Connection pooling for external API calls
- Memory management for large reports
- Background processing for heavy operations

## Monitoring

The service includes:
- Winston logging with structured output
- Health check endpoints
- Performance metrics
- Error tracking and reporting

## Troubleshooting

### Common Issues

1. **Puppeteer fails in Docker**: Ensure Chromium dependencies are installed
2. **External API timeouts**: Check service URLs and network connectivity
3. **Memory issues**: Monitor PDF generation for large reports
4. **Font rendering**: Ensure proper font support in Docker containers

### Logs

Logs are written to:
- Console (development)
- `logs/pdf-generator-service.log` (production)
- PM2 logs when using process manager

## Future Enhancements

- **Template Engine**: Custom report templates
- **Multi-language Support**: Localized reports
- **Bulk Generation**: Generate multiple reports
- **Email Integration**: Send reports via email
- **Digital Signatures**: Add digital signatures to reports
- **Compression**: Optimize PDF file sizes

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure security best practices

## License

ISC License - See package.json for details.