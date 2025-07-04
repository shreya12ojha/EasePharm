# 🏥EasePharm

An intelligent prescription processing system that uses AI-powered OCR to extract text from handwritten prescriptions and automatically create pharmacy orders.

![Pharmacy Assistant](https://img.shields.io/badge/Status-Active-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔍 **Smart OCR Processing**

- **Multiple OCR Engines**: OCR.space API, Azure Computer Vision, Tesseract.js
- **Automatic Fallback**: If cloud APIs fail, falls back to client-side processing
- **Image Enhancement**: Automatic contrast and clarity improvements
- **Handwriting Recognition**: Optimized for medical handwriting

### 📊 **Comprehensive Dashboard**

- **Real-time Statistics**: Track orders, prescriptions, and processing status
- **Order Management**: View, update, and track prescription orders
- **Status Tracking**: Pending → Processing → Ready → Dispensed workflow
- **Search & Filter**: Find orders by patient, medication, or status

### 💾 **Robust Database**

- **SQLite Database**: Lightweight, serverless database
- **Complete Schema**: Patients, medications, prescriptions, and orders
- **Data Relationships**: Linked records for comprehensive tracking
- **Sample Data**: Pre-populated with common medications and test patients

### 🔧 **Developer Tools**

- **Database Viewer**: Web-based and terminal database inspection
- **Debug Mode**: Comprehensive logging and error tracking
- **Connection Testing**: Built-in diagnostics for troubleshooting
- **Real-time Monitoring**: Watch database changes as they happen

## 🛠 Tech Stack

### **Frontend**

- **React 18** - Modern UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Tesseract.js** - Client-side OCR processing
- **Lucide React** - Beautiful icons

### **Backend**

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **SQLite3** - Embedded database
- **Multer** - File upload handling
- **Axios** - HTTP client for API calls
- **CORS** - Cross-origin resource sharing

### **OCR Services**

- **OCR.space API** - Cloud OCR service (25,000 free requests/month)
- **Azure Computer Vision** - Microsoft's OCR API (5,000 free requests/month)
- **Tesseract.js** - Open-source OCR library (unlimited, client-side)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **SQLite3** (optional, for terminal database access) - [Download here](https://sqlite.org/download.html)

### **Optional API Keys** (for enhanced OCR):

- **OCR.space API Key** - [Get free key](https://ocr.space/ocrapi/register)
- **Azure Computer Vision** - [Get free key](https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/)

## 🚀 Installation

### **1. Clone the Repository**

\`\`\`bash
git clone https://github.com/yourusername/pharmacy-assistant.git
cd pharmacy-assistant
\`\`\`

### **2. Backend Setup**

\`\`\`bash

# Navigate to backend directory

cd backend

# Install dependencies

npm install

# Create environment file

cp .env.example .env

# Edit .env file with your API keys (optional)

nano .env
\`\`\`

### **3. Frontend Setup**

\`\`\`bash

# Navigate to frontend directory (from project root)

cd frontend

# Install dependencies

npm install

# Create environment file

echo "REACT_APP_API_URL=http://localhost:5000" > .env
\`\`\`

### **4. Database Initialization**

The database will be automatically created when you first start the backend server.

## ⚙️ Configuration

### **Backend Configuration** (`backend/.env`)

\`\`\`env

# OCR.space API (Optional - 25,000 free requests/month)

OCR_SPACE_API_KEY=your_ocr_space_api_key_here

# Azure Computer Vision (Optional - 5,000 free requests/month)

AZURE_VISION_KEY=your_azure_vision_key_here
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/

# Server Configuration

PORT=5000
NODE_ENV=development
\`\`\`

### **Frontend Configuration** (`frontend/.env`)

\`\`\`env

# Backend API URL

REACT_APP_API_URL=http://localhost:5000
\`\`\`

## 🎯 Usage

### **Starting the Application**

#### **Option 1: Development Mode**

\`\`\`bash

# Terminal 1: Start Backend

cd backend
npm run dev

# Terminal 2: Start Frontend

cd frontend
npm start
\`\`\`

#### **Option 2: Production Mode**

\`\`\`bash

# Start Backend

cd backend
npm start

# Build and serve Frontend

cd frontend
npm run build

# Serve the build folder with your preferred web server

\`\`\`

### **Accessing the Application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database Viewer**: http://localhost:5001 (when running db-viewer.js)

### **Basic Workflow**

1. **📤 Upload Prescription**

   - Navigate to `/upload`
   - Select a clear image of a handwritten prescription
   - Click "Extract Text" to process with OCR
   - Review and edit the extracted text

2. **📝 Create Order**

   - After text extraction, click "Create Order"
   - System automatically parses patient name, medication, and dosage
   - Order is saved to database with unique ID

3. **📊 View Dashboard**
   - Navigate to `/dashboard`
   - View statistics and recent orders
   - Update order status (Pending → Processing → Ready → Dispensed)
   - Search and filter orders

## 📡 API Documentation

### **OCR Endpoints**

#### **POST /api/ocr**

Upload and process prescription image.

**Request:**
\`\`\`bash
curl -X POST \
 http://localhost:5000/api/ocr \
 -F "image=@prescription.jpg"
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"text": "Patient: John Doe\nRx: Amoxicillin 500mg\nTake 3 times daily",
"method": "OCR.space API",
"confidence": 0.95,
"prescriptionId": 123
}
\`\`\`

### **Order Endpoints**

#### **POST /api/orders**

Create a new order from prescription text.

**Request:**
\`\`\`json
{
"prescriptionText": "Patient: John Doe\nRx: Amoxicillin 500mg\nTake 3 times daily",
"prescriptionId": 123
}
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"orderId": "ORD-123456",
"patientName": "John Doe",
"medicationName": "Amoxicillin 500mg",
"dosage": "Take 3 times daily"
}
\`\`\`

#### **GET /api/orders**

Retrieve all orders.

#### **GET /api/orders/:orderId**

Retrieve specific order.

#### **PUT /api/orders/:orderId/status**

Update order status.

### **Utility Endpoints**

#### **GET /api/health**

Check API health and configuration.

#### **GET /api/dashboard/stats**

Get dashboard statistics.

#### **GET /api/medications/search?q=term**

Search medications database.

## 🗄️ Database Schema

### **Orders Table**

\`\`\`sql
CREATE TABLE orders (
id INTEGER PRIMARY KEY AUTOINCREMENT,
order_id TEXT UNIQUE NOT NULL,
patient_name TEXT NOT NULL,
medication_name TEXT NOT NULL,
dosage TEXT,
quantity INTEGER,
instructions TEXT,
status TEXT DEFAULT 'pending',
prescribed_by TEXT,
prescription_text TEXT,
prescription_id INTEGER,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### **Prescriptions Table**

\`\`\`sql
CREATE TABLE prescriptions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
image_path TEXT,
extracted_text TEXT NOT NULL,
confidence_score REAL,
ocr_method TEXT,
processed BOOLEAN DEFAULT FALSE,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### **Patients Table**

\`\`\`sql
CREATE TABLE patients (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
email TEXT UNIQUE,
phone TEXT,
date_of_birth DATE,
address TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### **Medications Table**

\`\`\`sql
CREATE TABLE medications (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
generic_name TEXT,
dosage TEXT,
form TEXT,
manufacturer TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## 🔍 Database Management

### **View Database in Terminal**

\`\`\`bash

# Quick stats

cd backend
sqlite3 pharmacy.db "SELECT COUNT(\*) FROM orders;"

# Interactive mode

sqlite3 pharmacy.db
.tables
SELECT \* FROM orders;
.exit

# Use built-in viewer

node terminal-viewer.js
\`\`\`

### **Web Database Viewer**

\`\`\`bash
cd backend
node db-viewer.js

# Open http://localhost:5001

\`\`\`

### **Watch Database Changes**

\`\`\`bash
cd backend
node db-watcher.js
\`\`\`

## 🐛 Troubleshooting

### **Common Issues**

#### **"Failed to fetch" Error**

\`\`\`bash

# Check if backend is running

curl http://localhost:5000/api/health

# Check CORS configuration

# Ensure frontend URL is in CORS origins list

\`\`\`

#### **OCR Not Working**

\`\`\`bash

# Test OCR endpoint

curl -X POST http://localhost:5000/api/ocr \
 -F "image=@test-image.jpg"

# Check API keys in .env file

# Verify image format (JPG, PNG supported)

\`\`\`

#### **Database Issues**

\`\`\`bash

# Check if database exists

ls -la backend/pharmacy.db

# Reset database

cd backend
rm pharmacy.db
npm start # Will recreate database
\`\`\`

#### **Port Already in Use**

\`\`\`bash

# Find process using port 5000

lsof -i :5000

# Kill process

kill -9 <PID>

# Or change port in .env

PORT=5001
\`\`\`

### **Debug Mode**

Enable debug logging by setting:
\`\`\`env
NODE_ENV=development
\`\`\`

### **Connection Testing**

Use the built-in connection tester in the frontend upload page.

## 🧪 Testing

### **Test OCR Functionality**

\`\`\`bash

# Test with sample image

cd backend
curl -X POST http://localhost:5000/api/ocr \
 -F "image=@sample-prescription.jpg"
\`\`\`

### **Test Database Operations**

\`\`\`bash
cd backend
node quick-db-check.js
\`\`\`

### **Test Frontend Connection**

Visit http://localhost:3000/upload and use the "Connection Test" feature.

## 📁 Project Structure

\`\`\`
pharmacy-assistant/
├── backend/
│ ├── server.js # Main server file
│ ├── database.js # Database operations
│ ├── uploads/ # Uploaded images
│ ├── pharmacy.db # SQLite database
│ ├── package.json # Backend dependencies
│ └── .env # Environment variables
├── frontend/
│ ├── src/
│ │ ├── pages/ # React pages
│ │ ├── components/ # React components
│ │ ├── hooks/ # Custom hooks
│ │ └── App.js # Main app component
│ ├── public/ # Static files
│ ├── package.json # Frontend dependencies
│ └── .env # Frontend environment
└── README.md # This file
\`\`\`

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   \`\`\`bash
   git checkout -b feature/amazing-feature
   \`\`\`
3. **Commit your changes**
   \`\`\`bash
   git commit -m 'Add amazing feature'
   \`\`\`
4. **Push to the branch**
   \`\`\`bash
   git push origin feature/amazing-feature
   \`\`\`
5. **Open a Pull Request**

### **Development Guidelines**

- Follow existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 🔒 Security Considerations

- **File Upload**: Limited to 10MB images only
- **SQL Injection**: Using parameterized queries
- **CORS**: Configured for specific origins
- **API Keys**: Stored in environment variables
- **Input Validation**: Server-side validation for all inputs

## 🚀 Deployment

### **Backend Deployment**

\`\`\`bash

# Build for production

npm install --production

# Start with PM2 (recommended)

npm install -g pm2
pm2 start server.js --name pharmacy-backend

# Or use Docker

docker build -t pharmacy-backend .
docker run -p 5000:5000 pharmacy-backend
\`\`\`

### **Frontend Deployment**

\`\`\`bash

# Build for production

npm run build

# Serve with nginx, Apache, or any static file server

# Or deploy to Vercel, Netlify, etc.

\`\`\`

## 📊 Performance

- **OCR Processing**: 2-10 seconds depending on image size and method
- **Database Operations**: < 100ms for typical queries
- **File Upload**: Supports up to 10MB images
- **Concurrent Users**: Tested with 50+ simultaneous users

## 🔄 Updates & Maintenance

### **Update Dependencies**

\`\`\`bash

# Backend

cd backend
npm update

# Frontend

cd frontend
npm update
\`\`\`

### **Database Backup**

\`\`\`bash

# Backup database

cp backend/pharmacy.db backup/pharmacy-$(date +%Y%m%d).db

# Restore database

cp backup/pharmacy-20231201.db backend/pharmacy.db
\`\`\`

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/pharmacy-assistant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/pharmacy-assistant/discussions)
- **Email**: ojhashreya2006@gmail.com

## 📈 Roadmap

### **Version 1.1** (Coming Soon)

- [ ] Patient management system
- [ ] Medication inventory tracking
- [ ] Email notifications
- [ ] Advanced search filters

### **Version 1.2** (Future)

- [ ] Mobile app (React Native)
- [ ] Barcode scanning
- [ ] Integration with pharmacy systems
- [ ] Multi-language support

### **Version 2.0** (Long-term)

- [ ] AI-powered medication recommendations
- [ ] Insurance verification
- [ ] Prescription validation
- [ ] Analytics dashboard

---

**Made with ❤️ for pharmacists and healthcare professionals**

_Last updated: July 2025_
