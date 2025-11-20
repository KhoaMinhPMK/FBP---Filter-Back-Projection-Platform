from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import os
import glob
from datetime import datetime
from werkzeug.utils import secure_filename
import shutil
import torch

# Monkeypatch torch.load to disable weights_only=True default in PyTorch 2.6+
# This is needed because the YOLO model contains custom classes
try:
    _original_load = torch.load
    def _safe_load(*args, **kwargs):
        if 'weights_only' not in kwargs:
            kwargs['weights_only'] = False
        return _original_load(*args, **kwargs)
    torch.load = _safe_load
    print("✅ Đã áp dụng bản vá cho torch.load (weights_only=False)")
except Exception as e:
    print(f"⚠️ Không thể vá torch.load: {e}")

app = Flask(__name__, static_folder='.')
CORS(app)

# Cấu hình thư mục upload và kết quả
UPLOAD_FOLDER = 'uploads'
RESULTS_FOLDER = 'results'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# Load YOLO model globally
print("⏳ Đang load YOLO model...")
model = None
model_path = 'model/best.pt'
if os.path.exists(model_path):
    try:
        from ultralytics import YOLO
        model = YOLO(model_path)
        print('✅ Đã load YOLO model thành công')
    except Exception as e:
        print(f'⚠️ Không thể load YOLO model: {e}')
else:
    print(f'⚠️ Không tìm thấy file model tại {model_path}')

@app.route('/api/create_video', methods=['POST'])
def create_video():
    print("📥 Nhận request tạo video")
    try:
        # Lấy thông tin bệnh nhân
        patient_name = request.form.get('patient_name', 'Unknown')
        print(f"👤 Bệnh nhân: {patient_name}")
        
        # Kiểm tra file upload
        if 'images' not in request.files:
            return jsonify({'error': 'Không có file ảnh'}), 400
        
        files = request.files.getlist('images')
        print(f"📸 Số lượng ảnh nhận được: {len(files)}")
        
        if len(files) == 0:
            return jsonify({'error': 'Vui lòng chọn ít nhất một ảnh'}), 400
        
        # Sanitize patient name to avoid filesystem issues
        safe_patient_name = secure_filename(patient_name)
        if not safe_patient_name:
            safe_patient_name = 'unknown_patient'
            
        # Tạo thư mục cho bệnh nhân
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        patient_folder = os.path.join(UPLOAD_FOLDER, f'{safe_patient_name}_{timestamp}')
        os.makedirs(patient_folder, exist_ok=True)
        
        # Lưu các file ảnh
        image_files = []
        for i, file in enumerate(files):
            if file and allowed_file(file.filename):
                # Generate safe filename using counter
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"image_{i:04d}.{ext}"
                filepath = os.path.join(patient_folder, filename)
                file.save(filepath)
                image_files.append(filepath)
        
        if not image_files:
            return jsonify({'error': 'Không có ảnh hợp lệ'}), 400
        
        print(f"💾 Đã lưu {len(image_files)} ảnh vào {patient_folder}")

        # Sắp xếp file theo tên
        image_files.sort()
        
        # Tạo video từ ảnh
        output_video_name = f'{safe_patient_name}_{timestamp}.webm'
        output_video_path = os.path.join(RESULTS_FOLDER, output_video_name)
        
        # Helper function to read image with unicode path support
        import numpy as np
        def read_image_unicode(path):
            try:
                stream = open(path, "rb")
                bytes = bytearray(stream.read())
                numpyarray = np.asarray(bytes, dtype=np.uint8)
                return cv2.imdecode(numpyarray, cv2.IMREAD_UNCHANGED)
            except Exception as e:
                print(f"Error reading file {path}: {e}")
                return None

        # Đọc kích thước ảnh đầu tiên
        frame = read_image_unicode(image_files[0])
        if frame is None:
             return jsonify({'error': 'Không thể đọc file ảnh (lỗi encoding hoặc file hỏng)'}), 400

        # Handle grayscale images
        if len(frame.shape) == 2:
            height, width = frame.shape
            frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
        else:
            height, width, layers = frame.shape
        
        print(f"📐 Kích thước video: {width}x{height}")

        # Thiết lập video writer
        fps = 10  # Frames per second
        # Sử dụng codec VP8 (vp80) cho định dạng WebM - tương thích tốt với trình duyệt
        fourcc = cv2.VideoWriter_fourcc(*'vp80')
        video = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        
        if not video.isOpened():
            print("❌ Không thể mở VideoWriter")
            return jsonify({'error': 'Không thể khởi tạo VideoWriter'}), 500

        print("🎥 Bắt đầu tạo video...")
        
        detected_frames = []
        # Xử lý từng ảnh
        count = 0
        for image_path in image_files:
            frame = read_image_unicode(image_path)
            if frame is None:
                continue
            
            # Convert grayscale to BGR if needed
            # Convert grayscale to BGR if needed
            if len(frame.shape) == 2:
                frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
            
            # Phát hiện khối u bằng YOLO (nếu có model)
            if model:
                try:
                    results = model(frame, verbose=False) # verbose=False để giảm log
                    # Vẽ bounding box lên ảnh
                    has_tumor = False
                    for r in results:
                        boxes = r.boxes.xyxy.cpu().numpy() if hasattr(r.boxes, 'xyxy') else []
                        if len(boxes) > 0:
                            has_tumor = True
                        for box in boxes:
                            x1, y1, x2, y2 = map(int, box)
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                            cv2.putText(frame, 'Tumor', (x1, y1-10), 
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
                    
                    # Lưu ảnh nếu có khối u (giới hạn số lượng để tránh quá tải)
                    if has_tumor and len(detected_frames) < 5:
                        tumor_img_name = f'{safe_patient_name}_{timestamp}_tumor_{count}.jpg'
                        tumor_img_path = os.path.join(RESULTS_FOLDER, tumor_img_name)
                        cv2.imwrite(tumor_img_path, frame)
                        detected_frames.append(f'/results/{tumor_img_name}')
                        
                except Exception as e:
                    print(f'⚠️ Lỗi khi phát hiện (ảnh {count}): {e}')
            
            video.write(frame)
            count += 1
            if count % 10 == 0:
                print(f"✅ Đã xử lý {count} frames")
        
        video.release()
        print(f"✅ Đã tạo video xong: {output_video_path}")
        
        # Xóa thư mục upload tạm
        shutil.rmtree(patient_folder)
        
        return jsonify({
            'success': True,
            'video_url': f'/results/{output_video_name}',
            'patient_name': patient_name,
            'frame_count': len(image_files),
            'detected_frames': detected_frames
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/results/<filename>')
def serve_result(filename):
    return send_from_directory(RESULTS_FOLDER, filename)

@app.route('/api/get_latest_video', methods=['GET'])
def get_latest_video():
    try:
        # Lấy danh sách tất cả video trong thư mục results (ưu tiên webm, sau đó mp4)
        video_files = glob.glob(os.path.join(RESULTS_FOLDER, '*.webm')) + glob.glob(os.path.join(RESULTS_FOLDER, '*.mp4'))
        
        if not video_files:
            return jsonify({'error': 'Không tìm thấy video nào'}), 404
        
        # Sắp xếp theo thời gian tạo (mới nhất)
        latest_video = max(video_files, key=os.path.getctime)
        video_name = os.path.basename(latest_video)
        
        # Lấy thông tin file
        file_size = os.path.getsize(latest_video)
        created_time = datetime.fromtimestamp(os.path.getctime(latest_video)).strftime('%Y-%m-%d %H:%M:%S')
        
        return jsonify({
            'success': True,
            'video_url': f'/results/{video_name}',
            'video_name': video_name,
            'file_size': file_size,
            'created_time': created_time
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('🚀 Server đang chạy tại http://localhost:5000')
    print('📁 Upload folder:', UPLOAD_FOLDER)
    print('📁 Results folder:', RESULTS_FOLDER)
    # Disable reloader to prevent restarts during heavy processing or library file access
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
