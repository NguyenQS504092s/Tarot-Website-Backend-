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

3.  **Cấu hình Biến Môi Trường cho Production:**
    *   **CỰC KỲ QUAN TRỌNG:** Không bao giờ commit hoặc sao chép tệp `.env` chứa các bí mật production (như `JWT_SECRET`, `MONGODB_URI` có thông tin đăng nhập, Stripe keys) vào hệ thống kiểm soát phiên bản (Git) hoặc lên máy chủ production dưới dạng file `.env` thông thường.
    *   Sử dụng các phương thức quản lý bí mật an toàn được cung cấp bởi nền tảng triển khai của bạn (ví dụ: Docker Secrets, Kubernetes Secrets, biến môi trường của các dịch vụ cloud như AWS Elastic Beanstalk, Heroku Config Vars, Vercel Environment Variables, etc.).
    *   Nếu bạn đang triển khai trên máy chủ riêng và sử dụng Docker Compose, cách an toàn hơn là định nghĩa các biến môi trường trực tiếp trong file `docker-compose.yml` (sử dụng `environment` hoặc `env_file` trỏ đến file bên ngoài Git) hoặc sử dụng Docker Secrets nếu phiên bản Docker Compose hỗ trợ. **Tuyệt đối không để file `.env` chứa bí mật production trong cùng thư mục với `docker-compose.yml` khi commit lên Git.**
    *   Xác định và cấu hình các biến môi trường sau cho môi trường production:
        *   `NODE_ENV`: Phải được đặt là `production`.
        *   `PORT`: Cổng nội bộ mà ứng dụng Node.js lắng nghe bên trong container (mặc định 5005). Cổng này sẽ được ánh xạ ra ngoài bởi Docker hoặc Reverse Proxy.
        *   `MONGODB_URI`: **(Bí mật nhạy cảm)** Chuỗi kết nối đầy đủ đến cơ sở dữ liệu MongoDB production của bạn. Nếu DB yêu cầu xác thực (rất khuyến nghị cho production), hãy bao gồm thông tin đăng nhập: `mongodb://<username>:<password>@your_mongo_host:27017/tarot_prod?authSource=admin`. **Không bao giờ hardcode thông tin đăng nhập trực tiếp trong file cấu hình.**
        *   `JWT_SECRET`: **(Bí mật cực kỳ nhạy cảm)** Một chuỗi ngẫu nhiên, dài và mạnh dùng để ký JWT. Tạo một secret duy nhất cho production (tham khảo `userInstructions/generate_jwt_secret.txt` để tạo, nhưng **không sử dụng lại secret của dev**).
        *   `CORS_ORIGIN`: **(Quan trọng cho bảo mật)** URL cụ thể của ứng dụng frontend production của bạn (ví dụ: `https://your-frontend-domain.com`). Nếu có nhiều domain, sử dụng dấu phẩy để phân tách (ví dụ: `https://domain1.com,https://domain2.com`). **Không bao giờ sử dụng `*` trong production.**
        *   Các biến môi trường tùy chọn khác như `FRONTEND_URL`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `PERFORMANCE_THRESHOLD_MS`, `API_PREFIX`, `FREE_READINGS_PER_DAY`.
        *   Nếu kích hoạt lại thanh toán Stripe, bạn cần cấu hình `STRIPE_SECRET_KEY` và `STRIPE_WEBHOOK_SECRET` (cũng là các bí mật cực kỳ nhạy cảm).

    *   **Ví dụ (Sử dụng biến môi trường trực tiếp trong `docker-compose.yml` - chỉ là ví dụ, phương thức an toàn hơn là dùng Docker Secrets):**
        ```yaml
        services:
          tarot-backend:
            # ... other configurations ...
            environment:
              - NODE_ENV=production
              - PORT=5005
              - MONGODB_URI=mongodb://mongo:27017/tarot_prod # Thay bằng chuỗi kết nối production
              - JWT_SECRET=your_production_strong_jwt_secret # Thay bằng secret production
              - CORS_ORIGIN=https://your-frontend-domain.com # Thay bằng URL frontend production
              # Thêm các biến khác
            # ...
        ```
    *   **Lưu ý:** Nếu bạn sử dụng file `.env` trên server production (chỉ khi không có lựa chọn nào khác tốt hơn), hãy đảm bảo file này **không** được đưa vào Git và chỉ tồn tại trên server.

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

7.  **Cập nhật Ứng dụng (Sử dụng CI/CD):**
    *   Với CI/CD Pipeline (ví dụ: GitHub Actions) đã thiết lập, quá trình cập nhật ứng dụng sẽ tự động hơn.
    *   Khi bạn push code lên nhánh `main` (hoặc nhánh được cấu hình trong workflow), GitHub Actions sẽ tự động build, test và push Docker image mới lên registry.
    *   Bước deploy (nếu được cấu hình trong workflow) sẽ tự động kết nối đến máy chủ của bạn, pull image mới và khởi động lại container.
    *   Nếu bạn chưa cấu hình bước deploy tự động, bạn sẽ cần SSH vào máy chủ và chạy lệnh pull/restart thủ công sau khi CI/CD hoàn thành:
        ```bash
        cd /path/to/your/app # Thay bằng đường dẫn trên server
        sudo docker compose pull tarot-backend # Pull image mới nhất từ registry
        sudo docker compose up -d --force-recreate # Khởi động lại container với image mới
        sudo docker image prune -f # Dọn dẹp image cũ không dùng nữa
        ```

**CI/CD Pipeline (GitHub Actions):**

*   Dự án đã được cấu hình một workflow CI/CD cơ bản sử dụng GitHub Actions trong file `.github/workflows/ci-cd.yml`.
*   Workflow này sẽ tự động chạy khi có push hoặc pull request đến nhánh `main`.
*   Các bước bao gồm: Checkout code, Setup Node.js, Install dependencies, Run tests, Build Docker image, Login to Docker Registry, Push Docker image.
*   Bước deploy tự động đã được phác thảo nhưng đang bị comment lại. Bạn cần tùy chỉnh và bỏ comment phần này để kích hoạt deploy tự động, dựa trên môi trường triển khai cụ thể của bạn (ví dụ: cấu hình SSH secrets trong repository GitHub).

**Các Bước Kiểm tra Cuối cùng trước Triển khai:**

*   **Kiểm tra Biến Môi Trường Production:** Đảm bảo tất cả các biến môi trường cần thiết (`NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, v.v.) đã được cấu hình chính xác và an toàn trên môi trường production.
*   **Kiểm tra Kết nối Database:** Xác nhận ứng dụng có thể kết nối thành công đến cơ sở dữ liệu production.
*   **Kiểm tra Logging:** Đảm bảo log được ghi ra console (stdout/stderr) và được thu thập bởi hệ thống quản lý log của bạn.
*   **Kiểm tra Health Check:** Xác nhận health check endpoint (`/health`) hoạt động đúng và Docker Compose/hệ thống orchestration nhận diện container là healthy.
*   **Kiểm tra Chức năng Cơ bản:** Thực hiện các kiểm tra thủ công hoặc tự động cơ bản trên môi trường production để xác nhận các API chính (đăng ký, đăng nhập, lấy dữ liệu bài, v.v.) hoạt động như mong đợi.
*   **Kiểm tra Bảo mật:** Xác nhận CORS chỉ cho phép các domain frontend hợp lệ, rate limiting hoạt động, và các header bảo mật từ Helmet được áp dụng.
*   **Kiểm tra Hiệu suất (Tùy chọn):** Nếu có thể, thực hiện kiểm tra hiệu suất cơ bản để đảm bảo ứng dụng đáp ứng đủ nhanh.

**Lưu ý Chung:**

*   Đây là hướng dẫn cơ bản. Môi trường production thực tế có thể yêu cầu các cấu hình phức tạp hơn về bảo mật, logging, monitoring, và backup.
*   Luôn đảm bảo an toàn cho các khóa bí mật (JWT_SECRET, Stripe keys, v.v.).
*   Xem xét việc sử dụng managed database thay vì chạy MongoDB trong container cho production.
*   Việc cấu hình deploy tự động trong CI/CD cần được thực hiện cẩn thận và kiểm tra kỹ lưỡng.
