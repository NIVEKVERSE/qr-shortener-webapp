# QR Code Creator & URL Shortener Webapp

A modern, full-stack web application for creating QR codes and shortening URLs with a beautiful, responsive interface.

## Features

✨ **QR Code Generator**
- Generate QR codes from any URL or text
- Customize size and error correction levels
- Download QR codes as PNG/SVG
- Copy to clipboard functionality

🔗 **URL Shortener**
- Create short, shareable URLs
- Custom short codes (optional)
- Analytics tracking (clicks, creation date)
- QR code integration for shortened URLs
- Copy short link to clipboard

📊 **Dashboard**
- View all created links and QR codes
- Track analytics and click counts
- Delete/manage entries
- Export data

🎨 **User Experience**
- Responsive design (mobile, tablet, desktop)
- Dark/Light mode toggle
- Real-time validation
- Copy-to-clipboard feedback
- Progressive Web App (PWA) support

## Tech Stack

**Backend:**
- Node.js + Express.js
- SQLite database
- QRCode.js library

**Frontend:**
- HTML5/CSS3/JavaScript
- Fetch API
- Responsive Grid/Flexbox

## Installation

```bash
# Clone the repository
git clone https://github.com/NIVEKVERSE/qr-shortener-webapp.git
cd qr-shortener-webapp

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start the server
npm start
```

Visit `http://localhost:3000` in your browser.

## API Endpoints

### QR Code Generation
```
POST /api/qr/generate
Content-Type: application/json

{
  "data": "https://example.com",
  "size": 10,
  "errorCorrectionLevel": "M"
}

Response:
{
  "success": true,
  "qrCode": "data:image/png;base64,...",
  "id": "uuid"
}
```

### Create Short URL
```
POST /api/shorten
Content-Type: application/json

{
  "originalUrl": "https://example.com/very/long/url",
  "customCode": "mycode" (optional)
}

Response:
{
  "success": true,
  "shortUrl": "http://localhost:3000/s/mycode",
  "code": "mycode",
  "originalUrl": "https://example.com/very/long/url",
  "qrCode": "data:image/png;base64,...",
  "clicks": 0
}
```

### Get Short URL Info
```
GET /api/info/:code

Response:
{
  "success": true,
  "shortUrl": "http://localhost:3000/s/mycode",
  "originalUrl": "https://example.com",
  "clicks": 42,
  "created": "2024-01-15T10:30:00Z",
  "qrCode": "data:image/png;base64,..."
}
```

### Redirect Short URL
```
GET /s/:code
Response: Redirect to original URL (increments click counter)
```

## Environment Variables

```bash
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
DB_PATH=./db.sqlite
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
