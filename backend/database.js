const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create database connection
const dbPath = path.join(__dirname, "pharmacy.db");
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create patients table
      db.run(`
        CREATE TABLE IF NOT EXISTS patients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          phone TEXT,
          date_of_birth DATE,
          address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create medications table
      db.run(`
        CREATE TABLE IF NOT EXISTS medications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          generic_name TEXT,
          dosage TEXT,
          form TEXT,
          manufacturer TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create prescriptions table
      db.run(`
        CREATE TABLE IF NOT EXISTS prescriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          image_path TEXT,
          extracted_text TEXT NOT NULL,
          confidence_score REAL,
          ocr_method TEXT,
          processed BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create orders table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT UNIQUE NOT NULL,
          patient_id INTEGER,
          medication_id INTEGER,
          prescription_id INTEGER,
          patient_name TEXT NOT NULL,
          medication_name TEXT NOT NULL,
          dosage TEXT,
          quantity INTEGER,
          instructions TEXT,
          status TEXT DEFAULT 'pending',
          prescribed_by TEXT,
          prescription_text TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients (id),
          FOREIGN KEY (medication_id) REFERENCES medications (id),
          FOREIGN KEY (prescription_id) REFERENCES prescriptions (id)
        )
      `,
        (err) => {
          if (err) {
            console.error("❌ Database initialization error:", err);
            reject(err);
          } else {
            console.log("✅ Database initialized successfully");
            insertSampleData();
            resolve();
          }
        }
      );
    });
  });
};

// Insert sample data
const insertSampleData = () => {
  // Sample patients
  const patients = [
    [
      "John Doe",
      "john.doe@email.com",
      "+1234567890",
      "1985-06-15",
      "123 Main St, City",
    ],
    [
      "Jane Smith",
      "jane.smith@email.com",
      "+1234567891",
      "1990-03-22",
      "456 Oak Ave, City",
    ],
    [
      "Bob Johnson",
      "bob.johnson@email.com",
      "+1234567892",
      "1978-11-08",
      "789 Pine Rd, City",
    ],
  ];

  const insertPatient = db.prepare(`
    INSERT OR IGNORE INTO patients (name, email, phone, date_of_birth, address) 
    VALUES (?, ?, ?, ?, ?)
  `);

  patients.forEach((patient) => {
    insertPatient.run(patient);
  });
  insertPatient.finalize();

  // Sample medications
  const medications = [
    ["Amoxicillin", "Amoxicillin", "500mg", "Capsule", "Generic Pharma"],
    ["Lisinopril", "Lisinopril", "10mg", "Tablet", "Heart Meds Inc"],
    ["Metformin", "Metformin HCl", "850mg", "Tablet", "Diabetes Care"],
    ["Ibuprofen", "Ibuprofen", "200mg", "Tablet", "Pain Relief Co"],
    ["Omeprazole", "Omeprazole", "20mg", "Capsule", "Gastro Meds"],
  ];

  const insertMedication = db.prepare(`
    INSERT OR IGNORE INTO medications (name, generic_name, dosage, form, manufacturer) 
    VALUES (?, ?, ?, ?, ?)
  `);

  medications.forEach((medication) => {
    insertMedication.run(medication);
  });
  insertMedication.finalize();

  console.log("📊 Sample data inserted");
};

// Database operations
const dbOperations = {
  // Create new prescription record
  createPrescription: (prescriptionData) => {
    return new Promise((resolve, reject) => {
      const { extractedText, confidenceScore, ocrMethod, imagePath } =
        prescriptionData;

      const stmt = db.prepare(`
        INSERT INTO prescriptions (extracted_text, confidence_score, ocr_method, image_path)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(
        [extractedText, confidenceScore, ocrMethod, imagePath],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, prescriptionId: this.lastID });
          }
        }
      );
      stmt.finalize();
    });
  },

  // Create new order
  createOrder: (orderData) => {
    return new Promise((resolve, reject) => {
      const {
        orderId,
        patientName,
        medicationName,
        dosage,
        quantity,
        instructions,
        prescribedBy,
        prescriptionText,
        prescriptionId,
      } = orderData;

      const stmt = db.prepare(`
        INSERT INTO orders (
          order_id, patient_name, medication_name, dosage, quantity, 
          instructions, prescribed_by, prescription_text, prescription_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `);

      stmt.run(
        [
          orderId,
          patientName,
          medicationName,
          dosage,
          quantity,
          instructions,
          prescribedBy,
          prescriptionText,
          prescriptionId,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              orderId,
              patientName,
              medicationName,
              status: "pending",
            });
          }
        }
      );
      stmt.finalize();
    });
  },

  // Get all orders
  getAllOrders: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          o.*,
          p.confidence_score,
          p.ocr_method
        FROM orders o
        LEFT JOIN prescriptions p ON o.prescription_id = p.id
        ORDER BY o.created_at DESC
      `,
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  },

  // Get order by ID
  getOrderById: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get(
        `
        SELECT 
          o.*,
          p.confidence_score,
          p.ocr_method,
          p.image_path
        FROM orders o
        LEFT JOIN prescriptions p ON o.prescription_id = p.id
        WHERE o.order_id = ?
      `,
        [orderId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  },

  // Update order status
  updateOrderStatus: (orderId, status) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE order_id = ?
      `);

      stmt.run([status, orderId], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
      stmt.finalize();
    });
  },

  // Get dashboard statistics
  getDashboardStats: () => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const stats = {};

        // Total orders
        db.get("SELECT COUNT(*) as total FROM orders", (err, row) => {
          if (err) return reject(err);
          stats.totalOrders = row.total;
        });

        // Pending orders
        db.get(
          "SELECT COUNT(*) as pending FROM orders WHERE status = 'pending'",
          (err, row) => {
            if (err) return reject(err);
            stats.pendingOrders = row.pending;
          }
        );

        // Completed orders
        db.get(
          "SELECT COUNT(*) as completed FROM orders WHERE status = 'completed'",
          (err, row) => {
            if (err) return reject(err);
            stats.completedOrders = row.completed;
          }
        );

        // Today's orders
        db.get(
          `
          SELECT COUNT(*) as today 
          FROM orders 
          WHERE DATE(created_at) = DATE('now')
        `,
          (err, row) => {
            if (err) return reject(err);
            stats.todayOrders = row.today;
            resolve(stats);
          }
        );
      });
    });
  },

  // Search medications
  searchMedications: (searchTerm) => {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT * FROM medications 
        WHERE name LIKE ? OR generic_name LIKE ?
        LIMIT 10
      `,
        [`%${searchTerm}%`, `%${searchTerm}%`],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  },
};

// Close database connection
const closeDatabase = () => {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error("❌ Error closing database:", err);
      } else {
        console.log("✅ Database connection closed");
      }
      resolve();
    });
  });
};

module.exports = {
  initDatabase,
  dbOperations,
  closeDatabase,
};
