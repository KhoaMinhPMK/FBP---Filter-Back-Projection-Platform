import cv2
import os
import glob
from ultralytics import YOLO

# Đường dẫn thư mục chứa ảnh
image_folder = r'C:\Users\Nha My\Downloads\FBP\data\dicom_TRUONG THAI HOA_58T_25039391_309'
output_video = os.path.join(image_folder, 'output.mp4')
model_path = r'C:\Users\Nha My\Downloads\FBP\model\best.pt'

# Tăng fps video
fps = 10

# Load YOLO model
model = YOLO(model_path)

# Lấy danh sách tất cả các file ảnh (jpg, png, bmp...)
image_types = ('*.jpg', '*.jpeg', '*.png', '*.bmp')
image_files = []
for ext in image_types:
    image_files.extend(glob.glob(os.path.join(image_folder, ext)))

# Sắp xếp file theo tên
image_files.sort()

if not image_files:
    raise ValueError('Không tìm thấy ảnh trong thư mục!')

# Đọc kích thước ảnh đầu tiên
frame = cv2.imread(image_files[0])
height, width, layers = frame.shape

# Thiết lập video writer
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
video = cv2.VideoWriter(output_video, fourcc, fps, (width, height))

for image in image_files:
    frame = cv2.imread(image)
    # Phát hiện khối u bằng YOLO
    results = model(frame)
    # Vẽ bounding box lên ảnh
    for r in results:
        boxes = r.boxes.xyxy.cpu().numpy() if hasattr(r, 'boxes') else []
        for box in boxes:
            x1, y1, x2, y2 = map(int, box)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
    video.write(frame)

video.release()
print(f'Video đã lưu tại: {output_video}')
