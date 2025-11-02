// Phần này sẽ xử lý upload và hiển thị kết quả
// Tích hợp backend hoặc YOLO.js sau

// Flag to prevent duplicate event listeners
let analyzeButtonInitialized = false;

async function handleAnalyzeClick() {
  const input = document.getElementById('image-upload');
  const resultVideo = document.getElementById('result-video');
  const uploadInfo = document.getElementById('upload-info');
  const patientName = document.getElementById('patient-name').value.trim();
  resultVideo.innerHTML = '';
  uploadInfo.innerHTML = '';
  if (!input.files.length) {
    uploadInfo.innerHTML = 'Vui lòng chọn ảnh DICOM (PNG/JPG)!';
    return;
  }
  if (!patientName) {
    uploadInfo.innerHTML = 'Vui lòng nhập họ tên bệnh nhân!';
    return;
  }
  uploadInfo.innerHTML = `Đã chọn ${input.files.length} ảnh.`;

  // Gửi ảnh và tên bệnh nhân lên backend để xử lý xuất video mp4
  const formData = new FormData();
  formData.append('patient_name', patientName);
  for (const file of input.files) {
    formData.append('images', file);
  }
  // Gọi API backend (ví dụ /api/create_video)
  try {
    const response = await fetch('/api/create_video', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Lỗi khi xuất video!');
    const data = await response.json();
    // Hiện video mp4 ở cột phải
    if (data.video_url) {
      resultVideo.innerHTML = `<video controls width="360"><source src="${data.video_url}" type="video/mp4"></video>`;
      uploadInfo.innerHTML += '<br>Video đã lưu vào thư mục kết quả!';
    } else {
      resultVideo.innerHTML = 'Không tìm thấy video kết quả.';
    }
  } catch (err) {
    resultVideo.innerHTML = 'Có lỗi khi xử lý video!';
    uploadInfo.innerHTML += `<br>${err.message}`;
  }
}

// Initialize analysis page
function initAnalysis() {
  const analyzeBtn = document.getElementById('analyze-btn');
  
  // Only add event listener once
  if (!analyzeButtonInitialized && analyzeBtn) {
    analyzeBtn.addEventListener('click', handleAnalyzeClick);
    analyzeButtonInitialized = true;
    console.log('✅ Analysis page initialized');
  }
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalysis);
} else {
  initAnalysis();
}
