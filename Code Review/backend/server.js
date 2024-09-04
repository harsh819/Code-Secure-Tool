const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Use middleware
app.use(cors()); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory store for scan results
let scanResults = {
  critical: 0,
  high: 0,
  medium: 0,
  low: 0
};

// Function to scan code and classify issues
const scanCode = (code) => {
  // Reset results
  let results = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  // Example scanning logic (simple pattern matching)
  const lines = code.split('\n');
  lines.forEach(line => {
    if (/TODO/.test(line)) {
      results.critical += 1;
    } else if (/FIXME/.test(line)) {
      results.high += 1;
    } else if (/REVIEW/.test(line)) {
      results.medium += 1;
    } else if (/NOTE/.test(line)) {
      results.low += 1;
    }
  });

  return results;
};

// Endpoint to scan code and return results
app.post('/api/scan', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    // Read the uploaded file
    const filePath = path.join(__dirname, file.path);
    const code = fs.readFileSync(filePath, 'utf8');

    // Scan the code and get results
    scanResults = scanCode(code);

    // Remove the uploaded file
    fs.unlinkSync(filePath);

    res.json(scanResults);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'An error occurred during file processing.' });
  }
});

// Endpoint to get scan metrics
app.get('/api/metrics', (req, res) => {
  res.json(scanResults);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});