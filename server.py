from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import os
import glob
from datetime import datetime
from werkzeug.utils import secure_filename
import shutil

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

@app.route('/api/create_video', methods=['POST'])
def create_video():
    try:
        # Lấy thông tin bệnh nhân
        patient_name = request.form.get('patient_name', 'Unknown')
        
        # Kiểm tra file upload
        if 'images' not in request.files:
            return jsonify({'error': 'Không có file ảnh'}), 400
        
        files = request.files.getlist('images')
        if len(files) == 0:
            return jsonify({'error': 'Vui lòng chọn ít nhất một ảnh'}), 400
        
        # Tạo thư mục cho bệnh nhân
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        patient_folder = os.path.join(UPLOAD_FOLDER, f'{patient_name}_{timestamp}')
        os.makedirs(patient_folder, exist_ok=True)
        
        # Lưu các file ảnh
        image_files = []
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(patient_folder, filename)
                file.save(filepath)
                image_files.append(filepath)
        
        if not image_files:
            return jsonify({'error': 'Không có ảnh hợp lệ'}), 400
        
        # Sắp xếp file theo tên
        image_files.sort()
        
        # Tạo video từ ảnh
        output_video_name = f'{patient_name}_{timestamp}.mp4'
        output_video_path = os.path.join(RESULTS_FOLDER, output_video_name)
        
        # Đọc kích thước ảnh đầu tiên
        frame = cv2.imread(image_files[0])
        height, width, layers = frame.shape
        
        # Thiết lập video writer
        fps = 10  # Frames per second
        # Sử dụng codec H.264 (avc1) để tương thích tốt hơn với trình duyệt
        fourcc = cv2.VideoWriter_fourcc(*'avc1')  # hoặc 'H264' hoặc 'X264'
        video = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        
        # Load YOLO model (nếu có)
        model = None
        model_path = 'model/best.pt'
        if os.path.exists(model_path):
            try:
                from ultralytics import YOLO
                model = YOLO(model_path)
                print('✅ Đã load YOLO model')
            except Exception as e:
                print(f'⚠️ Không thể load YOLO model: {e}')
        
        # Xử lý từng ảnh
        for image_path in image_files:
            frame = cv2.imread(image_path)
            
            # Phát hiện khối u bằng YOLO (nếu có model)
            if model:
                try:
                    results = model(frame)
                    # Vẽ bounding box lên ảnh
                    for r in results:
                        boxes = r.boxes.xyxy.cpu().numpy() if hasattr(r.boxes, 'xyxy') else []
                        for box in boxes:
                            x1, y1, x2, y2 = map(int, box)
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                            cv2.putText(frame, 'Tumor', (x1, y1-10), 
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
                except Exception as e:
                    print(f'⚠️ Lỗi khi phát hiện: {e}')
            
            video.write(frame)
        
        video.release()
        
        # Xóa thư mục upload tạm
        shutil.rmtree(patient_folder)
        
        return jsonify({
            'success': True,
            'video_url': f'/results/{output_video_name}',
            'patient_name': patient_name,
            'frame_count': len(image_files)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/results/<filename>')
def serve_result(filename):
    return send_from_directory(RESULTS_FOLDER, filename)

@app.route('/api/get_latest_video', methods=['GET'])
def get_latest_video():
    try:
        # Lấy danh sách tất cả video trong thư mục results
        video_files = glob.glob(os.path.join(RESULTS_FOLDER, '*.mp4'))
        
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
    app.run(debug=True, host='0.0.0.0', port=5000)
