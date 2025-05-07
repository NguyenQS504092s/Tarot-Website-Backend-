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
    *   **CỰC KỲ QUAN TRỌNG:** Không bao giờ commit tệp `.env` chứa các bí mật production (như `JWT_SECRET`, `MONGODB_URI` có thông tin đăng nhập, Stripe keys) vào Git.
    *   **Phương pháp khuyến nghị:** Tạo một tệp riêng biệt trên máy chủ production (ví dụ: `/etc/tarot-app/.env.prod` hoặc một vị trí an toàn khác **bên ngoài** thư mục dự án được clone từ Git). Đặt tất cả các biến môi trường production vào tệp này. Sau đó, tham chiếu đến tệp này trong `docker-compose.yml` bằng cách sử dụng `env_file`.
        ```yaml
        # Ví dụ trong docker-compose.yml
        services:
          tarot-backend:
            # ... other configurations ...
            env_file:
              - /etc/tarot-app/.env.prod # Đường dẫn đến file env trên server
            # ...
        ```
        Đảm bảo tệp này có quyền đọc phù hợp cho người dùng chạy Docker.
    *   **Các phương pháp khác:** Docker Secrets (an toàn nhất nhưng phức tạp hơn), biến môi trường hệ thống trên máy chủ. Tránh định nghĩa bí mật trực tiếp trong `environment` của `docker-compose.yml` nếu có thể.
    *   **Các biến môi trường cần thiết cho Production:**
        *   `NODE_ENV`: `production`
        *   `PORT`: `5005` (Cổng nội bộ container, không cần thay đổi trừ khi có lý do đặc biệt)
        *   `MONGODB_URI`: **(Bí mật nhạy cảm)** Chuỗi kết nối đầy đủ đến MongoDB production. **Rất khuyến nghị** sử dụng MongoDB Atlas hoặc một managed database khác thay vì chạy MongoDB trong container cùng ứng dụng cho production. Nếu dùng Atlas, chuỗi kết nối sẽ có dạng `mongodb+srv://<username>:<password>@yourcluster.mongodb.net/tarot_prod?retryWrites=true&w=majority`.
        *   `JWT_SECRET`: **(Bí mật cực kỳ nhạy cảm)** Chuỗi ngẫu nhiên, dài, mạnh. Tạo secret mới cho production (xem `userInstructions/generate_jwt_secret.txt`).
        *   `CORS_ORIGIN`: **(Quan trọng)** URL của frontend production (ví dụ: `https://your-frontend.com`). Không dùng `*`.
        *   (Tùy chọn) `FRONTEND_URL`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, etc.
        *   (Nếu dùng Stripe) `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (Bí mật nhạy cảm).

    *   **(Khuyến nghị) Bật Xác thực MongoDB:**
        *   Nếu bạn tự host MongoDB (kể cả trong Docker), **hãy bật chế độ xác thực** cho production.
        *   Trong `docker-compose.yml`, bỏ comment và đặt giá trị cho `MONGO_INITDB_ROOT_USERNAME` và `MONGO_INITDB_ROOT_PASSWORD` cho service `mongo`. **Quản lý các giá trị này như bí mật!**
        *   Cập nhật `MONGODB_URI` trong file biến môi trường của backend để bao gồm username/password: `mongodb://<username>:<password>@mongo:27017/tarot_prod?authSource=admin`.

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
    *   Bạn nên thấy `tarot_backend_app` và `tarot_mongo_db` (nếu chạy cùng) đang ở trạng thái `Up`. `tarot_backend_app` sẽ có trạng thái `(health: starting)` ban đầu và chuyển sang `(healthy)` sau khi health check thành công. (Lưu ý: Chúng ta đã bỏ healthcheck cho `mongo` để khắc phục sự cố khởi động trước đó).
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
            # RẤT KHUYẾN NGHỊ: Bật HTTPS cho production
            listen 443 ssl http2; # Nghe cổng 443 cho HTTPS
            listen [::]:443 ssl http2; # Cho IPv6
            server_name your_domain.com www.your_domain.com; # Thay bằng domain của bạn

            # Cấu hình SSL (Sử dụng Certbot để lấy chứng chỉ miễn phí)
            # Xem hướng dẫn Certbot: https://certbot.eff.org/instructions
            ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem; # Đường dẫn Certbot cung cấp
            ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem; # Đường dẫn Certbot cung cấp
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
        sudo docker compose pull tarot-backend # Pull image mới nhất từ registry (Đảm bảo tên service là 'tarot-backend')
        sudo docker compose up -d --force-recreate tarot-backend # Khởi động lại chỉ service backend
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
*   **Rất khuyến nghị** sử dụng managed database (như MongoDB Atlas) thay vì chạy MongoDB trong container cho production để đảm bảo tính sẵn sàng, backup và bảo mật tốt hơn.
*   Việc cấu hình deploy tự động trong CI/CD cần được thực hiện cẩn thận và kiểm tra kỹ lưỡng trên môi trường staging trước khi áp dụng cho production.
