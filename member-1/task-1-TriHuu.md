# SHOP-MEAL MICROSERVICES — TASK MANAGER & TECHNICAL REQUIREMENTS TASK-1 TRAN TRI HUU

**Project:** Shop-Meal  
**Document:** Task Manager & Service Specifications  
**Architecture:** Microservices Architecture  
**Backend:** Java, Spring Boot  
**API Gateway:** Spring Cloud Gateway  
**Version:** 1.0.0

---

## 1. MỤC TIÊU DỰ ÁN

Xây dựng hệ thống Shop-Meal theo kiến trúc Microservices, trong đó mỗi service đảm nhiệm một nhóm nghiệp vụ độc lập, có trách nhiệm rõ ràng, giao tiếp với các service khác thông qua API hoặc cơ chế giao tiếp được quy định.

Tài liệu này xác định:

- Yêu cầu về môi trường và phiên bản công nghệ.
- Nhiệm vụ và phạm vi chức năng của từng service.
- Kiến trúc tổng thể và kiến trúc nội bộ của từng service.
- Yêu cầu đầu vào (Input) và đầu ra (Output).
- Hợp đồng giao tiếp giữa các service.
- Các task cần triển khai và tiêu chí nghiệm thu.
- Kết quả đầu ra cần đạt được sau khi hoàn thành.

### 1.1. Phạm vi triển khai

| STT | Service | Trách nhiệm chính |
|---|---|---|
| 1 | api-gateway | Tiếp nhận, định tuyến và bảo vệ các API |
| 2 | identity-service | Xác thực, đăng nhập và quản lý danh tính |
| 3 | profile-service | Quản lý hồ sơ người dùng |
| 4 | notification-service | Tiếp nhận và xử lý thông báo |
| 5 | file-service | Upload, lưu trữ và truy xuất tệp |

### 1.2. Nguyên tắc thiết kế

1. Mỗi service chịu trách nhiệm về nghiệp vụ thuộc phạm vi của mình.
2. Các service không được truy cập trực tiếp cơ sở dữ liệu nội bộ của service khác.
3. Các API phải có hợp đồng đầu vào và đầu ra rõ ràng.
4. Các service sử dụng chung quy ước phản hồi, mã lỗi và xác thực khi phù hợp.
5. Các thông tin nhạy cảm phải được cấu hình bằng biến môi trường.
6. Mỗi service phải có khả năng khởi động, kiểm thử và triển khai độc lập.
7. Mọi task chỉ được đánh dấu hoàn thành khi đáp ứng đầy đủ tiêu chí nghiệm thu.

---

## 2. YÊU CẦU VỀ PHIÊN BẢN VÀ MÔI TRƯỜNG

### 2.1. Công nghệ nền tảng

Các phiên bản dưới đây là baseline đề xuất cho hệ thống. Khi bắt đầu triển khai, cần kiểm tra tính tương thích của Spring Boot, Spring Cloud và các thư viện liên quan.

| Công nghệ | Phiên bản mục tiêu | Phạm vi sử dụng |
|---|---|---|
| Java JDK | 25 | Runtime và biên dịch backend |
| Spring Boot | 4.1.1 | Framework cho các service |
| Spring Security | 7.1.x | Bảo mật và phân quyền |
| Spring Cloud | 2025.1.x | Gateway và các tích hợp Cloud tương thích |
| Spring Cloud Gateway | Phiên bản tương thích với Spring Cloud BOM | API Gateway |
| Maven | 3.9.x trở lên | Quản lý dependency và build |
| MySQL | 8.4 LTS | Dữ liệu danh tính, hồ sơ |
| MongoDB | 8.x hoặc phiên bản đã được kiểm chứng | Dữ liệu thông báo |
| Redis | 7.x hoặc phiên bản đã được kiểm chứng | Rate limiting, nếu sử dụng |
| Docker | Phiên bản ổn định tương thích với môi trường | Đóng gói và chạy hạ tầng |
| Postman | Phiên bản hiện hành | Kiểm thử API |
| Git | Phiên bản hiện hành | Quản lý mã nguồn |

**Lưu ý về tương thích:**

- Không tự ý nâng riêng Spring Cloud Gateway hoặc Spring Security vượt khỏi phiên bản tương thích với Spring Boot.
- Sử dụng Spring Cloud BOM để quản lý phiên bản các dependency thuộc Spring Cloud.
- Chốt phiên bản thực tế theo `pom.xml` của repository trước khi phát triển.
- Nếu hệ thống đang sử dụng Java 25 và Spring Boot 4.x, tất cả module phải được kiểm tra tương thích trước khi tích hợp.
- Không sử dụng đồng thời các dependency Jakarta và Java EE cũ không tương thích.

### 2.2. Quy định cấu hình

Mỗi service phải có:

- `pom.xml` khai báo dependency cần thiết.
- `application.yml` hoặc `application.yaml` cho cấu hình mặc định.
- `application-dev.yml` nếu cần cấu hình môi trường phát triển.
- File `.env.example` liệt kê các biến môi trường cần thiết, không chứa mật khẩu thật.
- `.gitignore` loại trừ `.env`, file build và dữ liệu nhạy cảm.
- Cấu hình log, timeout và xử lý ngoại lệ phù hợp.

Các thông tin như mật khẩu cơ sở dữ liệu, JWT secret, SMTP password và thông tin xác thực dịch vụ lưu trữ tệp không được hard-code vào mã nguồn.

### 2.3. Quy ước mã nguồn

Package đề xuất:

- `com.meal.gateway`
- `com.meal.identity_service`
- `com.meal.profile`
- `com.meal.notification`
- `com.meal.file`

Tên package thực tế phải giữ nhất quán với mã nguồn hiện tại của từng module.

Quy ước phân lớp cho các service nghiệp vụ:

```text
src/main/java/com/meal/<service>/
├── configuration/
├── controller/
├── dto/
│   ├── request/
│   └── response/
├── entity/
├── repository/
├── service/
│   └── impl/
├── exception/
├── mapper/
└── <Service>Application.java
```

Không bắt buộc tạo những package không cần thiết. Đối với `api-gateway`, có thể sử dụng cấu trúc riêng phù hợp với mô hình reactive.

---

## 3. KIẾN TRÚC TỔNG THỂ

### 3.1. Sơ đồ kiến trúc

```text
                 CLIENT / WEB APP
                        |
                        | HTTP / HTTPS
                        v
               +-------------------+
               |    API GATEWAY    |
               | Routing / Security|
               | Rate Limiting     |
               +-------------------+
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
 +----------------+ +-------------+ +----------------+
 | IDENTITY       | | PROFILE      | | FILE           |
 | SERVICE        | | SERVICE      | | SERVICE        |
 |                | |              | |                |
 | Authentication| | User Profile | | Upload / Read  |
 | JWT / Roles    | | User Details | | File Metadata  |
 +----------------+ +-------------+ +----------------+
          |
          | Publish events, if configured
          v
 +---------------------+
 | NOTIFICATION SERVICE|
 | Event Consumer      |
 | Notification Store  |
 | Notification Status |
 +---------------------+

Databases:
- Identity Service     -> MySQL identity_db
- Profile Service      -> MySQL profile_db
- Notification Service -> MongoDB notification database
- File Service         -> File Storage + metadata database
```

Sơ đồ thể hiện trách nhiệm logic. Các giao tiếp thực tế cần được xác định trong cấu hình và hợp đồng API của hệ thống. Notification Service có thể nhận sự kiện qua Kafka hoặc nhận yêu cầu trực tiếp qua HTTP tùy loại thông báo.

### 3.2. Nguyên tắc giao tiếp

**Giao tiếp đồng bộ:**

- HTTP/REST thông qua API Gateway hoặc giao tiếp nội bộ được cho phép.
- Dùng cho các yêu cầu cần nhận kết quả ngay, chẳng hạn lấy hồ sơ người dùng hoặc truy xuất tệp.
- Các lời gọi nội bộ phải có timeout và xử lý lỗi.

**Giao tiếp bất đồng bộ:**

- Kafka có thể được dùng để truyền sự kiện nghiệp vụ đến Notification Service.
- Sự kiện cần có tên, phiên bản, mã định danh và thời điểm phát sinh.
- Consumer phải xử lý được việc nhận lại sự kiện và tránh tạo thông báo trùng lặp.

**Nguyên tắc dữ liệu:**

- Mỗi service quản lý dữ liệu thuộc quyền sở hữu của mình.
- Các service khác truy cập thông qua API hoặc sự kiện đã quy định.
- Không sử dụng chung entity JPA giữa nhiều service.
- Nếu cần liên kết dữ liệu, ưu tiên sử dụng ID và DTO thay vì quan hệ cơ sở dữ liệu xuyên service.

---

# 4. TASK MANAGER — API GATEWAY

## 4.1. Thông tin service

**Tên:** `api-gateway`

**Trách nhiệm:** Là điểm tiếp nhận API thống nhất từ frontend và định tuyến đến các backend service.

**Cổng đề xuất:** `8888`

**Prefix API công khai:** `/api/v1`

**Công nghệ:**

- Spring Boot WebFlux.
- Spring Cloud Gateway.
- Spring Security WebFlux, nếu áp dụng bảo mật tại Gateway.
- Redis cho rate limiting, nếu sử dụng `RequestRateLimiter`.
- Eureka Client nếu hệ thống sử dụng Eureka Service Discovery.

## 4.2. Nhiệm vụ

- [ ] GW-01: Cấu hình cổng và prefix API thống nhất.
- [ ] GW-02: Cấu hình route đến Identity, Profile, Notification và File Service.
- [ ] GW-03: Cấu hình `StripPrefix` hoặc `RewritePath` đúng với context path của backend.
- [ ] GW-04: Cấu hình CORS cho frontend.
- [ ] GW-05: Cấu hình timeout và xử lý lỗi upstream.
- [ ] GW-06: Cấu hình rate limiting cho các API cần bảo vệ.
- [ ] GW-07: Chuyển tiếp header `Authorization` khi cần thiết.
- [ ] GW-08: Thống nhất cấu trúc phản hồi lỗi tại Gateway.
- [ ] GW-09: Cấu hình log request, response status và thời gian xử lý.
- [ ] GW-10: Kiểm thử định tuyến đến tất cả service mục tiêu.

## 4.3. Kiến trúc nội bộ

```text
Client
  |
  v
Gateway Handler / Filter Chain
  |
  +--> CORS Configuration
  |
  +--> Security Filter (nếu áp dụng)
  |
  +--> Rate Limiter (nếu áp dụng)
  |
  +--> Route Predicate
  |
  +--> Rewrite / Strip Prefix
  |
  v
Backend Service
```

Gateway không xử lý nghiệp vụ đăng nhập, cập nhật hồ sơ hoặc lưu tệp thay cho các service chuyên trách.

## 4.4. Đầu vào và đầu ra

**Input:**

- HTTP method.
- Đường dẫn API.
- Query parameters.
- Request headers.
- Request body.
- Token xác thực đối với endpoint cần bảo vệ.

**Output:**

- Phản hồi từ backend service.
- HTTP status code.
- Response headers.
- Nội dung JSON hoặc dữ liệu nhị phân theo API đích.
- Phản hồi lỗi nếu route không tồn tại, upstream lỗi hoặc request bị giới hạn.

## 4.5. Quy ước route đề xuất

| Public API | Backend đích | Mục đích |
|---|---|---|
| `/api/v1/identity/**` | Identity Service | Xác thực, đăng nhập |
| `/api/v1/profile/**` | Profile Service | Hồ sơ người dùng |
| `/api/v1/notification/**` | Notification Service | Thông báo |
| `/api/v1/file/**` | File Service | Upload và truy xuất tệp |

Bảng trên là quy ước URL công khai. Đường dẫn cuối cùng tại backend phải khớp với context path và mapping thực tế.

Ví dụ: nếu Identity Service có context path `/identity`, request `/api/v1/identity/login` phải được định tuyến sao cho backend nhận `/identity/login`, không phải `/login` hoặc `/identity/identity/login`.

## 4.6. Kết quả cần đạt

- Frontend chỉ cần sử dụng một địa chỉ Gateway cho các API thuộc phạm vi triển khai.
- Mọi route được định tuyến chính xác.
- Request multipart upload được chuyển tiếp mà không làm hỏng boundary hoặc nội dung tệp.
- CORS hoạt động đúng với origin được cho phép.
- Rate limiting trả về phản hồi phù hợp khi vượt giới hạn.
- Lỗi upstream được xử lý nhất quán.
- Gateway không lưu dữ liệu nghiệp vụ của các service.

**Tiêu chí nghiệm thu:** Kiểm thử được route thành công, route không tồn tại, lỗi backend, request thiếu token, request vượt giới hạn và upload tệp qua Gateway.

---

# 5. TASK MANAGER — IDENTITY SERVICE

## 5.1. Thông tin service

**Tên:** `identity-service`

**Trách nhiệm:** Quản lý danh tính, xác thực người dùng và thông tin bảo mật của tài khoản.

**Cổng đề xuất:** `8080`

**Context path:** `/identity`

**Cơ sở dữ liệu:** MySQL `identity_db`

**Công nghệ:**

- Spring Boot.
- Spring Security.
- JWT Resource Server hoặc cơ chế JWT phù hợp với kiến trúc hiện tại.
- Spring Data JPA và MySQL Connector.
- Validation.
- Lombok và MapStruct nếu được sử dụng trong dự án.

## 5.2. Nhiệm vụ

- [ ] ID-01: Xây dựng chức năng đăng ký tài khoản.
- [ ] ID-02: Xây dựng chức năng đăng nhập.
- [ ] ID-03: Phát hành và xác thực access token.
- [ ] ID-04: Xây dựng chức năng refresh token nếu kiến trúc hỗ trợ.
- [ ] ID-05: Xây dựng chức năng đăng xuất và thu hồi token theo cơ chế đã chọn.
- [ ] ID-06: Quản lý role và quyền truy cập.
- [ ] ID-07: Mã hóa mật khẩu bằng thuật toán băm mật khẩu an toàn, chẳng hạn BCrypt.
- [ ] ID-08: Kiểm tra tính duy nhất của username/email theo quy tắc nghiệp vụ.
- [ ] ID-09: Xử lý ngoại lệ và trả về mã lỗi thống nhất.
- [ ] ID-10: Tích hợp tạo hồ sơ người dùng với Profile Service.
- [ ] ID-11: Xây dựng quy trình quên mật khẩu và OTP/email nếu nằm trong phạm vi.
- [ ] ID-12: Kiểm thử các tình huống xác thực và bảo mật.

## 5.3. Kiến trúc nội bộ

```text
Identity Controller
        |
        v
Identity Service
        |
        +--> User Repository
        |         |
        |         v
        |      MySQL
        |
        +--> Password Encoder
        |
        +--> Authentication Manager
        |
        +--> JWT Provider / Token Service
        |
        +--> Profile Service Client
        |
        +--> Notification / Email Integration
```

Identity Service là nguồn dữ liệu chính của tài khoản xác thực. Profile Service quản lý hồ sơ nghiệp vụ và thông tin hiển thị của người dùng.

Nếu Identity Service gọi Profile Service để tạo hồ sơ sau đăng ký, cần quy định rõ cách xử lý khi một trong hai thao tác thất bại. Không nên giả định hai service có chung một transaction cơ sở dữ liệu.

## 5.4. Đầu vào

Ví dụ request đăng nhập:

```json
{
  "username": "user@example.com",
  "password": "example-password"
}
```

Ví dụ request đăng ký:

```json
{
  "username": "newuser@example.com",
  "password": "example-password"
}
```

Đây là DTO minh họa; trường bắt buộc và tên trường phải khớp với DTO thực tế của dự án.

Input cần được kiểm tra:

- Trường bắt buộc không được để trống.
- Email và username đúng định dạng nếu áp dụng.
- Mật khẩu đạt chính sách bảo mật.
- Tài khoản không bị trùng.
- Token có chữ ký, thời hạn và các claim hợp lệ khi xác thực.

## 5.5. Đầu ra

Ví dụ phản hồi đăng nhập thành công:

```json
{
  "code": 1000,
  "message": "Success",
  "results": {
    "accessToken": "<access-token>",
    "authenticated": true
  }
}
```

Đây là cấu trúc đề xuất. Nếu dự án đang sử dụng `data`, `results` hoặc một lớp response wrapper riêng, phải giữ đúng hợp đồng hiện có.

Các trường hợp lỗi cần được xử lý:

- Tài khoản không tồn tại.
- Mật khẩu không chính xác.
- Tài khoản không được phép đăng nhập.
- Token không hợp lệ hoặc đã hết hạn.
- Tài khoản đã tồn tại.
- Lỗi khi tạo hồ sơ người dùng.
- Lỗi gửi OTP hoặc email.

## 5.6. Kết quả cần đạt

- Người dùng có thể đăng ký và đăng nhập theo quy trình đã thiết kế.
- Mật khẩu không được lưu dưới dạng văn bản thuần.
- Token được tạo và kiểm tra đúng.
- Các API được bảo vệ theo quyền phù hợp.
- Token và thông tin nhạy cảm không xuất hiện trong log.
- Profile Service có thể được gọi bằng cơ chế xác thực nội bộ đã thống nhất.
- Các trường hợp lỗi không làm lộ thông tin bảo mật.

**Tiêu chí nghiệm thu:** Kiểm thử đăng ký, đăng nhập đúng/sai, token hết hạn, token sai chữ ký, tài khoản trùng, refresh/logout nếu có và quy trình tạo hồ sơ sau đăng ký.

---

# 6. TASK MANAGER — PROFILE SERVICE

## 6.1. Thông tin service

**Tên:** `profile-service`

**Trách nhiệm:** Quản lý hồ sơ người dùng và thông tin phục vụ giao diện, giao dịch nghiệp vụ.

**Cổng đề xuất:** `8081`

**Context path:** `/profile`

**Cơ sở dữ liệu:** MySQL riêng cho Profile Service, ví dụ `profile_db`.

**Công nghệ:**

- Spring Boot.
- Spring Security OAuth2 Resource Server hoặc JWT validation phù hợp.
- Spring Data JPA.
- MySQL Connector.
- Bean Validation.
- MapStruct nếu dùng để chuyển đổi Entity/DTO.
- OpenFeign hoặc HTTP Client cho các tích hợp nội bộ cần thiết.

## 6.2. Nhiệm vụ

- [ ] PF-01: Xây dựng entity hồ sơ người dùng.
- [ ] PF-02: Xây dựng API tạo hồ sơ.
- [ ] PF-03: Xây dựng API lấy hồ sơ của người dùng hiện tại.
- [ ] PF-04: Xây dựng API lấy hồ sơ theo ID khi có quyền phù hợp.
- [ ] PF-05: Xây dựng API cập nhật hồ sơ.
- [ ] PF-06: Quản lý họ tên, số điện thoại, địa chỉ và avatar theo mô hình dữ liệu.
- [ ] PF-07: Xác thực token và xác định người dùng từ claim đáng tin cậy.
- [ ] PF-08: Kiểm tra quyền truy cập hồ sơ.
- [ ] PF-09: Tích hợp File Service khi upload hoặc cập nhật avatar.
- [ ] PF-10: Xử lý trùng `user_id`, dữ liệu không hợp lệ và lỗi cơ sở dữ liệu.
- [ ] PF-11: Kiểm thử các API hồ sơ.

## 6.3. Kiến trúc nội bộ

```text
Profile Controller
        |
        v
Profile Service
        |
        +--> Profile Mapper
        |
        +--> Profile Repository
        |          |
        |          v
        |       MySQL
        |
        +--> JWT Authentication
        |
        +--> File Service Client (nếu cần)
```

Profile Service không quản lý mật khẩu xác thực. Nếu cần liên kết tài khoản, sử dụng `user_id` do Identity Service cấp.

## 6.4. Đầu vào

Ví dụ tạo hồ sơ:

```json
{
  "userId": "user-uuid",
  "fullName": "Nguyen Van A",
  "phone": "0900000000",
  "address": "Ho Chi Minh City"
}
```

Ví dụ cập nhật hồ sơ:

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0900000000",
  "address": "District 1, Ho Chi Minh City"
}
```

Các quy tắc:

- `userId` phải là định danh hợp lệ từ Identity Service.
- Không cho phép người dùng tự ý tạo hồ sơ cho ID khác nếu không có quyền.
- Với API cập nhật hồ sơ cá nhân, ưu tiên xác định `userId` từ token thay vì tin vào ID gửi từ client.
- Kiểm tra độ dài, định dạng và trường bắt buộc.
- Quy định rõ cách xử lý avatar và dữ liệu địa chỉ.

## 6.5. Đầu ra

Ví dụ hồ sơ được trả về:

```json
{
  "code": 1000,
  "message": "Success",
  "results": {
    "userId": "user-uuid",
    "fullName": "Nguyen Van A",
    "phone": "0900000000",
    "address": "District 1, Ho Chi Minh City",
    "avatarUrl": null
  }
}
```

## 6.6. Kết quả cần đạt

- Tạo, đọc và cập nhật hồ sơ hoạt động đúng.
- Hồ sơ được liên kết với tài khoản bằng `user_id`.
- Mỗi tài khoản chỉ có một hồ sơ nếu nghiệp vụ yêu cầu quan hệ 1-1.
- Không truy cập được hồ sơ riêng tư của người khác khi không có quyền.
- API xác thực đúng JWT và trả về lỗi nhất quán.
- Việc cập nhật avatar không làm lộ đường dẫn lưu trữ nội bộ.

**Tiêu chí nghiệm thu:** Kiểm thử tạo hồ sơ hợp lệ, ID trùng, token thiếu/sai, truy cập hồ sơ người khác, cập nhật dữ liệu và tích hợp avatar.

---

# 7. TASK MANAGER — NOTIFICATION SERVICE

## 7.1. Thông tin service

**Tên:** `notification-service`

**Trách nhiệm:** Tiếp nhận, lưu trữ và xử lý thông báo cho người dùng hoặc hệ thống.

**Cổng đề xuất:** `8082`

**Cơ sở dữ liệu:** MongoDB, ví dụ database `notification_db`.

**Công nghệ:**

- Spring Boot.
- Spring Data MongoDB.
- Apache Kafka nếu sử dụng kiến trúc sự kiện.
- Spring Security nếu có API cần bảo vệ.
- Email integration nếu yêu cầu gửi thông báo qua email.

## 7.2. Nhiệm vụ

- [ ] NT-01: Xác định các loại thông báo được hỗ trợ.
- [ ] NT-02: Xây dựng model và repository thông báo.
- [ ] NT-03: Xây dựng API lấy danh sách thông báo của người dùng.
- [ ] NT-04: Xây dựng API đánh dấu đã đọc.
- [ ] NT-05: Xây dựng API đếm thông báo chưa đọc.
- [ ] NT-06: Tích hợp Kafka Consumer nếu hệ thống sử dụng Kafka.
- [ ] NT-07: Xử lý các sự kiện tài khoản, đơn hàng hoặc nghiệp vụ được chỉ định.
- [ ] NT-08: Kiểm soát việc xử lý sự kiện trùng lặp.
- [ ] NT-09: Xây dựng xử lý lỗi và retry phù hợp.
- [ ] NT-10: Kiểm thử lưu trữ và truy xuất thông báo.
- [ ] NT-11: Bảo vệ API để người dùng chỉ xem thông báo được phép truy cập.

## 7.3. Kiến trúc nội bộ

```text
Kafka Event / HTTP Request
           |
           v
Notification Handler
           |
           v
Notification Service
           |
           +--> Notification Repository
           |           |
           |           v
           |        MongoDB
           |
           +--> Email Provider (nếu có)
           |
           +--> Retry / Error Handling
```

Kafka Consumer chỉ được triển khai khi có producer, topic, schema và quy trình vận hành đã được xác định.

## 7.4. Đầu vào

Ví dụ sự kiện thông báo:

```json
{
  "eventId": "event-uuid",
  "eventType": "USER_REGISTERED",
  "userId": "user-uuid",
  "message": "Your account has been created",
  "occurredAt": "2026-10-15T10:00:00Z"
}
```

Đối với thông báo tạo từ HTTP, request cần có người nhận, nội dung, loại thông báo và metadata cần thiết.

Đối với Kafka:

- Topic phải được quy định rõ.
- Consumer group phải ổn định.
- Payload phải có schema thống nhất.
- Consumer cần xác định được sự kiện đã xử lý.
- Lỗi xử lý phải có chiến lược retry và dead-letter phù hợp khi cần.

## 7.5. Đầu ra

Ví dụ phản hồi danh sách thông báo:

```json
{
  "code": 1000,
  "message": "Success",
  "results": [
    {
      "id": "notification-id",
      "userId": "user-uuid",
      "message": "Your account has been created",
      "read": false,
      "createdAt": "2026-10-15T10:00:00Z"
    }
  ]
}
```

Các đầu ra khác:

- Trạng thái xử lý sự kiện.
- Trạng thái đã đọc/chưa đọc.
- Kết quả gửi email nếu chức năng này được triển khai.
- Log lỗi phục vụ giám sát.

## 7.6. Kết quả cần đạt

- Thông báo được lưu trữ và truy xuất đúng người nhận.
- Người dùng không thể đọc hoặc cập nhật thông báo của người khác.
- Consumer có thể xử lý sự kiện theo đúng schema.
- Thông báo không bị tạo trùng do xử lý lại cùng một sự kiện, theo chính sách idempotency đã chọn.
- Lỗi gửi email hoặc lỗi xử lý sự kiện được ghi nhận.
- API phân trang danh sách thông báo nếu dữ liệu có thể tăng lớn.

**Tiêu chí nghiệm thu:** Kiểm thử tạo thông báo, truy xuất danh sách, đánh dấu đã đọc, sự kiện không hợp lệ, sự kiện trùng và lỗi MongoDB/Kafka khi tích hợp.

---

# 8. TASK MANAGER — FILE SERVICE

## 8.1. Thông tin service

**Tên:** `file-service`

**Trách nhiệm:** Tiếp nhận, lưu trữ, quản lý metadata và cung cấp khả năng truy xuất tệp.

**Cổng đề xuất:** `8088`

**Context path:** `/file`

**Công nghệ:**

- Spring Boot.
- Spring Web MVC hoặc công nghệ web đã chọn.
- Multipart upload.
- File storage cục bộ hoặc Object Storage.
- Cơ sở dữ liệu metadata nếu cần.
- Spring Security hoặc cơ chế xác thực nội bộ phù hợp.

## 8.2. Nhiệm vụ

- [ ] FS-01: Xác định nơi lưu trữ tệp.
- [ ] FS-02: Xây dựng API upload một tệp.
- [ ] FS-03: Xây dựng API upload nhiều tệp nếu cần.
- [ ] FS-04: Kiểm tra kích thước tệp.
- [ ] FS-05: Kiểm tra loại tệp theo danh sách cho phép.
- [ ] FS-06: Sinh tên lưu trữ duy nhất, không sử dụng tên gốc làm đường dẫn trực tiếp.
- [ ] FS-07: Xây dựng API truy xuất tệp.
- [ ] FS-08: Xây dựng API xóa tệp có kiểm tra quyền.
- [ ] FS-09: Lưu metadata như file ID, tên gốc, MIME type, kích thước và thời điểm tạo.
- [ ] FS-10: Xử lý lỗi multipart, lỗi ghi tệp và lỗi truy xuất.
- [ ] FS-11: Cấu hình giới hạn upload và timeout.
- [ ] FS-12: Kiểm thử upload qua Gateway và upload nội bộ.

## 8.3. Kiến trúc nội bộ

```text
File Controller
      |
      v
File Service
      |
      +--> File Validation
      |
      +--> Storage Provider
      |       |
      |       +--> Local Storage
      |       |
      |       +--> Object Storage (optional)
      |
      +--> Metadata Repository (optional)
      |
      +--> Access Control
```

File Service không nên lưu toàn bộ dữ liệu nhị phân trực tiếp trong MySQL nếu kiến trúc đã chọn phương án lưu tệp bên ngoài và chỉ lưu metadata trong cơ sở dữ liệu.

## 8.4. Đầu vào

Ví dụ upload qua HTTP:

```http
POST /api/v1/file/upload
Content-Type: multipart/form-data
Authorization: Bearer <access-token>
```

Trường multipart:

```text
file: <binary file>
```

Các điều kiện cần kiểm tra:

- Có tệp trong request.
- Tệp không rỗng.
- Kích thước không vượt giới hạn.
- MIME type và phần mở rộng phù hợp với danh sách cho phép.
- Tên tệp không được dùng trực tiếp để tạo đường dẫn lưu trữ.
- Người dùng có quyền upload vào phạm vi được yêu cầu.

## 8.5. Đầu ra

Ví dụ phản hồi upload:

```json
{
  "code": 1000,
  "message": "Upload successful",
  "results": {
    "fileId": "file-uuid",
    "fileName": "image.png",
    "contentType": "image/png",
    "size": 204800,
    "url": "/api/v1/file/file-uuid"
  }
}
```

API truy xuất tệp trả về nội dung nhị phân với `Content-Type` phù hợp, hoặc URL truy xuất nếu sử dụng Object Storage.

Không trả về đường dẫn hệ thống như `/home/app/uploads/...` cho client.

## 8.6. Kết quả cần đạt

- Upload và truy xuất tệp thành công.
- Tệp được lưu đúng nơi quy định.
- Metadata được lưu và truy vấn chính xác.
- Tệp không hợp lệ hoặc vượt giới hạn bị từ chối.
- Không thể truy xuất hoặc xóa tệp riêng tư trái quyền.
- Upload qua Gateway không bị lỗi multipart.
- Khi lỗi lưu trữ xảy ra, hệ thống không trả về thành công giả.
- Đường dẫn truy xuất được thiết kế ổn định và không làm lộ cấu trúc lưu trữ nội bộ.

**Tiêu chí nghiệm thu:** Kiểm thử upload ảnh hợp lệ, tệp quá lớn, sai định dạng, tệp rỗng, file ID không tồn tại, thiếu quyền, xóa tệp và upload qua Gateway.

---

# 9. HỢP ĐỒNG GIAO TIẾP GIỮA CÁC SERVICE

## 9.1. Luồng đăng ký tài khoản

```text
Frontend
   |
   v
API Gateway
   |
   v
Identity Service
   |
   +--> Validate request
   |
   +--> Save account
   |
   +--> Create Profile
   |       |
   |       v
   |   Profile Service
   |
   +--> Return result
```

Yêu cầu:

- Không tạo tài khoản trùng.
- Có chính sách xử lý nếu tạo tài khoản thành công nhưng tạo hồ sơ thất bại.
- Không lưu mật khẩu ở Profile Service.
- Có log correlation ID để theo dõi lỗi xuyên service.

## 9.2. Luồng lấy hồ sơ

```text
Frontend
   |
   v
API Gateway
   |
   v
Profile Service
   |
   +--> Validate JWT
   |
   +--> Extract userId
   |
   +--> Query Profile
   |
   v
Return Profile DTO
```

Profile Service cần tự bảo vệ API, không phụ thuộc hoàn toàn vào việc Gateway đã xác thực request.

## 9.3. Luồng upload avatar

```text
Frontend
   |
   v
API Gateway
   |
   v
File Service
   |
   +--> Validate file
   |
   +--> Store file
   |
   +--> Save metadata
   |
   v
Return fileId / URL
   |
   v
Profile Service
   |
   +--> Save avatar reference
```

Cần thống nhất service nào chịu trách nhiệm gọi File Service và cập nhật `avatarUrl` hoặc `fileId`.

## 9.4. Luồng gửi thông báo

```text
Business Event / HTTP Request
              |
              v
      Notification Service
              |
              +--> Validate event
              |
              +--> Process event
              |
              +--> Save notification
              |
              +--> Send email (optional)
```

Nếu dùng Kafka, phải thống nhất tên topic, schema sự kiện, consumer group, chính sách retry và xử lý trùng.

---

# 10. QUY ƯỚC API VÀ XỬ LÝ LỖI

## 10.1. Quy ước API

- Sử dụng RESTful API.
- Phương thức HTTP đúng với hành động: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Dùng JSON cho request/response nghiệp vụ.
- Dùng `multipart/form-data` cho upload.
- Sử dụng HTTP status code đúng ngữ nghĩa.
- API danh sách cần hỗ trợ phân trang khi phù hợp.
- API cần xác thực phải kiểm tra token và quyền.
- Không trả về entity nội bộ trực tiếp nếu có thể gây lộ dữ liệu.

## 10.2. Quy ước phản hồi

Ví dụ thành công:

```json
{
  "code": 1000,
  "message": "Success",
  "results": {}
}
```

Ví dụ lỗi:

```json
{
  "code": 1001,
  "message": "Invalid request",
  "results": null
}
```

Đây là định dạng đề xuất. Nếu dự án đã có response wrapper, cần giữ nguyên hợp đồng đang được frontend và các service sử dụng.

## 10.3. Quy tắc HTTP status

| HTTP status | Ý nghĩa |
|---|---|
| 200 OK | Xử lý thành công |
| 201 Created | Tạo tài nguyên thành công |
| 204 No Content | Thành công, không có nội dung trả về |
| 400 Bad Request | Request không hợp lệ |
| 401 Unauthorized | Chưa xác thực hoặc token không hợp lệ |
| 403 Forbidden | Không đủ quyền |
| 404 Not Found | Không tìm thấy tài nguyên |
| 409 Conflict | Xung đột dữ liệu |
| 413 Content Too Large | Tệp vượt giới hạn |
| 429 Too Many Requests | Vượt giới hạn request |
| 500 Internal Server Error | Lỗi nội bộ |
| 502 Bad Gateway | Gateway nhận phản hồi upstream không hợp lệ |
| 503 Service Unavailable | Dịch vụ tạm thời không khả dụng |
| 504 Gateway Timeout | Upstream quá thời gian chờ |

---

# 11. KẾ HOẠCH TRIỂN KHAI VÀ NGHIỆM THU

## Phase 1 — Chuẩn hóa nền tảng

- [ ] T-001: Kiểm tra cấu trúc repository.
- [ ] T-002: Chốt Java, Spring Boot, Spring Cloud và dependency versions.
- [ ] T-003: Chuẩn hóa cấu hình môi trường.
- [ ] T-004: Chuẩn hóa response wrapper và exception handling.
- [ ] T-005: Chuẩn hóa logging và correlation ID.
- [ ] T-006: Xác định hợp đồng API giữa các service.

**Đầu ra:** Tài liệu kiến trúc, danh sách dependency và hợp đồng API được thống nhất.

## Phase 2 — Phát triển Identity và Profile

- [ ] T-007: Hoàn thiện đăng ký và đăng nhập.
- [ ] T-008: Hoàn thiện JWT validation.
- [ ] T-009: Hoàn thiện tạo hồ sơ người dùng.
- [ ] T-010: Hoàn thiện truy xuất và cập nhật hồ sơ.
- [ ] T-011: Kiểm thử tích hợp Identity–Profile.

**Đầu ra:** Luồng đăng ký, đăng nhập và quản lý hồ sơ hoạt động xuyên service.

## Phase 3 — Phát triển File Service

- [ ] T-012: Chốt chiến lược lưu trữ tệp.
- [ ] T-013: Hoàn thiện upload và truy xuất.
- [ ] T-014: Hoàn thiện validation và phân quyền.
- [ ] T-015: Tích hợp upload avatar với Profile Service.
- [ ] T-016: Kiểm thử multipart qua Gateway.

**Đầu ra:** Tệp được upload, lưu trữ, truy xuất và liên kết với hồ sơ.

## Phase 4 — Phát triển Notification Service

- [ ] T-017: Hoàn thiện model thông báo.
- [ ] T-018: Hoàn thiện API truy xuất và cập nhật trạng thái đọc.
- [ ] T-019: Tích hợp Kafka hoặc HTTP theo thiết kế.
- [ ] T-020: Hoàn thiện retry và xử lý sự kiện trùng.
- [ ] T-021: Kiểm thử phân quyền thông báo.

**Đầu ra:** Thông báo được tiếp nhận, lưu trữ và truy xuất đúng người nhận.

## Phase 5 — Tích hợp Gateway

- [ ] T-022: Hoàn thiện route cho tất cả service.
- [ ] T-023: Hoàn thiện CORS và header forwarding.
- [ ] T-024: Hoàn thiện rate limiting.
- [ ] T-025: Hoàn thiện xử lý lỗi upstream.
- [ ] T-026: Kiểm thử toàn bộ API thông qua Gateway.

**Đầu ra:** Frontend truy cập các API qua một entry point thống nhất.

## Phase 6 — Kiểm thử và bàn giao

- [ ] T-027: Unit test cho các lớp nghiệp vụ.
- [ ] T-028: Integration test với cơ sở dữ liệu.
- [ ] T-029: API test bằng Postman.
- [ ] T-030: Kiểm thử lỗi xác thực và phân quyền.
- [ ] T-031: Kiểm tra biến môi trường và bí mật.
- [ ] T-032: Hoàn thiện README cho từng service.
- [ ] T-033: Kiểm thử khởi động toàn bộ hệ thống.
- [ ] T-034: Hoàn thiện tài liệu triển khai.

**Đầu ra:** Hệ thống có thể chạy, kiểm thử, cấu hình và bàn giao theo tài liệu.

---

# 12. TIÊU CHÍ HOÀN THÀNH CHUNG

Một service chỉ được đánh dấu **Done** khi đáp ứng các điều kiện sau:

1. Mã nguồn biên dịch thành công.
2. Cấu hình chạy độc lập đầy đủ.
3. Các API đã triển khai đúng hợp đồng.
4. Có kiểm tra dữ liệu đầu vào.
5. Có xử lý ngoại lệ và HTTP status phù hợp.
6. Có xác thực và phân quyền đối với API được bảo vệ.
7. Không hard-code thông tin bí mật.
8. Unit test và integration test quan trọng đã chạy thành công.
9. Các API đã được kiểm thử bằng Postman hoặc công cụ tương đương.
10. Có README mô tả chức năng, cách cấu hình, cách chạy và API chính.
11. Tích hợp được với các service phụ thuộc.
12. Không còn lỗi nghiêm trọng chưa được xử lý.

### Definition of Done — Checklist

- [ ] Build thành công.
- [ ] Service khởi động thành công.
- [ ] Kết nối cơ sở dữ liệu thành công.
- [ ] API chính hoạt động đúng.
- [ ] Kiểm thử lỗi đầu vào.
- [ ] Kiểm thử xác thực và phân quyền.
- [ ] Kiểm thử tích hợp.
- [ ] Log không chứa dữ liệu nhạy cảm.
- [ ] README hoàn chỉnh.
- [ ] Các biến môi trường được tài liệu hóa.
- [ ] Không có lỗi nghiêm trọng chưa xử lý.

---

# 13. KẾT QUẢ BÀN GIAO CUỐI CÙNG

Khi hoàn thành phạm vi 5 service, hệ thống phải đạt được các kết quả sau:

| Service | Kết quả bàn giao |
|---|---|
| API Gateway | Định tuyến thống nhất, kiểm soát request và xử lý lỗi |
| Identity Service | Đăng ký, đăng nhập, xác thực token và quản lý danh tính |
| Profile Service | Tạo, đọc và cập nhật hồ sơ người dùng an toàn |
| Notification Service | Lưu trữ, truy xuất và xử lý thông báo |
| File Service | Upload, lưu trữ, truy xuất và quản lý metadata tệp |

Các kết quả tích hợp:

- Frontend gọi API thông qua Gateway.
- Identity Service và Profile Service phối hợp đúng trong luồng tài khoản.
- File Service có thể được sử dụng để quản lý avatar hoặc tệp đính kèm.
- Notification Service xử lý được các thông báo đã được quy định.
- Các service có cấu hình và tài liệu độc lập.
- Hệ thống có quy trình kiểm thử, khởi động và triển khai rõ ràng.

---

## 14. QUY ĐỊNH QUẢN LÝ TASK

Mỗi task nên có các trường:

- **Task ID:** Mã định danh duy nhất.
- **Task Name:** Tên công việc.
- **Service:** Service phụ trách.
- **Description:** Mô tả nhiệm vụ.
- **Input:** Dữ liệu hoặc điều kiện đầu vào.
- **Output:** Kết quả đầu ra.
- **Acceptance Criteria:** Điều kiện nghiệm thu.
- **Priority:** Mức độ ưu tiên.
- **Status:** Trạng thái thực hiện.
- **Dependencies:** Task phụ thuộc.

Trạng thái đề xuất:

- `TODO`: Chưa thực hiện.
- `IN_PROGRESS`: Đang thực hiện.
- `BLOCKED`: Đang bị chặn bởi phụ thuộc hoặc lỗi.
- `REVIEW`: Chờ kiểm tra.
- `DONE`: Đã hoàn thành và nghiệm thu.

**Nguyên tắc cuối cùng:** Không đánh dấu task là `DONE` chỉ vì đã viết code. Task phải đạt được kết quả đầu ra, vượt qua tiêu chí nghiệm thu và không làm hỏng các chức năng đã có của hệ thống Shop-Meal.

---

**End of Document — Shop-Meal Task Manager v1.0.0**