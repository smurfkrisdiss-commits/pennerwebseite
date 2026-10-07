const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Increase JSON limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

const stockFile = path.join(__dirname, 'stock.json');
const reviewsFile = path.join(__dirname, 'reviews.json');

// Route for /admin without .html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- STOCK LOGIC ---
let stockData = {
  "vape": { name: "Premium Vape", stock: 15, restockDate: "" },
  "liquid": { name: "THC Liquid", stock: 8, restockDate: "" },
  "bangking-sw": { name: "Bang King (Strawberry Watermelon)", stock: 10, restockDate: "" },
  "bangking-sb": { name: "Bang King (Strawberry Banana)", stock: 10, restockDate: "" },
  "bangking-ll": { name: "Bang King (Lemon Lime)", stock: 10, restockDate: "" },
  "edibles": { name: "Delta 9 Gummy Cherri", stock: 5, restockDate: "" },
  "joint-bear": { name: "Joint Big Bad Bear 2g", stock: 10, restockDate: "" },
  "joint-horchata": { name: "Joint Horchata 2g", stock: 10, restockDate: "" }
};

if (fs.existsSync(stockFile)) {
  try {
    const rawData = fs.readFileSync(stockFile, 'utf8').trim();
    if (rawData) { stockData = JSON.parse(rawData); }
  } catch (err) {
    fs.writeFileSync(stockFile, JSON.stringify(stockData, null, 2));
  }
} else {
  fs.writeFileSync(stockFile, JSON.stringify(stockData, null, 2));
}

app.get('/api/stock', (req, res) => res.json(stockData));

app.post('/api/stock', (req, res) => {
  const { password, newStock } = req.body;
  if (password !== '1200') return res.status(401).json({ error: 'Falsches Passwort!' });
  stockData = newStock;
  fs.writeFileSync(stockFile, JSON.stringify(stockData, null, 2));
  res.json({ success: true });
});

// --- REVIEWS LOGIC ---
let reviewsData = [];
if (fs.existsSync(reviewsFile)) {
  try { reviewsData = JSON.parse(fs.readFileSync(reviewsFile, 'utf8')); } catch (err) { }
} else {
  fs.writeFileSync(reviewsFile, JSON.stringify(reviewsData, null, 2));
}

app.get('/api/reviews', (req, res) => res.json(reviewsData));

app.post('/api/reviews', (req, res) => {
  const { password, imageBase64 } = req.body;
  if (password !== '1200') return res.status(401).json({ error: 'Falsches Passwort!' });
  
  if (!imageBase64) return res.status(400).json({ error: 'Kein Bild vorhanden' });

  const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return res.status(400).json({ error: 'Ungültiges Bildformat' });
  
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = 'review_' + Date.now() + '.' + ext;
  
  const reviewsDir = path.join(__dirname, 'assets', 'reviews');
  if (!fs.existsSync(reviewsDir)) fs.mkdirSync(reviewsDir, { recursive: true });
  
  const filepath = path.join(reviewsDir, filename);
  fs.writeFileSync(filepath, buffer);
  
  const newReview = { id: Date.now().toString(), path: 'assets/reviews/' + filename };
  reviewsData.unshift(newReview); // Add to beginning
  fs.writeFileSync(reviewsFile, JSON.stringify(reviewsData, null, 2));
  
  res.json({ success: true, review: newReview });
});

app.post('/api/reviews/delete', (req, res) => {
  const { password, id } = req.body;
  if (password !== '1200') return res.status(401).json({ error: 'Falsches Passwort!' });
  
  const idx = reviewsData.findIndex(r => r.id === id);
  if (idx !== -1) {
    const rPath = path.join(__dirname, reviewsData[idx].path);
    if (fs.existsSync(rPath)) fs.unlinkSync(rPath);
    reviewsData.splice(idx, 1);
    fs.writeFileSync(reviewsFile, JSON.stringify(reviewsData, null, 2));
  }
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});