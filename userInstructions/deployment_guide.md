# Hướng dẫn Triển khai Cơ bản (Sử dụng Docker Compose trên Linux)

Hướng dẫn này mô tả các bước cơ bản để triển khai ứng dụng Tarot Backend lên một máy chủ Linux sử dụng Docker và Docker Compose.

**Yêu cầu:**

*   Một máy chủ Linux (ví dụ: Ubuntu, CentOS) có quyền truy cập SSH và `sudo`.
*   Đã cài đặt Git trên máy chủ.
*   Tên miền (tùy chọn, nếu muốn truy cập qua domain thay vì IP).
*   Reverse Proxy (như Nginx) được cài đặt và cấu hình trên máy chủ (khuyến nghị mạnh mẽ cho production, đặc biệt là để xử lý HTTPS).

**Các bước thực hiện:**

1.  **Cài đặt Docker và Docker Compose:**
    *   Kết nối vào máy chủ qua SSH.
    *   Làm theo hướng dẫn chính thức để cài đặt Docker Engine và Docker Compose Plugin cho hệ điều hành Linux của bạn.
        *   Docker Engine: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/) (Chọn bản phân phối Linux của bạn)
        *   Docker Compose: Thường được cài đặt cùng Docker Engine dưới dạng plugin (`docker compose`). Kiểm tra bằng `docker compose version`.

2.  **Sao chép Mã nguồn:**
    *   Clone repository dự án vào một thư mục trên máy chủ:
        ```bash
        git clone https://github.com/NguyenQS504092s/Tarot-Website-Backend-.git
        cd Tarot-Website-Backend-
        ```
    *   (Tùy chọn) Checkout nhánh/tag cụ thể nếu cần: `git checkout <branch_or_tag_name>`

3.  **Cấu hình Biến Môi Trường:**
    *   **KHÔNG** sao chép tệp `.env` từ local lên server production.
    *   Tạo một tệp `.env` mới trên máy chủ trong thư mục gốc của dự án:
        ```bash
        nano .env
        ```
    *   Thêm các biến môi trường **BẮT BUỘC** và các biến tùy chọn cần thiết cho môi trường production. Tham khảo phần "Environment Variables Overview" trong `README.md`. Ví dụ tối thiểu:
        ```env
        NODE_ENV=production
        PORT=5005 # Cổng nội bộ container, không phải cổng public
        MONGODB_URI=mongodb://mongo:27017/tarot_prod # Kết nối tới service 'mongo' trong Docker Compose
        JWT_SECRET=your_production_strong_jwt_secret # *** THAY BẰNG KHÓA BÍ MẬT MẠNH ***
        # Thêm các biến khác nếu cần (CORS_ORIGIN, FRONTEND_URL, STRIPE nếu dùng...)
        ```
    *   **Quan trọng:** Sử dụng một `JWT_SECRET` mạnh và khác với môi trường development. Đảm bảo `MONGODB_URI` trỏ đúng vào service MongoDB trong mạng Docker (thường là tên service, ví dụ `mongo`).

4.  **Build và Khởi chạy Container:**
    *   Từ thư mục gốc của dự án, chạy lệnh sau:
        ```bash
        sudo docker compose up --build -d
        ```
        *   `sudo`: Có thể cần thiết tùy thuộc vào cấu hình Docker của bạn.
        *   `--build`: Build lại image nếu có thay đổi trong `Dockerfile`.
        *   `-d`: Chạy container ở chế độ detached (chạy nền).

5.  **Kiểm tra Trạng thái:**
    *   Kiểm tra xem các container đã khởi động và đang chạy chưa:
        ```bash
        sudo docker compose ps
        ```
    *   Bạn nên thấy `tarot_backend_app` và `tarot_mongo_db` đang ở trạng thái `Up` và `tarot_backend_app` có trạng thái `(healthy)` sau một khoảng thời gian (do cấu hình healthcheck).
    *   Kiểm tra logs nếu có vấn đề:
        ```bash
        sudo docker compose logs tarot-backend
        sudo docker compose logs mongo
        ```

6.  **(Khuyến nghị) Cấu hình Reverse Proxy (ví dụ: Nginx):**
    *   Cài đặt Nginx nếu chưa có: `sudo apt update && sudo apt install nginx` (Ubuntu) hoặc tương đương.
    *   Tạo một file cấu hình server block cho ứng dụng của bạn (ví dụ: `/etc/nginx/sites-available/tarot-backend`):
        ```nginx
        server {
            listen 80; # Nghe cổng 80 cho HTTP
            # listen 443 ssl http2; # Bỏ comment nếu dùng HTTPS
            server_name your_domain.com www.your_domain.com; # Thay bằng domain của bạn hoặc IP server

            # Cấu hình SSL (nếu dùng HTTPS, ví dụ với Certbot)
            # ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
            # ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;
            # include /etc/letsencrypt/options-ssl-nginx.conf;
            # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

            location / {
                proxy_pass http://localhost:5005; # Chuyển tiếp tới cổng host được map bởi Docker
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_cache_bypass $http_upgrade;
            }
        }
        ```
    *   Tạo symbolic link để kích hoạt cấu hình:
        ```bash
        sudo ln -s /etc/nginx/sites-available/tarot-backend /etc/nginx/sites-enabled/
        ```
    *   Kiểm tra cú pháp Nginx: `sudo nginx -t`
    *   Khởi động lại Nginx: `sudo systemctl restart nginx`
    *   Bây giờ bạn có thể truy cập ứng dụng qua cổng 80 (hoặc 443 nếu dùng HTTPS) của server thay vì cổng 5005.

7.  **Cập nhật Ứng dụng:**
    *   Pull thay đổi mới nhất từ Git: `git pull origin <branch_name>`
    *   Build lại và khởi động lại container: `sudo docker compose up --build -d`

**Lưu ý:**

*   Đây là hướng dẫn cơ bản. Môi trường production thực tế có thể yêu cầu các cấu hình phức tạp hơn về bảo mật, logging, monitoring, và backup.
*   Luôn đảm bảo an toàn cho các khóa bí mật (JWT_SECRET, Stripe keys, v.v.).
*   Xem xét việc sử dụng managed database thay vì chạy MongoDB trong container cho production.
