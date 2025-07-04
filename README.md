# 🏥 EasePharm

An intelligent prescription processing system that uses AI-powered OCR to extract handwritten text and automatically create pharmacy orders.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#-configuration)
- [🎯 Usage](#-usage)
- [📡 API Documentation](#-api-documentation)
- [🗄️ Database Schema](#️-database-schema)
- [🔍 Database Management](#-database-management)
- [🐛 Troubleshooting](#-troubleshooting)
- [🧪 Testing](#-testing)
- [📁 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [🔒 Security Considerations](#-security-considerations)
- [🚀 Deployment](#-deployment)
- [📊 Performance](#-performance)
- [🔄 Updates & Maintenance](#-updates--maintenance)
- [📞 Support](#-support)
- [📈 Roadmap](#-roadmap)

---

## ✨ Features

### 🔍 OCR Intelligence

- Multi-engine support: **OCR.space**, **Azure Vision**, **Tesseract.js**
- Smart fallback to client-side if cloud fails
- Image enhancement for better accuracy
- Optimized for handwritten prescriptions

### 📊 Dashboard & Workflow

- Real-time statistics, searchable orders
- End-to-end prescription status: _Pending → Processing → Ready → Dispensed_

### 💾 Smart Database

- Pre-linked schema for orders, patients, meds
- Auto-generated sample data

### 🔧 Dev Tools

- Built-in database viewer, terminal utilities
- Real-time watchers and debug logging

---

## 🛠 Tech Stack

### Frontend

- **React 18**, **Tailwind CSS**, **Tesseract.js**
- **Lucide Icons**, **React Router**

### Backend

- **Node.js**, **Express.js**, **SQLite3**
- **Multer**, **Axios**, **CORS**

### OCR APIs

- **OCR.space** (25k free req/mo)
- **Azure Vision** (5k free req/mo)
- **Tesseract.js** (client-side)

---

## 📋 Prerequisites

- Node.js (v16+)
- npm
- Git
- SQLite3 _(optional for terminal access)_

### Optional OCR Keys

- [OCR.space API Key](https://ocr.space/ocrapi/register)
- [Azure Vision API Key](https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/)

---

## 🚀 Installation

### 1️⃣ Clone Repo

```bash
git clone https://github.com/yourusername/pharmacy-assistant.git
cd pharmacy-assistant
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with API keys if available
```

### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
echo "REACT_APP_API_URL=http://localhost:5000" > .env
```

---

## ⚙️ Configuration

### `backend/.env`

```env
OCR_SPACE_API_KEY=your_ocr_space_key
AZURE_VISION_KEY=your_azure_key
AZURE_VISION_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
PORT=5000
```

### `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 🎯 Usage

### 💻 Development Mode

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm start
```

### 🌐 Production Mode

```bash
# Start Backend
cd backend
npm start

# Build Frontend
cd frontend
npm run build
```

### Access URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- DB Viewer: http://localhost:5001 (via `db-viewer.js`)

---

## 📡 API Documentation

### 📤 POST `/api/ocr`

Uploads an image for OCR.

```bash
curl -X POST http://localhost:5000/api/ocr -F "image=@prescription.jpg"
```

### 📦 POST `/api/orders`

Creates a new order from extracted text.

```json
{
  "prescriptionText": "Patient: John Doe\nRx: Amoxicillin 500mg",
  "prescriptionId": 123
}
```

### 📘 Other Endpoints

- `GET /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status`
- `GET /api/health`
- `GET /api/dashboard/stats`
- `GET /api/medications/search?q=term`

---

## 🗄️ Database Schema

### `orders`

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  order_id TEXT UNIQUE,
  patient_name TEXT,
  medication_name TEXT,
  dosage TEXT,
  status TEXT DEFAULT 'pending',
  prescription_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `prescriptions`

```sql
CREATE TABLE prescriptions (
  id INTEGER PRIMARY KEY,
  image_path TEXT,
  extracted_text TEXT,
  confidence_score REAL,
  ocr_method TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `patients`

```sql
CREATE TABLE patients (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `medications`

```sql
CREATE TABLE medications (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT,
  form TEXT,
  manufacturer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔍 Database Management

```bash
# View basic stats
sqlite3 pharmacy.db "SELECT COUNT(*) FROM orders;"

# Interactive DB shell
sqlite3 pharmacy.db
.tables
SELECT * FROM orders;
.exit

# Web viewer
node db-viewer.js
open http://localhost:5001

# Watch changes
node db-watcher.js
```

---

## 🐛 Troubleshooting

### OCR Errors

```bash
curl -X POST http://localhost:5000/api/ocr -F "image=@sample.jpg"
```

### Port already in use?

```bash
lsof -i :5000
kill -9 <PID>
```

### Reset DB

```bash
rm pharmacy.db
npm start
```

---

## 🧪 Testing

```bash
# Test backend OCR
curl -X POST http://localhost:5000/api/ocr -F "image=@test.jpg"

# DB sanity test
node quick-db-check.js

# Frontend connection
Visit http://localhost:3000/upload
```

---

## 📁 Project Structure

```txt
pharmacy-assistant/
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── uploads/
│   ├── pharmacy.db
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   └── .env
└── README.md
```

---

## 🤝 Contributing

```bash
git checkout -b feature/my-feature
git commit -m "Add something cool"
git push origin feature/my-feature
```

- Follow code style
- Add comments
- Update docs

---

## 🔒 Security Considerations

- Max 10MB upload limit
- SQL injection protected via parameterized queries
- CORS configuration
- API keys in `.env`
- Server-side validation

---

## 🚀 Deployment

### Backend

```bash
npm install --production
pm2 start server.js --name pharmacy-backend
# OR
docker build -t pharmacy-backend .
docker run -p 5000:5000 pharmacy-backend
```

### Frontend

```bash
npm run build
# Deploy /frontend/build to Vercel, Netlify, etc.
```

---

## 📊 Performance

- OCR: ~2–10 seconds
- DB query: <100ms
- Upload: up to 10MB
- 50+ users tested concurrently

---

## 🔄 Updates & Maintenance

```bash
# Update dependencies
npm update

# Backup DB
cp backend/pharmacy.db backup/pharmacy-$(date +%F).db
```

---

## 📞 Support

- Issues: [GitHub Issues](https://github.com/shreya12ojha/EasePharm/issues)
- Email: ojhashreya2006@gmail.com

---

## 📈 Roadmap

### v1.1 (Coming Soon)

- Patient management
- Inventory tracking
- Email notifications

### v1.2+

- Mobile app
- Barcode scanning
- Pharmacy system integrations

---

**Made with ❤️ for pharmacists and healthcare professionals**  
_Last updated: July 2025_
