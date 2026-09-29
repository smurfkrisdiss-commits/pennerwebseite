const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const stockFile = path.join(__dirname, 'stock.json');

// Route for /admin without .html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Default stock if file doesn't exist
let stockData = {
  "vape": { name: "Premium Vape", stock: 15, restockDate: "" },
  "liquid": { name: "THC Liquid", stock: 8, restockDate: "" },
  "bangking-sw": { name: "Bang King (Strawberry Watermelon)", stock: 10, restockDate: "" },
  "bangking-sb": { name: "Bang King (Strawberry Banana)", stock: 10, restockDate: "" },
  "bangking-ll": { name: "Bang King (Lemon Lime)", stock: 10, restockDate: "" },
  "edibles": { name: "Delta 9 Gummy Cherri", stock: 5, restockDate: "" }
};

// Load from file if exists
if (fs.existsSync(stockFile)) {
  try {
    const rawData = fs.readFileSync(stockFile, 'utf8').trim();
    if (rawData) {
      stockData = JSON.parse(rawData);
      // Migration for old bangking
      if (stockData['bangking']) {
        stockData['bangking-sw'] = { name: "Bang King (Strawberry Watermelon)", stock: stockData['bangking'].stock, restockDate: stockData['bangking'].restockDate };
        stockData['bangking-sb'] = { name: "Bang King (Strawberry Banana)", stock: stockData['bangking'].stock, restockDate: stockData['bangking'].restockDate };
        stockData['bangking-ll'] = { name: "Bang King (Lemon Lime)", stock: stockData['bangking'].stock, restockDate: stockData['bangking'].restockDate };
        delete stockData['bangking'];
        fs.writeFileSync(stockFile, JSON.stringify(stockData, null, 2));
      }
    }
  } catch (err) {
    console.error("Error reading stock.json", err.message);
    // Overwrite corrupted file with defaults
    fs.writeFileSync(stockFile, JSON.stringify(stockData, null, 2));
  }
} else {
  // Create if it doesn't exist
  fs.writeFileSync(stockFile, JSON.stringify(stockData, null, 2));
}

app.get('/api/stock', (req, res) => {
  res.json(stockData);
});

app.post('/api/stock', (req, res) => {
  const { password, newStock } = req.body;
  if (password !== '1200') {
    return res.status(401).json({ error: 'Falsches Passwort!' });
  }
  
  stockData = newStock;
  fs.writeFileSync(stockFile, JSON.stringify(stockData, null, 2));
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});