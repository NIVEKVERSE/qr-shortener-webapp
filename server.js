const express = require('express');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const db = require('./src/database');
const { validateUrl, generateShortCode } = require('./src/utils');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || 100),
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// Initialize database
db.initialize().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// ==================== QR CODE ENDPOINTS ====================

/**
 * POST /api/qr/generate
 * Generate a QR code from text/URL
 */
app.post('/api/qr/generate', async (req, res) => {
  try {
    const { data, size = 10, errorCorrectionLevel = 'M' } = req.body;

    if (!data || typeof data !== 'string' || data.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data provided'
      });
    }

    const qrCode = await QRCode.toDataURL(data, {
      errorCorrectionLevel,
      width: size * 50,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const id = uuidv4();
    await db.saveQRCode(id, data, size);

    res.json({
      success: true,
      qrCode,
      id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

/**
 * GET /api/qr/history
 * Get QR code generation history
 */
app.get('/api/qr/history', async (req, res) => {
  try {
    const history = await db.getQRCodeHistory();
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve history'
    });
  }
});

// ==================== URL SHORTENER ENDPOINTS ====================

/**
 * POST /api/shorten
 * Create a shortened URL
 */
app.post('/api/shorten', async (req, res) => {
  try {
    let { originalUrl, customCode } = req.body;

    // Validate original URL
    if (!validateUrl(originalUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL provided'
      });
    }

    // Ensure URL has protocol
    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
      originalUrl = 'https://' + originalUrl;
    }

    // Generate or validate custom code
    let shortCode = customCode || generateShortCode();

    // Check if code already exists
    if (await db.codeExists(shortCode)) {
      return res.status(409).json({
        success: false,
        error: 'Short code already exists. Try a different one.'
      });
    }

    // Create the shortened URL
    await db.saveShortenedUrl(shortCode, originalUrl);

    // Generate QR code for shortened URL
    const shortUrl = `${BASE_URL}/s/${shortCode}`;
    const qrCode = await QRCode.toDataURL(shortUrl, {
      errorCorrectionLevel: 'M',
      width: 500,
      margin: 2
    });

    res.json({
      success: true,
      shortUrl,
      code: shortCode,
      originalUrl,
      qrCode,
      clicks: 0,
      created: new Date().toISOString()
    });
  } catch (error) {
    console.error('URL shortening error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to shorten URL'
    });
  }
});

/**
 * GET /api/info/:code
 * Get information about a shortened URL
 */
app.get('/api/info/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const urlData = await db.getUrlData(code);

    if (!urlData) {
      return res.status(404).json({
        success: false,
        error: 'Short code not found'
      });
    }

    // Generate QR code
    const shortUrl = `${BASE_URL}/s/${code}`;
    const qrCode = await QRCode.toDataURL(shortUrl);

    res.json({
      success: true,
      shortUrl,
      originalUrl: urlData.originalUrl,
      clicks: urlData.clicks,
      created: urlData.created,
      qrCode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve URL information'
    });
  }
});

/**
 * GET /api/list
 * List all shortened URLs
 */
app.get('/api/list', async (req, res) => {
  try {
    const urls = await db.getAllUrls();
    res.json({
      success: true,
      data: urls.map(url => ({
        code: url.code,
        originalUrl: url.originalUrl,
        shortUrl: `${BASE_URL}/s/${url.code}`,
        clicks: url.clicks,
        created: url.created
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve URLs'
    });
  }
});

/**
 * DELETE /api/delete/:code
 * Delete a shortened URL
 */
app.delete('/api/delete/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const success = await db.deleteShortenedUrl(code);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Short code not found'
      });
    }

    res.json({
      success: true,
      message: 'Short URL deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete URL'
    });
  }
});

// ==================== REDIRECT ENDPOINT ====================

/**
 * GET /s/:code
 * Redirect to original URL
 */
app.get('/s/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const urlData = await db.getUrlData(code);

    if (!urlData) {
      return res.status(404).send('Short code not found');
    }

    // Increment click counter
    await db.incrementClicks(code);

    // Redirect to original URL
    res.redirect(urlData.originalUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).send('Internal server error');
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'Server is running' });
});

// ==================== 404 HANDLER ====================

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found'
    });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== SERVER START ====================

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at ${BASE_URL}`);
  console.log(`📊 API available at ${BASE_URL}/api`);
  console.log(`🌍 Node environment: ${process.env.NODE_ENV}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await db.closeConnection();
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
