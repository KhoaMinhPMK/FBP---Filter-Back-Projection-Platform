from ultralytics import YOLO
import cv2

# --- BƯỚC 1: TẢI MODEL TỪ FILE best.pt CỦA BẠN ---
# ⚠️ THAY ĐỔI DÒNG NÀY:
# Thay 'path/to/your/best.pt' bằng đường dẫn thực tế tới file của bạn.
model_path = '../model/best.pt'

try:
    print(f"Đang tải model từ: {model_path}")
    model = YOLO(model_path)
    print("Tải model thành công!")
except Exception as e:
    print(f"Lỗi khi tải model: {e}")
    print("Vui lòng kiểm tra lại đường dẫn và đảm bảo file 'best.pt' không bị lỗi.")
    exit()

# --- BƯỚC 2: CHỈ ĐỊNH NGUỒN DỮ LIỆU ĐỂ DỰ ĐOÁN ---
# ⚠️ THAY ĐỔI DÒNG NÀY:
# Thay bằng đường dẫn tới ảnh/video của bạn, hoặc '0' để dùng webcam.
source = '../data/dicom_TRUONG THAI HOA_58T_25039391_309'  # Ví dụ: '0' cho webcam, 'path/to/video.mp4' cho video, 'path/to/image.jpg' cho ảnh

try:
    print(f"Đang chạy dự đoán trên nguồn: {source}")
    # Chạy dự đoán, stream=True sẽ hiệu quả hơn cho video/webcam
    results = model(source, stream=True)
except Exception as e:
    print(f"Lỗi trong quá trình dự đoán: {e}")
    exit()

# --- BƯỚC 3: XỬ LÝ VÀ HIỂN THỊ KẾT QUẢ ---
print("Đã xử lý xong. Nhấn phím 'q' trên cửa sổ ảnh để thoát.")
# Lặp qua từng kết quả (từng frame trong video/webcam)
for r in results:
    # Lấy ảnh có các hộp bao đã được vẽ lên
    annotated_frame = r.plot()

    # Hiển thị ảnh kết quả ra màn hình
    cv2.imshow("YOLOv8 Inference - best.pt", annotated_frame)

    # Đợi 1 mili-giây và kiểm tra xem người dùng có nhấn phím 'q' không
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Dọn dẹp sau khi thoát
cv2.destroyAllWindows()
print("Đã đóng chương trình.")