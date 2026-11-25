
# Câu 1.4. Trạng thái hoạt động của Container, trạng thái sức khỏe ứng dụng và khả năng thực hiện nghiệp vụ

## 1. Trạng thái hoạt động của Container

Trạng thái Container thể hiện vòng đời hoạt động của một Docker Container.

Các trạng thái thường gặp:

| Trạng thái | Ý nghĩa |
|---|---|
| Created | Container đã được tạo nhưng chưa khởi chạy |
| Running | Container đang chạy |
| Paused | Container đang bị tạm dừng |
| Restarting | Container đang được khởi động lại |
| Exited | Container đã dừng hoạt động |
| Dead | Container gặp lỗi nghiêm trọng và không thể hoạt động bình thường |
| Removing | Container đang trong quá trình xóa |

Ví dụ: Khi Docker chạy Product Service thành công, Container có trạng thái `Running`.

## 2. Trạng thái sức khỏe của ứng dụng (Application Health)

Trạng thái sức khỏe ứng dụng thể hiện khả năng hoạt động của ứng dụng bên trong Container.

Thông thường có các trạng thái:

| Trạng thái | Ý nghĩa |
|---|---|
| Starting | Ứng dụng đang khởi động, chưa hoàn thành kiểm tra sức khỏe |
| Healthy | Ứng dụng hoạt động bình thường theo các điều kiện Health Check |
| Unhealthy | Ứng dụng không vượt qua các lần kiểm tra sức khỏe |

Một Container có thể ở trạng thái Running nhưng ứng dụng bên trong vẫn Unhealthy.

Ví dụ: Product Service đã chạy nhưng không kết nối được đến MySQL. Khi đó Container vẫn có thể Running, nhưng ứng dụng không hoạt động bình thường.

Đối với Spring Boot, có thể sử dụng Spring Boot Actuator để cung cấp các endpoint kiểm tra sức khỏe như:

`/actuator/health`

Endpoint này giúp kiểm tra tình trạng ứng dụng và các thành phần phụ thuộc đã được tích hợp Health Indicator.

## 3. Khả năng thực hiện nghiệp vụ của hệ thống

Đây là mức đánh giá cao hơn trạng thái Container và Application Health.

Nó thể hiện hệ thống có thực sự thực hiện được chức năng nghiệp vụ mà người dùng yêu cầu hay không.

Ví dụ trong Shop Meal:
- Người dùng đăng nhập thành công.
- Người dùng tìm kiếm sản phẩm.
- Người dùng thêm sản phẩm vào giỏ hàng.
- Người dùng tạo đơn hàng.
- Người dùng thanh toán thành công.

Một dịch vụ có thể ở trạng thái Running và Healthy nhưng vẫn không thực hiện được nghiệp vụ.

Ví dụ: Product Service vẫn hoạt động và kết nối được MySQL, nhưng API tìm kiếm sản phẩm bị lỗi do Search Service gặp sự cố.

Do đó, cần kết hợp kiểm tra sức khỏe kỹ thuật và kiểm tra nghiệp vụ thực tế.

## 4. Phân biệt ba mức trạng thái

| Tiêu chí | Container Status | Application Health | Business Function |
|---|---|---|---|
| Đánh giá | Docker Container | Ứng dụng | Chức năng nghiệp vụ |
| Kiểm tra | Container có chạy không? | Ứng dụng có khỏe không? | Nghiệp vụ có thực hiện được không? |
| Ví dụ | Running | Healthy | Đặt hàng thành công |
| Công cụ | docker ps | Health Check, Actuator | API test, Integration Test |
| Phạm vi | Hạ tầng | Ứng dụng | Toàn bộ quy trình nghiệp vụ liên quan |

## 5. Vai trò của Health Check

Health Check là cơ chế kiểm tra định kỳ trạng thái sức khỏe của ứng dụng hoặc dịch vụ.

Vai trò:
- Phát hiện ứng dụng không phản hồi.
- Phát hiện dịch vụ không thể kết nối đến các thành phần phụ thuộc.
- Giúp Docker xác định Container đang Healthy hay Unhealthy.
- Hỗ trợ quản lý việc khởi động và phụ thuộc giữa các dịch vụ.
- Giúp hệ thống giám sát và xử lý sự cố kịp thời.

Ví dụ cấu hình Health Check trong Docker Compose cho Product Service:

```yaml
product-service:
  image: shop-meal/product-service:latest
  ports:
    - "8083:8083"
  healthcheck:
    test: ["CMD-SHELL", "curl -fsS http://localhost:8083/actuator/health || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
```

Trong đó:
- test: Lệnh kiểm tra sức khỏe ứng dụng.
- interval: Khoảng thời gian giữa hai lần kiểm tra.
- timeout: Thời gian chờ tối đa cho mỗi lần kiểm tra.
- retries: Số lần kiểm tra thất bại liên tiếp để đánh dấu Unhealthy.
- start_period: Khoảng thời gian dành cho ứng dụng khởi động.

Lưu ý: Cấu hình này yêu cầu ứng dụng có Spring Boot Actuator, đã bật endpoint health và Image có công cụ curl.

## 6. Vai trò của Log

Log là cơ chế ghi lại các sự kiện xảy ra trong quá trình hoạt động của ứng dụng.

Vai trò:
- Theo dõi quá trình hoạt động của Microservice.
- Phát hiện và phân tích lỗi.
- Theo dõi request và response.
- Hỗ trợ tìm nguyên nhân khi xảy ra sự cố.
- Phục vụ việc giám sát và bảo trì hệ thống.

Ví dụ trong Shop Meal:
- Identity Service ghi log khi người dùng đăng nhập thất bại.
- Product Service ghi log khi truy vấn MySQL gặp lỗi.
- Order Service ghi log khi gọi Payment Service thất bại.
- Gateway ghi log khi request bị từ chối hoặc xảy ra lỗi định tuyến.

Các lệnh xem Log:

```bash
# Xem log của Container
docker logs product-service

# Theo dõi Log liên tục
docker logs -f product-service

# Xem 100 dòng Log gần nhất
docker logs --tail 100 product-service

# Xem Log kèm thời gian
docker logs -t product-service
```

Trong hệ thống Microservices lớn, có thể sử dụng ELK Stack hoặc các công cụ giám sát tập trung để thu thập và phân tích Log từ nhiều dịch vụ.

## 7. Vai trò của Docker Volume

Docker Volume là cơ chế lưu trữ dữ liệu độc lập với vòng đời của Container.

Thông thường, dữ liệu được ghi trực tiếp trong filesystem của Container có thể bị mất khi Container bị xóa.

Volume giúp dữ liệu được lưu trữ bên ngoài vòng đời của Container.

Vai trò:
- Bảo vệ dữ liệu khi Container bị xóa hoặc tạo lại.
- Lưu trữ dữ liệu lâu dài.
- Chia sẻ dữ liệu giữa các Container khi cần thiết.
- Hỗ trợ sao lưu và phục hồi dữ liệu.
- Tách dữ liệu khỏi môi trường chạy ứng dụng.

Ví dụ trong Shop Meal:
- MySQL Volume lưu trữ dữ liệu người dùng, sản phẩm và đơn hàng.
- MongoDB Volume lưu trữ dữ liệu bài viết hoặc thông tin file.
- Elasticsearch Volume lưu trữ dữ liệu tìm kiếm.
- MinIO Volume lưu trữ các file và hình ảnh.

Ví dụ cấu hình Volume:

```yaml
services:
  mysql:
    image: mysql:8
    container_name: shop-meal-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: identity_db
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Trong ví dụ này, dữ liệu MySQL được lưu trong Volume `mysql_data`. Khi Container MySQL bị xóa và tạo lại, dữ liệu vẫn được giữ lại nếu Volume không bị xóa.

**Lưu ý:** `docker compose down` mặc định không xóa named volume. Tuy nhiên, `docker compose down -v` sẽ xóa các Volume được khai báo trong Compose và có thể làm mất dữ liệu.

## 8. Liên hệ thực tế với hệ thống Shop Meal

Trong hệ thống Shop Meal, các Microservices được triển khai bằng Docker Container.

Để đảm bảo hệ thống hoạt động ổn định, cần kết hợp:

- **Container Status:** Kiểm tra các Container của Identity, Product, Order, Payment và những dịch vụ khác có đang chạy hay không.
- **Application Health:** Sử dụng Spring Boot Actuator để kiểm tra sức khỏe từng Microservice.
- **Business Function:** Kiểm tra các quy trình quan trọng như đăng nhập, tìm kiếm sản phẩm, đặt hàng và thanh toán.
- **Health Check:** Phát hiện dịch vụ không hoạt động bình thường.
- **Log:** Ghi nhận và phân tích lỗi giữa các Microservices.
- **Volume:** Đảm bảo dữ liệu MySQL, MongoDB, Elasticsearch và MinIO được lưu trữ lâu dài.

**Kết luận:** Container Running không đồng nghĩa với ứng dụng Healthy, và ứng dụng Healthy cũng không đảm bảo mọi nghiệp vụ đều thành công. Vì vậy, khi vận hành hệ thống Microservices cần kiểm tra đồng thời trạng thái Container, sức khỏe ứng dụng và khả năng thực hiện nghiệp vụ. Health Check giúp phát hiện lỗi, Log giúp tìm nguyên nhân, còn Volume giúp bảo vệ dữ liệu lâu dài.
