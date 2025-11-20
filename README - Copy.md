# FBP - Filter Back-Projection Platform

## Cấu trúc thư mục mới

```
FBP/
├── index.html                      # File redirect đến trang chủ
├── assets/                         # Thư mục chứa hình ảnh, media
├── components/                     # Components dùng chung
│   ├── buttons.css                # Các kiểu button
│   ├── header.css                 # Dynamic Island Header
│   ├── footer.css                 # Footer component
│   └── cards.css                  # Card components
│
├── pages/                          # Các trang của website
│   ├── home/                      # Trang chủ
│   │   ├── index.html
│   │   ├── home.css
│   │   └── home.js
│   │
│   ├── theory/                    # Trang lý thuyết
│   │   ├── index.html
│   │   ├── theory.css
│   │   └── theory.js
│   │
│   ├── simulation/                # Trang mô phỏng
│   │   ├── index.html
│   │   ├── simulation.css
│   │   └── simulation.js
│   │
│   ├── exercises/                 # Trang bài tập
│   │   ├── index.html
│   │   ├── exercises.css
│   │   └── exercises.js
│   │
│   ├── about/                     # Trang giới thiệu
│   │   ├── index.html
│   │   ├── about.css
│   │   └── about.js
│   │
│   └── contact/                   # Trang liên hệ
│       ├── index.html
│       ├── contact.css
│       └── contact.js
│
└── homepage/                      # Thư mục cũ (có thể xóa sau khi kiểm tra)
    ├── index.html
    ├── main.js
    ├── mophong.html
    ├── styles.css
    └── theory.html
```

## Quy ước đặt tên

### Thư mục
- Mỗi page có một thư mục riêng trong `/pages/`
- Tên thư mục: chữ thường, không dấu, dùng gạch ngang nếu có nhiều từ
- VD: `home`, `theory`, `simulation`, `exercises`

### File
- Mỗi page có 3 file chính:
  - `index.html` - Nội dung HTML
  - `[page-name].css` - Style riêng của page
  - `[page-name].js` - JavaScript riêng của page

### Components
- Các component dùng chung được đặt trong `/components/`
- Import vào page qua thẻ `<link>` với đường dẫn tương đối
- VD: `<link rel="stylesheet" href="../../components/buttons.css" />`

## Cách sử dụng

### 1. Truy cập website
- Mở file `index.html` ở thư mục gốc
- Hoặc truy cập trực tiếp: `pages/home/index.html`

### 2. Tạo page mới
```
1. Tạo thư mục mới trong /pages/
2. Tạo 3 file: index.html, [name].css, [name].js
3. Import components cần thiết
4. Cập nhật navigation links trong header
```

### 3. Sử dụng components
```html
<!-- Import components -->
<link rel="stylesheet" href="../../components/buttons.css" />
<link rel="stylesheet" href="../../components/header.css" />
<link rel="stylesheet" href="../../components/footer.css" />
<link rel="stylesheet" href="../../components/cards.css" />
```

### 4. Navigation giữa các trang
```html
<!-- Từ home sang theory -->
<a href="../theory/index.html">Lý thuyết</a>

<!-- Từ theory về home -->
<a href="../home/index.html">Trang chủ</a>
```

## Các trang đã hoàn thành

✅ **Home Page** (`pages/home/`)
- Hero section với gradient
- Getting Started với 2 cột
- About Us section
- Theory preview cards
- Features grid
- Full responsive

✅ **Theory Page** (`pages/theory/`)
- Hero với breadcrumb
- Table of Contents
- Sidebar navigation
- Article content với styling
- Math formulas, timelines
- Resources section

⏳ **Đang phát triển:**
- Simulation page
- Exercises page
- About page
- Contact page

## Components có sẵn

### Buttons (buttons.css)
- `.btn-primary` - Button chính
- `.btn-secondary` - Button phụ
- `.btn-outline` - Button viền
- `.btn-small` / `.btn-large` - Kích thước
- `.btn-auth` - Button đăng nhập/đăng ký
- `.btn-link` - Link dạng button

### Cards (cards.css)
- `.card` - Card cơ bản
- `.icon-card` - Card với icon
- `.feature-card` - Feature card
- `.step-card` - Step card với số
- `.theory-card` - Theory card
- `.badge` - Badge nhỏ

### Header (header.css)
- `.dynamic-header` - Header dạng Dynamic Island
- `.header-container` - Container
- `.header-nav` - Navigation menu
- `.nav-link` - Link trong nav

### Footer (footer.css)
- `.footer` - Footer component
- `.footer-grid` - Grid layout 4 cột
- `.footer-brand` - Branding
- `.footer-social` - Social links

## Tính năng chính

### JavaScript
1. **Smooth Scroll** - Cuộn mượt khi click nav
2. **Scroll Spy** - Highlight active section
3. **Mobile Menu** - Responsive menu
4. **Scroll Reveal** - Animation khi scroll
5. **Counter Animation** - Đếm số thống kê
6. **Parallax Effect** - Hiệu ứng parallax

### CSS
1. **Responsive Design** - Tương thích mọi màn hình
2. **Dark Theme** - Theme tối chuyên nghiệp
3. **Gradient Colors** - Màu gradient đẹp mắt
4. **Animations** - Hiệu ứng mượt mà
5. **Typography** - Font chữ đẹp và dễ đọc

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License
© 2025 FBP. All rights reserved.
"# FBP" 
"# FBP" 
"# FBP---Filter-Back-Projection-Platform" 
"# FBP---Filter-Back-Projection-Platform" 
"# FILTER-BACK-PROJECTION" 
"# FILTER-BACK-PROJECTION" 
"# FILTER-BACK-PROJECTION" 
"# FILTER-BACK-PROJECTION" 
"# FILTER-BACK-PROJECTION" 
"# FILTER-BACK-PROJECTION" 
"# FILTER-BACK-PROJECTION" 
