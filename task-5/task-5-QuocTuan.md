# SHOP-MEAL — TASK-5: DISCOVERY SERVICE & FRONTEND REACT + TYPESCRIPT

## 1. Tổng quan

### 1.1. Mục tiêu

Xây dựng và hoàn thiện Discovery Service cùng Frontend cho hệ thống Shop-Meal theo kiến trúc Microservices.

- **Discovery Service:** Quản lý đăng ký và khám phá các microservice bằng Netflix Eureka, giúp các service có thể tìm thấy nhau thông qua service registry.
- **Frontend React + TypeScript:** Xây dựng giao diện người dùng cho hệ thống đặt món ăn, tích hợp với backend thông qua API Gateway, hỗ trợ xác thực, xem sản phẩm, quản lý giỏ hàng, đặt hàng, thanh toán và quản lý bài viết.

### 1.2. Phạm vi công việc

| Thành phần | Nhiệm vụ |
|---|---|
| Discovery Service | Đăng ký và khám phá các microservice |
| API Gateway | Định tuyến request từ frontend đến backend |
| Frontend | Giao diện khách hàng, quản lý tài khoản và quy trình mua hàng |
| Identity Service | Đăng nhập, đăng ký và xác thực |
| Product Service | Danh sách và thông tin sản phẩm |
| Search Service | Tìm kiếm sản phẩm |
| Cart Service | Quản lý giỏ hàng |
| Post Service | Quản lý bài viết liên quan đến sản phẩm |
| Order Service | Quản lý đơn hàng |
| Payment Service | Tạo và theo dõi giao dịch thanh toán |
| Profile Service | Thông tin hồ sơ và người nhận |
| File Service | Tải lên và cung cấp hình ảnh |
| Notification Service | Thông báo cho người dùng |

## 2. Kiến trúc tổng thể

```text
                 React + TypeScript
                          |
                          | HTTP / HTTPS
                          v
                     API Gateway
                       :8888
                          |
              +-----------+-----------+
              |           |           |
              v           v           v
        Identity       Product       Search
        Service        Service       Service
              |
      +-------+---------+----------+
      |                 |          |
      v                 v          v
 Profile Service   Cart Service  Post Service
                         |
                         v
                    Order Service
                         |
                         v
                   Payment Service
                         |
                         v
                        PayOS

       Các microservice đăng ký với Eureka
                          |
                          v
                  Discovery Service
                       :8761
```

Sơ đồ mô tả quan hệ logic. Trong triển khai thực tế, các service có thể giao tiếp qua Eureka và OpenFeign, hoặc qua API Gateway tùy cách cấu hình. Frontend nên gọi backend thông qua API Gateway thay vì gọi trực tiếp từng microservice.

## 3. Discovery Service

### 3.1. Chức năng

Discovery Service cung cấp cơ chế đăng ký và khám phá dịch vụ cho hệ thống Shop-Meal.

Các nhiệm vụ:

- Khởi chạy Eureka Server.
- Cho phép các microservice đăng ký địa chỉ và trạng thái hoạt động.
- Cung cấp dashboard để theo dõi các instance đã đăng ký.
- Hỗ trợ các service khám phá nhau theo tên dịch vụ.
- Cấu hình để Discovery Service không tự đăng ký với chính nó nếu triển khai như một registry độc lập.
- Tích hợp với API Gateway và các service sử dụng Eureka Client.
- Cấu hình health check, thời gian lease và cơ chế retry phù hợp.

### 3.2. Công nghệ

- Java.
- Spring Boot.
- Spring Cloud Netflix Eureka Server.
- Spring Cloud Netflix Eureka Client.
- Maven.

Phiên bản Spring Boot và Spring Cloud phải tương thích với nhau và đồng bộ với các module hiện có trong repository.

### 3.3. Cấu hình Eureka Server

Ví dụ `application.yml`:

```yaml
server:
  port: 8761

spring:
  application:
    name: discovery-service

eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
  server:
    enable-self-preservation: true
```

Đây là cấu hình tham khảo. Nếu dự án đã có cấu hình Eureka Server hoạt động, cần giữ lại các thiết lập hiện có và chỉ bổ sung phần còn thiếu.

### 3.4. Cấu hình Eureka Client

Ví dụ cho một microservice:

```yaml
spring:
  application:
    name: product-service

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_SERVER_URL:http://localhost:8761/eureka/}
    register-with-eureka: true
    fetch-registry: true
```

Các service như `api-gateway`, `identity-service`, `profile-service`, `product-service`, `search-service`, `cart-service`, `post-service`, `order-service`, `payment-service`, `file-service` và `notification-service` cần được cấu hình theo cách tương ứng nếu sử dụng Eureka.

Tên trong `spring.application.name` cần thống nhất với tên được tham chiếu trong cấu hình định tuyến và OpenFeign.

### 3.5. Dashboard

Dashboard mặc định:

`http://localhost:8761`

Sau khi khởi động hệ thống, kiểm tra:

- Discovery Service hoạt động bình thường.
- Các microservice được đăng ký với tên đúng.
- Địa chỉ và port của từng instance chính xác.
- Không có service bị đăng ký lặp do cấu hình sai.
- Các service có thể khám phá nhau bằng tên dịch vụ nếu đã cấu hình client tương ứng.

### 3.6. Bảo mật và vận hành

- Không công khai dashboard Eureka ra Internet nếu chưa có cơ chế bảo vệ.
- Trong môi trường triển khai thực tế, cân nhắc xác thực, giới hạn truy cập mạng và HTTPS.
- Không sử dụng trạng thái đăng ký Eureka thay thế hoàn toàn cho kiểm tra sức khỏe ứng dụng.
- Cấu hình retry và timeout hợp lý khi một service chưa sẵn sàng.
- Khi triển khai nhiều instance, kiểm tra cách đăng ký địa chỉ IP/hostname và khả năng kết nối giữa các container hoặc máy chủ.

### 3.7. Tiêu chí nghiệm thu Discovery Service

- [ ] Eureka Server khởi động thành công.
- [ ] Dashboard truy cập được trong môi trường phát triển.
- [ ] Các service đã bật Eureka Client đăng ký thành công.
- [ ] Tên dịch vụ nhất quán trong toàn hệ thống.
- [ ] API Gateway có thể định tuyến đến các service theo cấu hình.
- [ ] Các service dùng OpenFeign có thể gọi nhau theo service name khi được cấu hình phù hợp.
- [ ] Cấu hình môi trường phát triển và môi trường triển khai được tách biệt.

## 4. Frontend React + TypeScript

### 4.1. Mục tiêu

Xây dựng giao diện web Shop-Meal để người dùng có thể duyệt món ăn, tìm kiếm sản phẩm, quản lý giỏ hàng, đặt hàng và thanh toán.

Frontend sử dụng React và TypeScript nhằm tăng khả năng tái sử dụng component, kiểm tra kiểu dữ liệu và duy trì cấu trúc mã nguồn khi dự án phát triển.

### 4.2. Công nghệ

- React.
- TypeScript.
- Vite.
- React Router.
- Material UI (MUI).
- Axios.
- Context API hoặc giải pháp quản lý trạng thái hiện có.
- CSS hoặc hệ thống style của MUI.
- ESLint và công cụ định dạng mã nếu đã cấu hình.

Cần kiểm tra phiên bản thực tế trong `package.json`. Không tự nâng cấp các dependency lớn nếu chưa xác minh tính tương thích.

### 4.3. Các chức năng giao diện

#### A. Trang chủ

- Hiển thị danh sách món ăn nổi bật.
- Hiển thị hình ảnh, tên và giá sản phẩm.
- Cho phép truy cập trang chi tiết sản phẩm.
- Điều hướng đến danh mục và kết quả tìm kiếm.
- Hiển thị thông tin bài viết hoặc nội dung nổi bật nếu có.

#### B. Xác thực người dùng

- Đăng ký tài khoản.
- Đăng nhập.
- Đăng xuất.
- Làm mới access token nếu backend hỗ trợ.
- Hiển thị thông tin tài khoản.
- Xử lý lỗi xác thực và hết hạn phiên đăng nhập.
- Bảo vệ các trang cần đăng nhập.

Frontend không được coi việc ẩn nút hoặc bảo vệ route là biện pháp phân quyền duy nhất. Backend vẫn phải xác thực và kiểm tra quyền trên mỗi API được bảo vệ.

#### C. Sản phẩm và tìm kiếm

- Hiển thị danh sách sản phẩm.
- Xem chi tiết sản phẩm.
- Tìm kiếm theo từ khóa.
- Lọc hoặc phân trang nếu backend hỗ trợ.
- Hiển thị trạng thái tải dữ liệu, không có dữ liệu và lỗi API.

Nếu Search Service nhận tham số `keyword`, frontend cần truyền đúng tên tham số theo hợp đồng API.

#### D. Giỏ hàng

- Thêm sản phẩm vào giỏ.
- Thay đổi số lượng.
- Xóa sản phẩm khỏi giỏ.
- Hiển thị ảnh, tên, đơn giá và số lượng.
- Hiển thị tổng tiền dự kiến.
- Kiểm tra giỏ hàng trước khi chuyển đến checkout.

Tổng tiền hiển thị ở frontend chỉ có tính chất tham khảo. Backend phải tự tính lại tổng tiền khi tạo đơn hàng.

#### E. Checkout và đặt hàng

- Nhập hoặc chọn thông tin người nhận.
- Kiểm tra dữ liệu đầu vào.
- Chọn phương thức COD hoặc PayOS.
- Gửi yêu cầu tạo đơn hàng.
- Hiển thị kết quả tạo đơn.
- Với PayOS, chuyển người dùng đến URL thanh toán do backend trả về.
- Tránh gửi lặp yêu cầu tạo đơn khi người dùng nhấn nút nhiều lần.

#### F. Đơn hàng

- Xem danh sách đơn hàng của người dùng.
- Xem chi tiết đơn hàng.
- Hiển thị trạng thái đơn hàng.
- Hiển thị trạng thái thanh toán riêng biệt.
- Hỗ trợ hủy đơn khi backend cho phép.

#### G. Hồ sơ cá nhân

- Xem thông tin người dùng.
- Cập nhật hồ sơ nếu API hỗ trợ.
- Quản lý thông tin nhận hàng.
- Hiển thị lỗi xác thực hoặc lỗi cập nhật rõ ràng.

#### H. Bài viết

- Hiển thị danh sách bài viết.
- Xem nội dung chi tiết.
- Hiển thị bài viết liên quan đến sản phẩm.
- Cho phép tạo, sửa hoặc xóa bài viết nếu người dùng có quyền.

#### I. Upload và hình ảnh

- Tải ảnh lên thông qua File Service hoặc API được cung cấp.
- Kiểm tra loại file và dung lượng ở giao diện để cải thiện trải nghiệm.
- Hiển thị trạng thái upload và lỗi.
- Backend vẫn phải kiểm tra loại file, kích thước và quyền truy cập.

#### J. Thông báo

- Hiển thị thông báo thành công hoặc thất bại.
- Hỗ trợ thông báo nghiệp vụ nếu Notification Service cung cấp API tương ứng.
- Không giả định có thông báo realtime nếu backend chưa triển khai cơ chế đó.

## 5. Cấu trúc thư mục Frontend

Cấu trúc tham khảo:

```text
web-app/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── product/
│   │   ├── cart/
│   │   └── order/
│   ├── pages/
│   │   ├── Home/
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Product/
│   │   ├── Search/
│   │   ├── Cart/
│   │   ├── Checkout/
│   │   ├── Orders/
│   │   ├── Profile/
│   │   └── Posts/
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── search.service.ts
│   │   ├── cart.service.ts
│   │   ├── order.service.ts
│   │   ├── payment.service.ts
│   │   ├── profile.service.ts
│   │   └── post.service.ts
│   ├── contexts/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── routes/
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Đây là cấu trúc gợi ý. Nếu repository hiện có cấu trúc khác, nên mở rộng theo cấu trúc hiện tại thay vì di chuyển toàn bộ mã nguồn không cần thiết.

## 6. Cấu hình API cho Frontend

### 6.1. Biến môi trường

Ví dụ `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8888/api/v1
VITE_SEARCH_URL=http://localhost:8888/api/v1/search
```

Các giá trị phải khớp với đường dẫn thực tế của API Gateway và Search Service. Không đưa thông tin bí mật của backend vào biến `VITE_*`, vì các biến này có thể xuất hiện trong bundle frontend.

### 6.2. Axios instance

Tạo một Axios instance dùng chung để quản lý base URL, timeout và các header cần thiết.

Ví dụ `src/services/api.ts`:

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
```

Đây là ví dụ tối giản. Cần điều chỉnh theo cơ chế lưu token, refresh token và logout hiện có của dự án. Nếu backend sử dụng cookie bảo mật, không nên mặc định chuyển sang lưu token trong `localStorage`; hãy thống nhất phương án xác thực phù hợp.

### 6.3. Quy tắc tích hợp

- Frontend gọi API Gateway thay vì truy cập trực tiếp từng microservice.
- Các endpoint và HTTP method phải khớp với controller backend.
- Kiểu dữ liệu TypeScript phải tương ứng với DTO của backend.
- Chuẩn hóa cách xử lý lỗi và thông báo.
- Xử lý token hết hạn và lỗi `401` theo một cơ chế thống nhất.
- Không tự động retry các request ghi dữ liệu nếu việc retry có thể tạo đơn hàng hoặc giao dịch trùng lặp.
- Cấu hình CORS tại backend/API Gateway phù hợp với origin của frontend.
- Trong môi trường production, dùng HTTPS và biến môi trường riêng cho từng môi trường.

## 7. Tích hợp Frontend với Backend

### 7.1. Đăng nhập

```text
Người dùng
    |
    v
Frontend Login
    |
    v
API Gateway
    |
    v
Identity Service
    |
    v
Trả kết quả xác thực
    |
    v
Frontend cập nhật trạng thái đăng nhập
```

Frontend cần xử lý cả trường hợp thành công, thông tin đăng nhập sai, tài khoản không hợp lệ và lỗi kết nối.

### 7.2. Tìm kiếm và xem sản phẩm

```text
Frontend Search
       |
       v
API Gateway
       |
       v
Search Service
       |
       v
Elasticsearch
       |
       v
Kết quả tìm kiếm
       |
       v
Frontend hiển thị sản phẩm
```

Cần đồng bộ quy tắc tìm kiếm, phân trang và cấu trúc response với Search Service.

### 7.3. Đặt hàng và thanh toán

```text
Frontend Checkout
       |
       v
API Gateway
       |
       v
Order Service
       |
       +----> Cart Service
       |
       +----> Product Service
       |
       +----> Profile Service
       |
       +----> Payment Service
                    |
                    v
                   PayOS
                    |
                    v
          Xác minh kết quả thanh toán
                    |
                    v
              Order Service
                    |
                    v
             Frontend xem đơn
```

Frontend không được tự đánh dấu đơn hàng là đã thanh toán sau khi người dùng quay lại từ PayOS. Trạng thái cuối cùng phải được lấy từ backend sau khi kết quả thanh toán được xác minh.

## 8. Kế hoạch triển khai

### Giai đoạn 1 — Discovery Service

- [ ] T5-001: Kiểm tra cấu hình Eureka Server.
- [ ] T5-002: Kiểm tra các dependency và phiên bản Spring Cloud.
- [ ] T5-003: Kiểm tra từng service đã cấu hình Eureka Client.
- [ ] T5-004: Đồng bộ tên ứng dụng giữa Eureka, Gateway và OpenFeign.
- [ ] T5-005: Kiểm thử đăng ký và khám phá service.
- [ ] T5-006: Kiểm tra dashboard và cấu hình môi trường.

### Giai đoạn 2 — Frontend nền tảng

- [ ] T5-007: Kiểm tra cấu trúc React + TypeScript hiện có.
- [ ] T5-008: Chuẩn hóa biến môi trường.
- [ ] T5-009: Chuẩn hóa Axios instance.
- [ ] T5-010: Chuẩn hóa kiểu dữ liệu API trong thư mục `types`.
- [ ] T5-011: Hoàn thiện routing và layout dùng chung.
- [ ] T5-012: Chuẩn hóa xử lý loading, lỗi và thông báo.

### Giai đoạn 3 — Chức năng người dùng

- [ ] T5-013: Hoàn thiện đăng ký và đăng nhập.
- [ ] T5-014: Hoàn thiện quản lý trạng thái xác thực.
- [ ] T5-015: Hoàn thiện trang chủ và danh sách sản phẩm.
- [ ] T5-016: Hoàn thiện trang chi tiết sản phẩm.
- [ ] T5-017: Tích hợp Search Service.
- [ ] T5-018: Hoàn thiện giỏ hàng.
- [ ] T5-019: Hoàn thiện checkout.
- [ ] T5-020: Tích hợp tạo đơn COD.
- [ ] T5-021: Tích hợp thanh toán PayOS.
- [ ] T5-022: Hoàn thiện trang danh sách và chi tiết đơn hàng.
- [ ] T5-023: Hoàn thiện trang hồ sơ cá nhân.
- [ ] T5-024: Hoàn thiện trang bài viết.
- [ ] T5-025: Tích hợp upload hình ảnh và thông báo nếu backend hỗ trợ.

### Giai đoạn 4 — Kiểm thử và hoàn thiện

- [ ] T5-026: Kiểm thử đăng nhập và đăng xuất.
- [ ] T5-027: Kiểm thử tìm kiếm sản phẩm.
- [ ] T5-028: Kiểm thử thêm, sửa và xóa giỏ hàng.
- [ ] T5-029: Kiểm thử tạo đơn hàng COD.
- [ ] T5-030: Kiểm thử tạo đơn PayOS và đồng bộ trạng thái.
- [ ] T5-031: Kiểm thử phân quyền trên giao diện và backend.
- [ ] T5-032: Kiểm thử lỗi API, timeout và token hết hạn.
- [ ] T5-033: Kiểm tra responsive trên desktop và thiết bị di động.
- [ ] T5-034: Kiểm tra build production và cấu hình triển khai.
- [ ] T5-035: Cập nhật README và hướng dẫn chạy dự án.

## 9. Tiêu chí nghiệm thu

### Discovery Service

- [ ] Eureka Server khởi động ổn định.
- [ ] Các microservice sử dụng Eureka Client đăng ký chính xác.
- [ ] API Gateway và OpenFeign khám phá service theo cấu hình.
- [ ] Các cấu hình môi trường không bị hard-code địa chỉ triển khai.

### Frontend

- [ ] React + TypeScript build thành công.
- [ ] Các trang hoạt động theo quyền và trạng thái xác thực.
- [ ] API được gọi qua API Gateway.
- [ ] Có giao diện xử lý loading, lỗi và trường hợp không có dữ liệu.
- [ ] Tìm kiếm và hiển thị sản phẩm đúng dữ liệu backend.
- [ ] Giỏ hàng và checkout hoạt động.
- [ ] Có thể tạo đơn COD.
- [ ] Có thể khởi tạo PayOS và lấy trạng thái đơn từ backend.
- [ ] Người dùng có thể xem lịch sử đơn hàng của mình.
- [ ] Không lưu secret backend trong mã frontend.
- [ ] Không có lỗi TypeScript hoặc lỗi build nghiêm trọng.
- [ ] Các trang quan trọng hiển thị phù hợp trên nhiều kích thước màn hình.

### Tích hợp toàn hệ thống

- [ ] Frontend giao tiếp thành công với API Gateway.
- [ ] Gateway định tuyến đúng đến các microservice.
- [ ] Discovery Service hoạt động với các service đã đăng ký.
- [ ] Luồng đăng nhập, tìm kiếm, giỏ hàng, đặt hàng và thanh toán được kiểm thử đầu-cuối.
- [ ] Các lỗi xác thực, lỗi kết nối và lỗi nghiệp vụ được xử lý rõ ràng.

## 10. Kết quả đầu ra

| Hạng mục | Kết quả |
|---|---|
| Discovery Service | Eureka Server và cấu hình service registry |
| Frontend | Giao diện React + TypeScript hoàn chỉnh |
| Tích hợp API | Axios, biến môi trường và kiểu dữ liệu API |
| Tích hợp xác thực | Đăng nhập, đăng xuất và quản lý phiên |
| Tích hợp mua hàng | Sản phẩm, tìm kiếm, giỏ hàng, checkout |
| Tích hợp thanh toán | Điều hướng PayOS và đồng bộ trạng thái từ backend |
| Kiểm thử | Test chức năng và kiểm thử tích hợp |
| Tài liệu | README và hướng dẫn chạy hệ thống |

## 11. Điều kiện hoàn thành TASK-5

TASK-5 được xem là hoàn thành khi Discovery Service có thể hỗ trợ các microservice đăng ký và khám phá lẫn nhau, đồng thời frontend React + TypeScript có thể sử dụng các API thông qua API Gateway để thực hiện các chức năng chính của Shop-Meal.

Luồng kiểm thử tổng thể cần chứng minh được rằng người dùng có thể đăng nhập, tìm kiếm món ăn, thêm sản phẩm vào giỏ, tạo đơn hàng, thực hiện thanh toán theo phương thức đã chọn và xem trạng thái đơn hàng được cập nhật từ backend.
