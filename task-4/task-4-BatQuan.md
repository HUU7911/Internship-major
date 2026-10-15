# SHOP-MEAL — TASK-4: ORDER SERVICE & PAYMENT SERVICE

## 1. Tổng quan

### 1.1. Mục tiêu

Xây dựng Order Service và Payment Service cho hệ thống Shop-Meal theo kiến trúc Microservices.

- **Order Service:** Quản lý vòng đời đơn hàng, tạo đơn từ giỏ hàng, lưu thông tin sản phẩm tại thời điểm đặt hàng, quản lý trạng thái đơn hàng và phối hợp với các dịch vụ liên quan.
- **Payment Service:** Quản lý giao dịch thanh toán, tích hợp cổng thanh toán PayOS, tạo liên kết thanh toán, tiếp nhận kết quả thanh toán và đồng bộ trạng thái giao dịch với Order Service.

Hai service cần hoạt động độc lập nhưng phối hợp với Cart Service, Product Service, Profile Service và API Gateway để hoàn thiện quy trình mua hàng.

### 1.2. Phạm vi công việc

| Service | Nhiệm vụ chính |
|---|---|
| Order Service | Tạo đơn, xem đơn, cập nhật trạng thái, hủy đơn, tính tổng tiền |
| Payment Service | Tạo giao dịch, tích hợp PayOS, xử lý kết quả thanh toán |
| Cart Service | Cung cấp giỏ hàng để tạo đơn |
| Product Service | Xác minh thông tin và giá sản phẩm |
| Profile Service | Cung cấp thông tin người đặt hàng |
| API Gateway | Định tuyến request từ frontend đến các service |

## 2. Kiến trúc hệ thống

```text
                    React Web App
                          |
                          v
                     API Gateway
                          |
              +-----------+-----------+
              |                       |
              v                       v
         Order Service           Payment Service
              |                       |
       +------+------+                |
       |      |      |                v
       v      v      v              PayOS
     Cart  Product Profile             |
       |      |      |                |
       +------+------+                |
              |                       |
              v                       v
          MySQL DB <----------- Payment Callback
              |
              v
       Order / Payment Data
```

> Sơ đồ mô tả luồng logic tổng quát. Việc lưu dữ liệu phải tuân theo quyền sở hữu dữ liệu của từng microservice: Order Service quản lý đơn hàng; Payment Service quản lý giao dịch thanh toán. Không nên để hai service cùng thao tác trực tiếp trên một bảng dữ liệu nghiệp vụ.

## 3. Order Service

### 3.1. Chức năng

Order Service chịu trách nhiệm quản lý toàn bộ vòng đời đơn hàng.

Các chức năng cần triển khai:

- Tạo đơn hàng từ giỏ hàng hiện tại của người dùng.
- Kiểm tra người dùng đã đăng nhập và có quyền tạo đơn.
- Lấy thông tin giỏ hàng từ Cart Service.
- Xác minh lại sản phẩm và giá từ Product Service.
- Lấy thông tin người nhận hàng từ Profile Service khi cần.
- Lưu thông tin sản phẩm, số lượng, đơn giá và tổng tiền tại thời điểm đặt hàng.
- Hỗ trợ phương thức thanh toán COD và PayOS.
- Cho phép người dùng xem danh sách đơn hàng và chi tiết đơn hàng của mình.
- Cho phép người dùng hủy đơn khi đáp ứng điều kiện nghiệp vụ.
- Cho phép nhân viên có quyền phù hợp cập nhật trạng thái đơn hàng.
- Phối hợp với Payment Service để khởi tạo và xác nhận thanh toán.

### 3.2. Công nghệ

- Java và Spring Boot.
- Spring Web.
- Spring Data JPA và Hibernate.
- Spring Security, JWT Resource Server.
- Spring Cloud OpenFeign để giao tiếp giữa các service.
- MySQL để lưu đơn hàng.
- Lombok và MapStruct nếu đã sử dụng trong dự án.
- Maven để quản lý dependency và build.

Phiên bản Java, Spring Boot và Spring Cloud phải đồng bộ với các module hiện có trong repository.

### 3.3. Dữ liệu đơn hàng

Có thể thiết kế entity `Order` với các trường:

| Trường | Ý nghĩa |
|---|---|
| `id` | Mã đơn hàng |
| `userId` | ID người đặt hàng |
| `recipientName` | Tên người nhận |
| `phone` | Số điện thoại người nhận |
| `address` | Địa chỉ giao hàng |
| `totalPrice` | Tổng giá trị đơn hàng |
| `paymentMethod` | Phương thức thanh toán |
| `paymentStatus` | Trạng thái thanh toán |
| `status` | Trạng thái đơn hàng |
| `createdAt` | Thời điểm tạo đơn |
| `updatedAt` | Thời điểm cập nhật |

Entity `OrderItem` lưu chi tiết từng sản phẩm:

| Trường | Ý nghĩa |
|---|---|
| `id` | ID chi tiết đơn hàng |
| `orderId` | Đơn hàng sở hữu chi tiết |
| `productId` | ID sản phẩm |
| `productName` | Tên sản phẩm tại thời điểm đặt |
| `image` | Ảnh đại diện tại thời điểm đặt |
| `price` | Đơn giá tại thời điểm đặt |
| `quantity` | Số lượng |
| `subtotal` | Thành tiền của sản phẩm |

Nên dùng `BigDecimal` cho tiền tệ thay vì `float` hoặc `double`.

**Lưu ý:** Không chỉ lưu `productId` rồi lấy giá hiện tại mỗi lần xem đơn. Đơn hàng cần lưu snapshot thông tin và giá tại thời điểm mua để lịch sử đơn hàng không thay đổi khi sản phẩm được cập nhật.

### 3.4. Trạng thái đơn hàng

Các trạng thái đề xuất:

- `PENDING`: Đơn hàng mới được tạo.
- `CONFIRMED`: Đơn hàng đã được xác nhận.
- `PROCESSING`: Đang chuẩn bị đơn hàng.
- `SHIPPING`: Đang giao hàng.
- `COMPLETED`: Đơn hàng đã hoàn thành.
- `CANCELLED`: Đơn hàng đã bị hủy.

Không nhất thiết phải triển khai tất cả trạng thái ngay từ đầu. Hãy thống nhất các trạng thái với frontend và nghiệp vụ thực tế.

Quy tắc chuyển trạng thái cần được kiểm tra ở backend. Ví dụ, không được chuyển đơn đã `CANCELLED` sang `SHIPPING` nếu nghiệp vụ không cho phép.

### 3.5. Trạng thái thanh toán

Các trạng thái đề xuất:

- `UNPAID`: Chưa thanh toán.
- `PENDING`: Đang chờ kết quả thanh toán.
- `PAID`: Đã thanh toán.
- `FAILED`: Thanh toán thất bại.
- `REFUNDED`: Đã hoàn tiền, nếu hệ thống hỗ trợ.

Trạng thái đơn hàng và trạng thái thanh toán là hai khái niệm riêng biệt. Không nên dùng một trường `status` duy nhất để biểu diễn cả hai.

### 3.6. Quy tắc nghiệp vụ

#### Tạo đơn COD

1. Xác thực người dùng.
2. Lấy giỏ hàng từ Cart Service.
3. Kiểm tra giỏ hàng không rỗng.
4. Xác minh sản phẩm còn hợp lệ và tính lại giá.
5. Tính tổng tiền ở backend.
6. Lưu đơn hàng và các OrderItem.
7. Khởi tạo trạng thái đơn hàng theo quy tắc nghiệp vụ.
8. Đặt trạng thái thanh toán theo chính sách COD.
9. Chỉ xóa giỏ hàng sau khi đơn hàng được tạo thành công.

Nếu dự án quy định COD chỉ được ghi nhận đã thanh toán khi giao hàng thành công, thì không đánh dấu `PAID` ngay lúc tạo đơn. Chỉ cập nhật sau khi xác nhận thu tiền.

#### Tạo đơn PayOS

1. Thực hiện các bước kiểm tra giỏ hàng, sản phẩm và giá.
2. Tạo đơn hàng ở trạng thái chờ thanh toán.
3. Gọi Payment Service để tạo giao dịch PayOS.
4. Nhận thông tin thanh toán, chẳng hạn URL thanh toán.
5. Trả thông tin đơn hàng và URL thanh toán cho frontend.
6. Khi PayOS gửi kết quả thanh toán hợp lệ, cập nhật trạng thái thanh toán.
7. Chỉ xác nhận đơn đã thanh toán khi kết quả đã được xác minh ở backend.

Cần quy định rõ thời gian hết hạn thanh toán và cách xử lý đơn không được thanh toán. Không nên tự động xóa đơn chỉ vì frontend đóng trang thanh toán.

### 3.7. API đề xuất

| Method | Endpoint | Chức năng |
|---|---|---|
| `POST` | `/api/v1/orders` | Tạo đơn hàng |
| `GET` | `/api/v1/orders/my-orders` | Danh sách đơn của người dùng |
| `GET` | `/api/v1/orders/{orderId}` | Chi tiết đơn hàng |
| `PATCH` | `/api/v1/orders/{orderId}/cancel` | Hủy đơn hàng |
| `PATCH` | `/api/v1/orders/{orderId}/status` | Cập nhật trạng thái theo quyền |
| `GET` | `/api/v1/orders` | Danh sách đơn hàng dành cho quản trị/nhân viên |

Các endpoint là thiết kế đề xuất. Nếu dự án đã có controller và route riêng, hãy giữ nguyên hợp đồng API đang được frontend sử dụng.

## 4. Payment Service

### 4.1. Chức năng

Payment Service quản lý các giao dịch thanh toán và tích hợp cổng thanh toán bên ngoài.

Các chức năng cần triển khai:

- Tạo giao dịch thanh toán cho đơn hàng.
- Tích hợp PayOS để tạo liên kết thanh toán.
- Lưu mã giao dịch, mã đơn hàng liên quan, số tiền và trạng thái.
- Cung cấp API truy vấn trạng thái giao dịch.
- Tiếp nhận webhook hoặc callback từ PayOS theo cơ chế được PayOS hỗ trợ.
- Xác minh chữ ký và tính hợp lệ của dữ liệu nhận được.
- Xử lý thông báo thanh toán lặp lại một cách an toàn.
- Thông báo kết quả thanh toán cho Order Service.
- Xử lý thanh toán thất bại hoặc hết hạn.
- Không cho phép người dùng tùy ý sửa trạng thái giao dịch.

### 4.2. Công nghệ

- Java và Spring Boot.
- Spring Web.
- Spring Data JPA.
- Spring Security.
- OpenFeign hoặc cơ chế giao tiếp nội bộ tương đương.
- MySQL.
- PayOS Java SDK theo phiên bản thực tế trong `pom.xml`.
- Maven.

### 4.3. Cấu hình

Các thông tin nhạy cảm cần được đưa vào biến môi trường, không hard-code hoặc commit lên Git.

Ví dụ cấu hình minh họa:

```yaml
server:
  port: 8087
  servlet:
    context-path: /payment

payos:
  client-id: ${PAYOS_CLIENT_ID}
  api-key: ${PAYOS_API_KEY}
  checksum-key: ${PAYOS_CHECKSUM_KEY}
  return-url: ${PAYOS_RETURN_URL}
  cancel-url: ${PAYOS_CANCEL_URL}
  expire-minutes: 15
```

Đây là mẫu cấu hình; cần điều chỉnh tên property theo class cấu hình và phiên bản SDK đang dùng. Với Spring Boot 4, cần kiểm tra đúng cấu hình servlet và các dependency tương thích của module.

Tạo file `.env` hoặc cấu hình môi trường cho máy chạy ứng dụng. Không đưa giá trị thật của `PAYOS_API_KEY` và `PAYOS_CHECKSUM_KEY` vào repository. Đảm bảo các file chứa secret được thêm vào `.gitignore`.

### 4.4. Dữ liệu giao dịch

Có thể thiết kế entity `Payment` với các trường:

| Trường | Ý nghĩa |
|---|---|
| `id` | ID giao dịch nội bộ |
| `orderId` | ID đơn hàng |
| `orderCode` | Mã đơn hàng dùng khi tạo giao dịch PayOS |
| `amount` | Số tiền thanh toán |
| `method` | Phương thức thanh toán |
| `status` | Trạng thái giao dịch |
| `paymentLinkId` | ID liên kết thanh toán nếu SDK cung cấp |
| `checkoutUrl` | URL thanh toán nếu cần lưu |
| `transactionReference` | Mã tham chiếu giao dịch từ cổng thanh toán |
| `createdAt` | Thời điểm tạo giao dịch |
| `updatedAt` | Thời điểm cập nhật |

Cần thiết kế ràng buộc duy nhất cho mã đơn hàng hoặc mã giao dịch phù hợp với quy trình tạo thanh toán. Không dùng riêng `orderId` làm mã giao dịch PayOS nếu hợp đồng của PayOS yêu cầu một mã khác.

### 4.5. Trạng thái giao dịch

Các trạng thái đề xuất:

- `PENDING`: Đang chờ thanh toán.
- `PAID`: Thanh toán thành công.
- `FAILED`: Thanh toán thất bại.
- `CANCELLED`: Giao dịch đã bị hủy.
- `EXPIRED`: Liên kết thanh toán đã hết hạn.
- `REFUNDED`: Đã hoàn tiền, nếu hỗ trợ.

Chỉ cập nhật trạng thái theo dữ liệu đã được xác minh. Việc người dùng được chuyển về `return-url` không tự nó chứng minh rằng thanh toán đã thành công.

### 4.6. Luồng thanh toán PayOS

```text
Frontend
   |
   v
Order Service
   |
   | Tạo đơn PENDING
   v
Payment Service
   |
   | Tạo payment link
   v
PayOS
   |
   | Trả checkout URL
   v
Frontend
   |
   | Người dùng thanh toán
   v
PayOS
   |
   | Webhook đã xác minh
   v
Payment Service
   |
   | Cập nhật giao dịch
   v
Order Service
   |
   | Cập nhật paymentStatus = PAID
   v
Đơn hàng được xác nhận thanh toán
```

Payment Service cần bảo đảm webhook được xác minh, chống xử lý lặp và đối chiếu số tiền với giao dịch đã tạo. Khi thông báo kết quả cho Order Service thất bại tạm thời, cần có cơ chế retry hoặc đối soát để tránh giao dịch đã thanh toán nhưng đơn hàng chưa được cập nhật.

### 4.7. API đề xuất

| Method | Endpoint | Chức năng |
|---|---|---|
| `POST` | `/api/v1/payments` | Tạo giao dịch thanh toán |
| `GET` | `/api/v1/payments/{paymentId}` | Xem chi tiết giao dịch |
| `GET` | `/api/v1/payments/order/{orderId}` | Tra cứu giao dịch theo đơn |
| `POST` | `/api/v1/payments/payos/webhook` | Nhận webhook PayOS |
| `POST` | `/api/v1/payments/{paymentId}/cancel` | Hủy giao dịch nếu hợp lệ |

Webhook phải được bảo vệ theo cơ chế xác minh chữ ký của PayOS, nhưng không nên yêu cầu JWT người dùng thông thường nếu nhà cung cấp gọi trực tiếp vào endpoint này. Cần áp dụng cơ chế bảo vệ phù hợp với giao thức webhook.

## 5. Giao tiếp giữa Order Service và Payment Service

### 5.1. Tạo thanh toán

Order Service gửi yêu cầu tạo giao dịch đến Payment Service, gồm các thông tin tối thiểu như:

```json
{
  "orderId": "ORDER_ID",
  "amount": 250000,
  "description": "Thanh toan don hang"
}
```

Đây là JSON minh họa, không phải ID hoặc giá trị giao dịch thực tế.

Payment Service cần kiểm tra đơn hàng có hợp lệ, số tiền có khớp với dữ liệu đơn hàng đáng tin cậy và yêu cầu có được gửi lặp hay không. Không được tin tưởng một số tiền do frontend tự gửi lên.

Phản hồi có thể chứa:

```json
{
  "paymentId": "PAYMENT_ID",
  "status": "PENDING",
  "checkoutUrl": "PAYOS_CHECKOUT_URL"
}
```

Các trường thực tế phải thống nhất với DTO của hai service.

### 5.2. Đồng bộ kết quả

Có thể triển khai đồng bộ nội bộ bằng OpenFeign cho phiên bản đầu tiên. Khi cần tăng khả năng phục hồi, có thể cân nhắc Kafka hoặc transactional outbox để truyền sự kiện thanh toán.

Yêu cầu bắt buộc:

- Xác thực nguồn và dữ liệu kết quả thanh toán.
- Kiểm tra `orderId` và số tiền.
- Xử lý idempotency: cùng một webhook được gửi nhiều lần không được ghi nhận thanh toán nhiều lần.
- Không cho phép giao dịch đã `PAID` bị chuyển ngược về `PENDING` do thông báo cũ.
- Có log để truy vết giao dịch và lỗi đồng bộ.
- Có phương án retry hoặc đối soát khi hai service không liên lạc được.

## 6. Bảo mật và tính toàn vẹn dữ liệu

- Các API đơn hàng phải xác thực JWT.
- Người dùng chỉ được xem hoặc hủy đơn thuộc quyền sở hữu của mình, trừ các vai trò quản trị được phân quyền.
- Chỉ nhân viên có quyền phù hợp mới được cập nhật trạng thái xử lý đơn hàng.
- Không tin giá, tổng tiền, quyền sở hữu hoặc trạng thái thanh toán do frontend gửi lên.
- Xác minh chữ ký webhook theo hướng dẫn chính thức của PayOS.
- Không ghi API key, checksum key hoặc dữ liệu nhạy cảm vào log.
- Bảo đảm cập nhật trạng thái có kiểm soát và không tạo ra chuyển trạng thái bất hợp lệ.
- Cấu hình timeout cho các lời gọi giữa các service.
- Không giữ transaction database mở trong thời gian chờ người dùng thanh toán trên PayOS.

## 7. Kế hoạch triển khai

### Giai đoạn 1 — Thiết kế

- [ ] T4-001: Xác định entity Order và OrderItem.
- [ ] T4-002: Xác định entity Payment.
- [ ] T4-003: Thống nhất trạng thái đơn hàng.
- [ ] T4-004: Thống nhất trạng thái thanh toán.
- [ ] T4-005: Thiết kế DTO, API và hợp đồng giao tiếp giữa các service.

### Giai đoạn 2 — Order Service

- [ ] T4-006: Tạo cấu trúc module và cấu hình MySQL.
- [ ] T4-007: Xây dựng entity, repository và migration/schema.
- [ ] T4-008: Xây dựng service tạo đơn hàng.
- [ ] T4-009: Tích hợp Cart Service.
- [ ] T4-010: Tích hợp Product Service để xác minh giá.
- [ ] T4-011: Tích hợp Profile Service nếu cần thông tin giao hàng.
- [ ] T4-012: Xây dựng API xem danh sách và chi tiết đơn hàng.
- [ ] T4-013: Xây dựng nghiệp vụ hủy đơn.
- [ ] T4-014: Xây dựng cập nhật trạng thái theo phân quyền.
- [ ] T4-015: Kiểm tra quyền sở hữu đơn hàng.
- [ ] T4-016: Kiểm thử nghiệp vụ COD.

### Giai đoạn 3 — Payment Service

- [ ] T4-017: Tạo cấu trúc module và cấu hình cơ sở dữ liệu.
- [ ] T4-018: Xây dựng entity Payment và repository.
- [ ] T4-019: Cấu hình PayOS bằng biến môi trường.
- [ ] T4-020: Xây dựng API tạo liên kết thanh toán.
- [ ] T4-021: Xây dựng API tra cứu giao dịch.
- [ ] T4-022: Xây dựng webhook và xác minh chữ ký.
- [ ] T4-023: Xử lý kết quả thành công, thất bại và hủy.
- [ ] T4-024: Xử lý webhook lặp và cập nhật trạng thái idempotent.
- [ ] T4-025: Tích hợp Payment Service với Order Service.

### Giai đoạn 4 — Tích hợp hệ thống

- [ ] T4-026: Định tuyến API qua API Gateway.
- [ ] T4-027: Kiểm thử luồng đặt hàng COD.
- [ ] T4-028: Kiểm thử luồng đặt hàng PayOS.
- [ ] T4-029: Kiểm thử thanh toán thất bại và hết hạn.
- [ ] T4-030: Kiểm thử trường hợp webhook gửi nhiều lần.
- [ ] T4-031: Kiểm thử lỗi kết nối giữa các microservice.
- [ ] T4-032: Cập nhật README và tài liệu API.
- [ ] T4-033: Kiểm tra secret, cấu hình môi trường và `.gitignore`.

## 8. Tiêu chí nghiệm thu

### Order Service

- [ ] Tạo đơn thành công khi giỏ hàng hợp lệ.
- [ ] Từ chối tạo đơn khi giỏ hàng rỗng hoặc dữ liệu sản phẩm không hợp lệ.
- [ ] Tổng tiền được tính ở backend.
- [ ] Đơn hàng lưu snapshot sản phẩm và giá tại thời điểm mua.
- [ ] Người dùng không thể truy cập trái phép đơn của người khác.
- [ ] Các trạng thái đơn hàng được kiểm soát theo nghiệp vụ.
- [ ] Lỗi ở service phụ thuộc không làm phát sinh đơn hàng không nhất quán.

### Payment Service

- [ ] Tạo được liên kết thanh toán PayOS cho giao dịch hợp lệ.
- [ ] Secret được quản lý bằng biến môi trường.
- [ ] Webhook chỉ được chấp nhận sau khi xác minh hợp lệ.
- [ ] Trạng thái thanh toán không được quyết định chỉ dựa vào redirect frontend.
- [ ] Webhook lặp không tạo ra cập nhật thanh toán trùng lặp.
- [ ] Đối chiếu đúng mã đơn hàng và số tiền.
- [ ] Có khả năng retry hoặc đối soát khi cập nhật kết quả thất bại.

### Tích hợp

- [ ] Frontend có thể tạo đơn COD.
- [ ] Frontend có thể tạo đơn PayOS và chuyển đến trang thanh toán.
- [ ] Đơn hàng được cập nhật sau khi thanh toán được xác minh.
- [ ] API Gateway định tuyến đúng và giữ nguyên các quy tắc xác thực.
- [ ] Các luồng lỗi được trả về thông báo rõ ràng.

## 9. Cấu trúc thư mục tham khảo

```text
shop-meal/
├── order-service/
│   ├── src/main/java/com/meal/order/
│   │   ├── configuration/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── mapper/
│   │   ├── repository/
│   │   ├── service/
│   │   └── client/
│   ├── src/main/resources/
│   ├── pom.xml
│   └── README.md
│
├── payment-service/
│   ├── src/main/java/com/meal/payment/
│   │   ├── configuration/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── repository/
│   │   ├── service/
│   │   └── client/
│   ├── src/main/resources/
│   ├── pom.xml
│   └── README.md
│
└── TASK-4-README.md
```

Đây là cấu trúc gợi ý. Giữ nguyên package và cách tổ chức hiện có nếu các module đã được khởi tạo.

## 10. Kết quả đầu ra

| Hạng mục | Kết quả |
|---|---|
| Order Service | API và nghiệp vụ quản lý đơn hàng |
| Payment Service | API quản lý giao dịch và tích hợp PayOS |
| Tích hợp service | Giao tiếp Order–Payment và các service phụ thuộc |
| Bảo mật | JWT, phân quyền, kiểm tra quyền sở hữu |
| Kiểm thử | Bộ test cho COD, PayOS và các tình huống lỗi |
| Tài liệu | README, API contract và hướng dẫn cấu hình |

## 11. Điều kiện hoàn thành TASK-4

TASK-4 được xem là hoàn thành khi người dùng có thể đặt hàng từ giỏ hàng, lựa chọn COD hoặc PayOS, theo dõi đơn hàng và nhận được trạng thái thanh toán chính xác. Backend phải tự xác minh giá và kết quả thanh toán, đồng thời xử lý an toàn các trường hợp lỗi, yêu cầu lặp và mất kết nối giữa các microservice.
