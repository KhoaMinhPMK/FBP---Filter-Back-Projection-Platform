// Modern Simulation Page JavaScript
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Global State
let currentImage = null;
let sinogramData = null;
let reconstructedImage = null;
let webcamStream = null;
let isProcessing = false;
let processingStep = 0;
let fbpProcessor = null; // FBP Processor instance

// ============================================
// INITIALIZATION
// ============================================
function init() {
  // Initialize FBP Processor
  fbpProcessor = new FBPProcessor();
  
  initDynamicHeader();
  initMobileMenu();
  initInputTabs();
  initFileUpload();
  initWebcam();
  initPhantom();
  initControls();
  initCanvas();
  initAuthButtons();
  
  console.log('✅ Simulation page initialized with real FBP processor');
}

// Dynamic Header
function initDynamicHeader() {
  const header = $('#header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Mobile Menu
function initMobileMenu() {
  const menuToggle = $('#menuToggle');
  const headerNav = $('#mainNav');
  
  if (!menuToggle || !headerNav) return;

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    headerNav.classList.toggle('mobile-open');
  });

  document.addEventListener('click', (e) => {
    if (!headerNav.contains(e.target) && !menuToggle.contains(e.target)) {
      menuToggle.classList.remove('active');
      headerNav.classList.remove('mobile-open');
    }
  });
}

// ============================================
// INPUT TABS
// ============================================
function initInputTabs() {
  const tabs = $$('.input-tab');
  const contents = $$('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab + '-tab';
      
      // Remove active class from all
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      // Add active to clicked
      tab.classList.add('active');
      const targetContent = $('#' + targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

// ============================================
// FILE UPLOAD
// ============================================
function initFileUpload() {
  const uploadZone = $('#uploadZone');
  const fileInput = $('#fileInput');
  const filePreview = $('#filePreview');
  
  if (!uploadZone || !fileInput) return;
  
  // Click to upload
  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
  });
  
  // Drag and drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });
  
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  });
}

function handleFileSelect(file) {
  if (!file) return;
  
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
  if (!validTypes.includes(file.type)) {
    showNotification('Chỉ hỗ trợ file PNG, JPG, BMP', 'error');
    return;
  }
  
  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    showNotification('File quá lớn (max 10MB)', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      displayImagePreview(img, file.name);
      drawImageToCanvas(img, 'largeOriginalCanvas');
      hideImagePlaceholder('originalPlaceholder');
      showNotification('Tải file thành công!', 'success');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function displayImagePreview(img, filename) {
  const filePreview = $('#filePreview');
  if (!filePreview) return;
  
  filePreview.innerHTML = `
    <div style="padding: 16px; background: var(--bg-dark); border-radius: 12px; border: 2px solid var(--border-color);">
      <img src="${img.src}" style="width: 100%; border-radius: 8px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <p style="margin: 0; font-size: 14px; font-weight: 600;">${filename}</p>
          <small style="color: var(--text-secondary);">${img.width}×${img.height}px</small>
        </div>
        <button class="btn-icon" onclick="clearImage()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
}

function clearImage() {
  currentImage = null;
  const filePreview = $('#filePreview');
  if (filePreview) filePreview.innerHTML = '';
  const fileInput = $('#fileInput');
  if (fileInput) fileInput.value = '';
  showCanvasOverlay();
}

// ============================================
// WEBCAM
// ============================================
function initWebcam() {
  const startCameraBtn = $('#startCameraBtn');
  const captureBtn = $('#captureBtn');
  const video = $('#webcamVideo');
  const canvas = $('#webcamCanvas');
  
  if (!startCameraBtn || !video) return;
  
  startCameraBtn.addEventListener('click', async () => {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = webcamStream;
      video.style.display = 'block';
      startCameraBtn.style.display = 'none';
      captureBtn.style.display = 'block';
      showNotification('Camera đã bật', 'success');
    } catch (err) {
      showNotification('Không thể truy cập camera: ' + err.message, 'error');
    }
  });
  
  if (captureBtn) {
    captureBtn.addEventListener('click', () => {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      // Stop webcam
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
      
      // Convert to image
      canvas.toBlob(blob => {
        const img = new Image();
        img.onload = () => {
          currentImage = img;
          drawImageToCanvas(img, 'largeOriginalCanvas');
          hideImagePlaceholder('originalPlaceholder');
          hideCanvasOverlay();
          showNotification('Chụp ảnh thành công!', 'success');
        };
        img.src = URL.createObjectURL(blob);
      });
      
      video.style.display = 'none';
      captureBtn.style.display = 'none';
      startCameraBtn.style.display = 'block';
    });
  }
}

// ============================================
// PHANTOM GENERATION
// ============================================
function initPhantom() {
  const generateBtn = $('#generatePhantomBtn');
  
  if (!generateBtn) return;
  
  generateBtn.addEventListener('click', () => {
    const phantomType = $('#phantomSelect').value;
    const size = parseInt($('#imageSize').value) || 256;
    
    const phantom = generatePhantom(phantomType, size);
    currentImage = phantom;
    drawImageToCanvas(phantom, 'largeOriginalCanvas');
    hideImagePlaceholder('originalPlaceholder');
    hideCanvasOverlay();
    showNotification(`Phantom ${phantomType} đã được tạo`, 'success');
  });
}

function generatePhantom(type, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  
  ctx.fillStyle = '#fff';
  
  switch(type) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/3, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'square':
      ctx.fillRect(size/4, size/4, size/2, size/2);
      break;
      
    case 'shepp-logan':
      // Simplified Shepp-Logan phantom
      drawSheppLogan(ctx, size);
      break;
      
    case 'custom':
      // Custom pattern
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * size / 6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
  }
  
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

function drawSheppLogan(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  
  // Large ellipse
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.69, 0.92);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Smaller ellipses
  const ellipses = [
    {x: 0, y: -0.0184, a: 0.6624, b: 0.874, angle: 0},
    {x: 0.22, y: 0, a: 0.11, b: 0.31, angle: -18},
    {x: -0.22, y: 0, a: 0.16, b: 0.41, angle: 18},
  ];
  
  ellipses.forEach(e => {
    ctx.save();
    ctx.translate(cx + e.x * size, cy + e.y * size);
    ctx.rotate(e.angle * Math.PI / 180);
    ctx.scale(e.a, e.b);
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ============================================
// CONTROLS
// ============================================
function initControls() {
  // Sliders
  const numProjections = $('#numProjections');
  const projValue = $('#projValue');
  if (numProjections && projValue) {
    numProjections.addEventListener('input', (e) => {
      projValue.textContent = e.target.value;
    });
  }
  
  const imageSize = $('#imageSize');
  const sizeValue = $('#sizeValue');
  if (imageSize && sizeValue) {
    imageSize.addEventListener('input', (e) => {
      sizeValue.textContent = e.target.value;
    });
  }
  
  // Run button
  const runBtn = $('#runBtn');
  if (runBtn) {
    runBtn.addEventListener('click', runSimulation);
  }
  
  // Pause button
  const pauseBtn = $('#pauseBtn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', pauseSimulation);
  }
  
  // Reset button
  const resetAllBtn = $('#resetAllBtn');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', resetAll);
  }
  
  // Download button
  const downloadBtn = $('#downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadResults);
  }
  
  // Tutorial button
  const tutorialBtn = $('#tutorialBtn');
  if (tutorialBtn) {
    tutorialBtn.addEventListener('click', () => {
      showNotification('Tutorial đang được phát triển', 'info');
    });
  }
  
  // Start sim button
  const startSimBtn = $('#startSimBtn');
  if (startSimBtn) {
    startSimBtn.addEventListener('click', () => {
      window.scrollTo({
        top: document.querySelector('.main-section').offsetTop - 80,
        behavior: 'smooth'
      });
    });
  }
}

// ============================================
// SIMULATION
// ============================================
async function runSimulation() {
  if (!currentImage) {
    showNotification('Vui lòng tải ảnh hoặc tạo phantom trước', 'warning');
    return;
  }
  
  if (isProcessing) {
    showNotification('Đang xử lý...', 'warning');
    return;
  }
  
  isProcessing = true;
  updateStatus('processing', 'Đang xử lý...');
  
  const runBtn = $('#runBtn');
  const pauseBtn = $('#pauseBtn');
  if (runBtn) runBtn.disabled = true;
  if (pauseBtn) pauseBtn.disabled = false;
  
  const startTime = Date.now();
  
  try {
    // Step 1: Input Image
    await processStep(1, 'Loading image...', async () => {
      await sleep(500);
    });
    
    // Step 2: Create Sinogram
    await processStep(2, 'Creating sinogram...', async () => {
      sinogramData = await createSinogram(currentImage);
      drawSinogram(sinogramData);
      await sleep(1000);
    });
    
    // Step 3: Apply Filter
    await processStep(3, 'Applying filter...', async () => {
      await sleep(800);
    });
    
    // Step 4: Back-Projection
    await processStep(4, 'Back-projecting...', async () => {
      reconstructedImage = await backProject(sinogramData);
      drawImageToCanvas(reconstructedImage, 'largeReconstructedCanvas');
      hideImagePlaceholder('reconstructedPlaceholder');
      await sleep(1000);
    });
    
    // Step 5: Complete
    await processStep(5, 'Completed', async () => {
      const metrics = calculateMetrics(currentImage, reconstructedImage);
      displayMetrics(metrics);
      await sleep(500);
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    updateTime(elapsed);
    updateStatus('success', 'Hoàn thành');
    showNotification('Mô phỏng hoàn tất!', 'success');
    
  } catch (err) {
    updateStatus('error', 'Lỗi');
    showNotification('Lỗi: ' + err.message, 'error');
    console.error(err);
  } finally {
    isProcessing = false;
    if (runBtn) runBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
  }
}

async function processStep(step, message, callback) {
  processingStep = step;
  updateProgress((step / 5) * 100);
  updateStatus('processing', message);
  
  // Activate timeline step
  const steps = $$('.timeline-step');
  steps.forEach((s, i) => {
    if (i < step - 1) {
      s.classList.add('completed');
      s.classList.remove('active');
    } else if (i === step - 1) {
      s.classList.add('active');
    } else {
      s.classList.remove('active', 'completed');
    }
  });
  
  // Activate connectors
  const connectors = $$('.timeline-connector');
  connectors.forEach((c, i) => {
    if (i < step - 1) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
  
  await callback();
}

function pauseSimulation() {
  isProcessing = false;
  updateStatus('paused', 'Tạm dừng');
  showNotification('Đã tạm dừng', 'info');
}

function resetAll() {
  isProcessing = false;
  processingStep = 0;
  currentImage = null;
  sinogramData = null;
  reconstructedImage = null;
  
  clearImage();
  updateStatus('ready', 'Sẵn sàng');
  updateProgress(0);
  updateTime(0);
  
  // Clear canvases
  ['largeOriginalCanvas', 'largeReconstructedCanvas', 'largeSinogramCanvas'].forEach(id => {
    clearCanvas(id);
  });
  
  // Show all placeholders
  ['originalPlaceholder', 'sinogramPlaceholder', 'reconstructedPlaceholder'].forEach(id => {
    showImagePlaceholder(id);
  });
  
  // Reset timeline
  $$('.timeline-step').forEach(s => {
    s.classList.remove('active', 'completed');
  });
  $$('.timeline-connector').forEach(c => {
    c.classList.remove('active');
  });
  
  // Reset metrics
  $('#psnrValue').textContent = '--';
  $('#ssimValue').textContent = '--';
  $('#timeValue').textContent = '--';
  
  showCanvasOverlay();
  showNotification('Đã reset tất cả', 'info');
}

// ============================================
// CANVAS
// ============================================
function initCanvas() {
  // Fullscreen button for results display
  const fullscreenBtn = $('#fullscreenBtn');
  const resultsDisplay = $('.results-display-area');
  
  if (fullscreenBtn && resultsDisplay) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        resultsDisplay.requestFullscreen();
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
      } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
      }
    });
  }
}

function drawImageToCanvas(img, canvasId) {
  const canvas = $('#' + canvasId);
  if (!canvas) return;
  
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  // Show canvas and hide placeholder
  canvas.classList.add('active');
}

function clearCanvas(canvasId) {
  const canvas = $('#' + canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Hide canvas
  canvas.classList.remove('active');
}

function hideImagePlaceholder(placeholderId) {
  const placeholder = $('#' + placeholderId);
  if (placeholder) {
    placeholder.classList.add('hidden');
  }
}

function showImagePlaceholder(placeholderId) {
  const placeholder = $('#' + placeholderId);
  if (placeholder) {
    placeholder.classList.remove('hidden');
  }
}

function hideCanvasOverlay() {
  const overlay = $('#canvasOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function showCanvasOverlay() {
  const overlay = $('#canvasOverlay');
  if (overlay) overlay.classList.remove('hidden');
}

// ============================================
// FBP ALGORITHMS (Real Implementation)
// ============================================

/**
 * Convert image to grayscale ImageData for FBP processing
 */
function getImageData(img) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Create sinogram from image using Radon transform
 */
async function createSinogram(img) {
  return new Promise((resolve) => {
    try {
      // Convert image to ImageData
      const imageData = getImageData(img);
      
      // Preprocess and denoise
      const preprocessed = fbpProcessor.preprocessAndDenoise(imageData);
      
      // Create sinogram using Radon transform
      const sinogramResult = fbpProcessor.createSinogram(preprocessed);
      
      resolve(sinogramResult);
    } catch (error) {
      console.error('Error creating sinogram:', error);
      resolve(null);
    }
  });
}

/**
 * Draw sinogram result to canvas
 */
function drawSinogram(sinogramResult) {
  const canvas = $('#largeSinogramCanvas');
  if (!canvas || !sinogramResult) return;
  
  // Set canvas size
  canvas.width = sinogramResult.width;
  canvas.height = sinogramResult.height;
  
  // Convert Uint8ClampedArray to ImageData
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(sinogramResult.width, sinogramResult.height);
  
  // sinogramResult.display is grayscale Uint8ClampedArray
  // Convert to RGBA
  for (let i = 0; i < sinogramResult.display.length; i++) {
    const value = sinogramResult.display[i];
    const idx = i * 4;
    imageData.data[idx] = value;     // R
    imageData.data[idx + 1] = value; // G
    imageData.data[idx + 2] = value; // B
    imageData.data[idx + 3] = 255;   // A
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Show canvas and hide placeholder
  canvas.classList.add('active');
  hideImagePlaceholder('sinogramPlaceholder');
}

/**
 * Perform back-projection with selected filter
 */
async function backProject(sinogramData) {
  return new Promise((resolve) => {
    try {
      // Reconstruct image using FBP algorithm
      const reconstructed = fbpProcessor.reconstructImage(sinogramData);
      
      // Convert Uint8ClampedArray to ImageData, then to Image
      const canvas = document.createElement('canvas');
      canvas.width = reconstructed.width;
      canvas.height = reconstructed.height;
      const ctx = canvas.getContext('2d');
      
      // Create ImageData from grayscale data
      const imageData = ctx.createImageData(reconstructed.width, reconstructed.height);
      for (let i = 0; i < reconstructed.data.length; i++) {
        const value = reconstructed.data[i];
        const idx = i * 4;
        imageData.data[idx] = value;     // R
        imageData.data[idx + 1] = value; // G
        imageData.data[idx + 2] = value; // B
        imageData.data[idx + 3] = 255;   // A
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = canvas.toDataURL();
    } catch (error) {
      console.error('Error in back-projection:', error);
      resolve(null);
    }
  });
}

/**
 * Calculate PSNR and SSIM metrics
 */
function calculateMetrics(original, reconstructed) {
  try {
    // Convert original image to ImageData
    const origData = getImageData(original);
    
    // Convert reconstructed Image to ImageData
    const recCanvas = document.createElement('canvas');
    recCanvas.width = reconstructed.width;
    recCanvas.height = reconstructed.height;
    const recCtx = recCanvas.getContext('2d');
    recCtx.drawImage(reconstructed, 0, 0);
    const recData = recCtx.getImageData(0, 0, recCanvas.width, recCanvas.height);
    
    // Use FBP processor to evaluate
    const metrics = fbpProcessor.evaluateReconstruction(origData.data, recData.data);
    
    return {
      psnr: metrics.psnr.toFixed(2),
      ssim: metrics.ssim.toFixed(3)
    };
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return {
      psnr: '--',
      ssim: '--'
    };
  }
}

function displayMetrics(metrics) {
  $('#psnrValue').textContent = metrics.psnr;
  $('#ssimValue').textContent = metrics.ssim;
  
  // Update processing info
  const numProjections = $('#numProjections');
  const filterType = $('#filterType');
  const imageSize = $('#imageSize');
  
  if (numProjections) {
    $('#infoProjections').textContent = numProjections.value;
  }
  if (filterType) {
    $('#infoFilter').textContent = filterType.options[filterType.selectedIndex].text;
  }
  if (imageSize && currentImage) {
    $('#infoSize').textContent = imageSize.value + '×' + imageSize.value + 'px';
  }
}

// ============================================
// UI UPDATES
// ============================================
function updateStatus(type, text) {
  const statusIcon = $('#statusIcon');
  const statusText = $('#statusText');
  const spinner = $('#statusSpinner');
  
  if (statusIcon) {
    statusIcon.className = 'fas fa-circle';
    if (type === 'processing') {
      statusIcon.style.color = 'var(--warning-color)';
      if (spinner) spinner.style.display = 'inline-block';
    } else if (type === 'success') {
      statusIcon.style.color = 'var(--success-color)';
      if (spinner) spinner.style.display = 'none';
    } else if (type === 'error') {
      statusIcon.style.color = 'var(--error-color)';
      if (spinner) spinner.style.display = 'none';
    } else {
      statusIcon.style.color = 'var(--primary-color)';
      if (spinner) spinner.style.display = 'none';
    }
  }
  
  if (statusText) statusText.textContent = text;
}

function updateProgress(percent) {
  const progressDisplay = $('#progressDisplay');
  if (progressDisplay) {
    progressDisplay.textContent = Math.round(percent) + '%';
  }
}

function updateTime(seconds) {
  const timeDisplay = $('#timeDisplay');
  const timeValue = $('#timeValue');
  if (timeDisplay) timeDisplay.textContent = seconds + 's';
  if (timeValue) timeValue.textContent = seconds;
}

function showNotification(message, type = 'info') {
  // Simple notification
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // You can implement a toast notification here
  alert(message);
}

// ============================================
// DOWNLOAD
// ============================================
function downloadResults() {
  if (!reconstructedImage) {
    showNotification('Chưa có kết quả để tải', 'warning');
    return;
  }
  
  const canvas = $('#reconstructedCanvas');
  if (!canvas) return;
  
  const link = document.createElement('a');
  link.download = 'fbp_reconstructed_3d.png';
  link.href = canvas.toDataURL();
  link.click();
  
  showNotification('Đã tải kết quả', 'success');
}

// ============================================
// AUTH BUTTONS
// ============================================
function initAuthButtons() {
  const loginBtn = $('.btn-login');
  const registerBtn = $('.btn-register');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      if (loginBtn.tagName.toLowerCase() !== 'a') {
        e.preventDefault();
        window.location.href = '../auth/index.html#login';
      }
    });
  }
  
  if (registerBtn) {
    registerBtn.addEventListener('click', (e) => {
      if (registerBtn.tagName.toLowerCase() !== 'a') {
        e.preventDefault();
        window.location.href = '../auth/index.html#register';
      }
    });
  }
}

// ============================================
// UTILITIES
// ============================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// START
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
