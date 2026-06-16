// ==================== CONSTANTS ====================
const API_BASE = '/api';
const currentTab = { value: 'qr-tab' };

// ==================== DOM ELEMENTS ====================
const elements = {
  // QR Code
  qrInput: document.getElementById('qrInput'),
  qrSize: document.getElementById('qrSize'),
  qrSizeValue: document.getElementById('qrSizeValue'),
  qrErrorLevel: document.getElementById('qrErrorLevel'),
  generateQrBtn: document.getElementById('generateQrBtn'),
  qrResult: document.getElementById('qrResult'),
  qrImage: document.getElementById('qrImage'),
  downloadQrBtn: document.getElementById('downloadQrBtn'),
  copyQrBtn: document.getElementById('copyQrBtn'),

  // URL Shortener
  urlInput: document.getElementById('urlInput'),
  customCode: document.getElementById('customCode'),
  shortenBtn: document.getElementById('shortenBtn'),
  shortenerResult: document.getElementById('shortenerResult'),
  originalUrlDisplay: document.getElementById('originalUrlDisplay'),
  shortUrlDisplay: document.getElementById('shortUrlDisplay'),
  shortUrlQr: document.getElementById('shortUrlQr'),
  copyUrlBtn: document.getElementById('copyUrlBtn'),
  downloadShortQrBtn: document.getElementById('downloadShortQrBtn'),

  // Dashboard
  dashboardContent: document.getElementById('dashboardContent'),
  refreshDashboardBtn: document.getElementById('refreshDashboardBtn'),

  // General
  toast: document.getElementById('toast'),
  loadingSpinner: document.getElementById('loadingSpinner'),
  themeToggle: document.getElementById('themeToggle'),
};

// ==================== UTILITY FUNCTIONS ====================

const showToast = (message, type = 'success', duration = 3000) => {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.loadingSpinner.classList.add('hidden');
  
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, duration);
};

const showLoading = () => {
  elements.loadingSpinner.classList.remove('hidden');
};

const hideLoading = () => {
  elements.loadingSpinner.classList.add('hidden');
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    showToast('Failed to copy to clipboard', 'error');
    return false;
  }
};

const downloadImage = (imageSrc, filename) => {
  const link = document.createElement('a');
  link.href = imageSrc;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const toggleTheme = () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  elements.themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
};

const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
    elements.themeToggle.textContent = '☀️';
  }
};

// ==================== QR CODE FUNCTIONS ====================

const generateQRCode = async () => {
  const data = elements.qrInput.value.trim();
  const size = elements.qrSize.value;
  const errorCorrectionLevel = elements.qrErrorLevel.value;

  if (!data) {
    showToast('Please enter a URL or text', 'error');
    return;
  }

  showLoading();
  try {
    const response = await fetch(`${API_BASE}/qr/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data,
        size: parseInt(size),
        errorCorrectionLevel
      })
    });

    const result = await response.json();

    if (!result.success) {
      showToast(result.error || 'Failed to generate QR code', 'error');
      return;
    }

    elements.qrImage.src = result.qrCode;
    elements.qrResult.classList.remove('hidden');
    showToast('QR Code generated successfully!', 'success');
  } catch (error) {
    console.error('Error:', error);
    showToast('Error generating QR code', 'error');
  } finally {
    hideLoading();
  }
};

const downloadQRCode = () => {
  const timestamp = new Date().toISOString().split('T')[0];
  downloadImage(elements.qrImage.src, `qr-code-${timestamp}.png`);
  showToast('QR code downloaded!', 'success');
};

const copyQRToClipboard = async () => {
  try {
    const canvas = await html2canvas(elements.qrImage);
    canvas.toBlob(async (blob) => {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('QR code copied to clipboard!', 'success');
    });
  } catch (error) {
    // Fallback: just copy the data URL
    copyToClipboard(elements.qrImage.src);
  }
};

// ==================== URL SHORTENER FUNCTIONS ====================

const shortenURL = async () => {
  const originalUrl = elements.urlInput.value.trim();
  const customCode = elements.customCode.value.trim();

  if (!originalUrl) {
    showToast('Please enter a URL', 'error');
    return;
  }

  showLoading();
  try {
    const response = await fetch(`${API_BASE}/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalUrl,
        customCode: customCode || undefined
      })
    });

    const result = await response.json();

    if (!result.success) {
      showToast(result.error || 'Failed to shorten URL', 'error');
      return;
    }

    // Display results
    elements.originalUrlDisplay.textContent = result.originalUrl;
    elements.shortUrlDisplay.value = result.shortUrl;
    elements.shortUrlQr.src = result.qrCode;
    elements.shortenerResult.classList.remove('hidden');

    showToast('URL shortened successfully!', 'success');
  } catch (error) {
    console.error('Error:', error);
    showToast('Error shortening URL', 'error');
  } finally {
    hideLoading();
  }
};

const copyShortURL = () => {
  const shortUrl = elements.shortUrlDisplay.value;
  copyToClipboard(shortUrl);
};

const downloadShortQR = () => {
  const timestamp = new Date().toISOString().split('T')[0];
  downloadImage(elements.shortUrlQr.src, `short-url-qr-${timestamp}.png`);
  showToast('QR code downloaded!', 'success');
};

// ==================== DASHBOARD FUNCTIONS ====================

const loadDashboard = async () => {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/list`);
    const result = await response.json();

    if (!result.success) {
      elements.dashboardContent.innerHTML = '<p class="loading">Failed to load data</p>';
      return;
    }

    if (result.data.length === 0) {
      elements.dashboardContent.innerHTML = '<p class="loading">No shortened URLs yet</p>';
      return;
    }

    let html = `
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>Short Code</th>
            <th>Original URL</th>
            <th>Clicks</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    result.data.forEach(item => {
      const created = new Date(item.created).toLocaleDateString();
      html += `
        <tr>
          <td>
            <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${item.code}</code>
          </td>
          <td>
            <small>${truncateUrl(item.originalUrl, 50)}</small>
          </td>
          <td>${item.clicks}</td>
          <td>${created}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-secondary btn-small" onclick="copyToClipboard('${item.shortUrl}')">📋</button>
              <button class="delete-btn" onclick="deleteShortURL('${item.code}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    elements.dashboardContent.innerHTML = html;
  } catch (error) {
    console.error('Error:', error);
    elements.dashboardContent.innerHTML = '<p class="loading">Error loading data</p>';
  } finally {
    hideLoading();
  }
};

const deleteShortURL = async (code) => {
  if (!confirm('Are you sure you want to delete this short URL?')) {
    return;
  }

  showLoading();
  try {
    const response = await fetch(`${API_BASE}/delete/${code}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      showToast('Short URL deleted successfully!', 'success');
      loadDashboard();
    } else {
      showToast(result.error || 'Failed to delete URL', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error deleting URL', 'error');
  } finally {
    hideLoading();
  }
};

const truncateUrl = (url, length) => {
  if (url.length > length) {
    return url.substring(0, length) + '...';
  }
  return url;
};

// ==================== TAB SWITCHING ====================

const initTabs = () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = e.target.dataset.tab;
      
      // Update active button
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Update active content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId).classList.add('active');
      
      // Load dashboard if switching to it
      if (tabId === 'dashboard-tab') {
        loadDashboard();
      }
      
      currentTab.value = tabId;
    });
  });
};

// ==================== EVENT LISTENERS ====================

const initEventListeners = () => {
  // QR Code
  elements.qrSize.addEventListener('input', (e) => {
    elements.qrSizeValue.textContent = e.target.value;
  });
  elements.generateQrBtn.addEventListener('click', generateQRCode);
  elements.downloadQrBtn.addEventListener('click', downloadQRCode);
  elements.copyQrBtn.addEventListener('click', copyQRToClipboard);

  // URL Shortener
  elements.shortenBtn.addEventListener('click', shortenURL);
  elements.copyUrlBtn.addEventListener('click', copyShortURL);
  elements.downloadShortQrBtn.addEventListener('click', downloadShortQR);

  // Dashboard
  elements.refreshDashboardBtn.addEventListener('click', loadDashboard);

  // Theme
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Allow Enter key to generate QR code
  elements.qrInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) generateQRCode();
  });

  // Allow Enter key to shorten URL
  elements.urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) shortenURL();
  });
};

// ==================== INITIALIZATION ====================

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initEventListeners();
  console.log('✅ Application loaded successfully');
});
