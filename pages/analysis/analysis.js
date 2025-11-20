// Phần này sẽ xử lý upload và hiển thị kết quả
// Tích hợp backend hoặc YOLO.js sau

// Flag to prevent duplicate event listeners
let analyzeButtonInitialized = false;

// Tự động tải video mới nhất khi trang load
async function loadLatestVideo() {
  const resultVideo = document.getElementById('result-video');
  const uploadInfo = document.getElementById('upload-info');
  
  try {
    const response = await fetch('http://localhost:5000/api/get_latest_video');
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Video data:', data);
      
      if (data.success && data.video_url) {
        const videoUrl = `http://localhost:5000${data.video_url}`;
        console.log('Loading video from:', videoUrl);
        
        resultVideo.innerHTML = `
          <div style="width: 100%; text-align: center;">
            <video controls autoplay muted width="100%" style="max-width: 360px; border-radius: 8px; background: #000;">
              <source src="${videoUrl}" type="video/mp4">
              Trình duyệt không hỗ trợ video.
            </video>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 10px;">
              📹 ${data.video_name}<br>
              📅 ${data.created_time}<br>
              📊 ${(data.file_size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        `;
        uploadInfo.innerHTML = `✅ Đã tải video mới nhất`;
        console.log('✅ Video loaded successfully');
      }
    } else {
      console.warn('API response not OK:', response.status);
      resultVideo.innerHTML = '<div style="color: #94a3b8; padding: 20px;">Chưa có video nào. Hãy upload ảnh để tạo video.</div>';
    }
  } catch (err) {
    console.error('Error loading video:', err);
    resultVideo.innerHTML = '<div style="color: #94a3b8; padding: 20px;">Chưa có video nào. Hãy upload ảnh để tạo video.</div>';
  }
}

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
  // Hiển thị trạng thái đang xử lý
  uploadInfo.innerHTML = `Đang xử lý ${input.files.length} ảnh và tạo video...`;
  resultVideo.innerHTML = '<div style="color: #667eea; padding: 20px;">⏳ Đang xử lý...</div>';

  // Gọi API backend
  try {
    const response = await fetch('http://localhost:5000/api/create_video', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Lỗi khi xuất video!');
    }
    
    const data = await response.json();
    
    // Hiện video mp4 ở cột phải
    if (data.success && data.video_url) {
      resultVideo.innerHTML = `
        <video controls width="100%" style="max-width: 360px; border-radius: 8px;">
          <source src="http://localhost:5000${data.video_url}" type="video/mp4">
          Trình duyệt không hỗ trợ video.
        </video>
      `;
      uploadInfo.innerHTML = `
        ✅ Đã tạo video thành công!<br>
        Bệnh nhân: ${data.patient_name}<br>
        Số khung hình: ${data.frame_count}
      `;
    } else {
      resultVideo.innerHTML = '<div style="color: red;">❌ Không tìm thấy video kết quả.</div>';
    }
  } catch (err) {
    resultVideo.innerHTML = '<div style="color: red;">❌ Có lỗi khi xử lý video!</div>';
    uploadInfo.innerHTML = `<br><span style="color: red;">${err.message}</span>`;
    console.error('Error:', err);
  }
}

// Initialize analysis page
function initAnalysis() {
  const analyzeBtn = document.getElementById('analyze-btn');
  const reloadBtn = document.getElementById('reload-video-btn');
  
  // Only add event listener once
  if (!analyzeButtonInitialized && analyzeBtn) {
    analyzeBtn.addEventListener('click', handleAnalyzeClick);
    analyzeButtonInitialized = true;
    console.log('✅ Analysis page initialized');
  }
  
  // Thêm sự kiện cho nút tải lại video
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      loadLatestVideo();
      console.log('🔄 Đang tải lại video mới nhất...');
    });
  }
  
  // Tự động tải video mới nhất
  loadLatestVideo();
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalysis);
} else {
  initAnalysis();
}
