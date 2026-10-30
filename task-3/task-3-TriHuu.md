# SHOP-MEAL — TASK-3: CART SERVICE & POST SERVICE-TRAN TRI HUU

**Project:** Shop-Meal  
**Task:** TASK-3 — Shopping Cart & Product Posts  
**Architecture:** Microservices Architecture  
**Backend:** Java + Spring Boot  
**Version:** 1.0.0

---

# 1. MỤC TIÊU TASK-3

TASK-3 triển khai hai nhóm chức năng quan trọng trong hệ thống Shop-Meal:

1. **Cart Service:** Quản lý giỏ hàng của người dùng, bao gồm thêm sản phẩm, cập nhật số lượng, xóa sản phẩm và tính tổng tiền.
2. **Post Service:** Quản lý các bài viết liên quan đến sản phẩm, cho phép người dùng xem nội dung giới thiệu, đánh giá hoặc bài viết chia sẻ về sản phẩm theo phạm vi nghiệp vụ được xác định.

Hai service phải hoạt động độc lập, có API rõ ràng và tích hợp với các service liên quan thông qua API hoặc cơ chế giao tiếp đã thống nhất.

## 1.1. Phạm vi triển khai

| Service | Trách nhiệm chính |
|---|---|
| Cart Service | Quản lý giỏ hàng và các mặt hàng trong giỏ |
| Post Service | Quản lý bài viết và liên kết bài viết với sản phẩm |
| Product Service | Cung cấp thông tin sản phẩm chính thức |
| Profile Service | Cung cấp thông tin hồ sơ khi nghiệp vụ cần |
| File Service | Lưu trữ hình ảnh hoặc tệp đính kèm |
| API Gateway | Định tuyến request từ frontend |
| Identity Service | Xác thực danh tính và quyền truy cập |

## 1.2. Nguyên tắc thiết kế

- Mỗi người dùng chỉ được truy cập giỏ hàng của mình, trừ các quyền quản trị được quy định rõ.
- Cart Service là nơi quản lý trạng thái giỏ hàng, không phải nơi quản lý sản phẩm gốc.
- Product Service là nguồn dữ liệu chính thức về tên, giá và trạng thái sản phẩm.
- Cart Service có thể lưu bản chụp tên, giá và ảnh sản phẩm tại thời điểm thêm vào giỏ để hiển thị.
- Giá trong giỏ hàng không được xem là giá cuối cùng để thanh toán.
- Post Service quản lý nội dung bài viết và liên kết đến sản phẩm bằng ID.
- Không chia sẻ trực tiếp entity hoặc repository giữa các service.
- Các API phải kiểm tra dữ liệu đầu vào, xác thực và phân quyền phù hợp.
- Các service phải có cơ chế xử lý lỗi khi service phụ thuộc không khả dụng.

---

# 2. YÊU CẦU VỀ PHIÊN BẢN VÀ MÔI TRƯỜNG

## 2.1. Công nghệ sử dụng

Các phiên bản dưới đây là baseline đề xuất, cần đối chiếu với `pom.xml` hiện có của Shop-Meal trước khi áp dụng.

| Công nghệ | Phiên bản mục tiêu | Mục đích |
|---|---|---|
| Java JDK | 25 | Runtime và biên dịch |
| Spring Boot | 4.1.x | Framework backend |
| Spring Web | Phiên bản tương thích Spring Boot | Xây dựng REST API |
| Spring Security | 7.1.x hoặc phiên bản tương thích | Xác thực và phân quyền |
| Spring Data JPA | Phiên bản tương thích Spring Boot | Truy cập cơ sở dữ liệu quan hệ |
| Spring Data Redis | Phiên bản tương thích Spring Boot | Lưu giỏ hàng bằng Redis nếu lựa chọn |
| Spring Cloud OpenFeign | Phiên bản tương thích Spring Cloud | Gọi API nội bộ nếu sử dụng |
| MySQL | 8.4 LTS | Lưu dữ liệu quan hệ |
| Redis | 7.x hoặc phiên bản đã kiểm thử | Lưu giỏ hàng nếu sử dụng |
| Maven | 3.9.x trở lên | Build và quản lý dependency |
| Lombok | Phiên bản tương thích JDK | Giảm mã lặp |
| MapStruct | 1.6.x nếu sử dụng | Chuyển đổi Entity/DTO |
| Postman | Phiên bản hiện hành | Kiểm thử API |

### Yêu cầu tương thích

- Sử dụng cùng quy ước quản lý phiên bản với các service hiện có.
- Dùng Spring Boot BOM và Spring Cloud BOM tương ứng để quản lý dependency.
- Kiểm tra khả năng tương thích giữa Spring Boot 4.x, Java 25 và các thư viện liên quan.
- Không nâng riêng Spring Cloud OpenFeign vượt khỏi phiên bản tương thích với Spring Cloud đang dùng.
- Nếu dùng Redis, phải thống nhất cấu trúc dữ liệu, thời gian tồn tại và chiến lược phục hồi giỏ hàng.
- Nếu dùng MySQL, phải xác định rõ database riêng cho mỗi service.

## 2.2. Cấu hình môi trường

Mỗi service cần có:

- `pom.xml`
- `application.yml`
- `.env.example` nếu sử dụng biến môi trường
- `.gitignore`
- README hướng dẫn cấu hình và khởi chạy
- Unit test và integration test

Không commit mật khẩu, token, thông tin kết nối nội bộ hoặc các thông tin nhạy cảm vào repository.

---

# 3. KIẾN TRÚC TỔNG THỂ

## 3.1. Sơ đồ kiến trúc

```text
                    FRONTEND
                       |
                       v
                 API GATEWAY
                       |
              +--------+--------+
              |                 |
              v                 v
        CART SERVICE        POST SERVICE
              |                 |
       +------+------+          |
       |             |          |
       v             v          v
    MySQL/Redis  PRODUCT      MySQL
                 SERVICE       |
                               |
                               v
                          FILE SERVICE

Các tích hợp dùng chung:
- Identity Service: xác thực người dùng
- Profile Service: thông tin hồ sơ khi cần
- Product Service: dữ liệu sản phẩm
- File Service: ảnh bài viết và ảnh sản phẩm
```

Sơ đồ trên thể hiện kiến trúc logic. Cart Service và Post Service không bắt buộc phải sử dụng cùng một loại cơ sở dữ liệu.

## 3.2. Giao tiếp giữa các service

**Giao tiếp đồng bộ qua HTTP:**

- Cart Service gọi Product Service để lấy thông tin sản phẩm.
- Post Service gọi Product Service để xác minh sản phẩm tồn tại hoặc lấy thông tin cần thiết.
- Post Service có thể sử dụng File Service khi cần upload hình ảnh.
- Các API có timeout và xử lý lỗi rõ ràng.

**Giao tiếp với cơ sở dữ liệu:**

- Cart Service quản lý dữ liệu giỏ hàng.
- Post Service quản lý dữ liệu bài viết.
- Không truy cập trực tiếp database của service khác.

**Lưu ý:** Nếu một thao tác phải gọi nhiều service, cần xác định rõ cách xử lý khi một bước thất bại. Không giả định có transaction ACID xuyên các service.

---

# 4. TASK-3.1 — CART SERVICE

## 4.1. Thông tin service

**Tên:** `cart-service`

**Trách nhiệm:** Quản lý giỏ hàng của người dùng trong Shop-Meal.

**Cổng đề xuất:** `8085`

**Context path:** `/cart`

**Công nghệ chính:**

- Spring Boot
- Spring Web
- Spring Security hoặc JWT validation
- Spring Data JPA nếu sử dụng MySQL
- Spring Data Redis nếu sử dụng Redis
- OpenFeign hoặc HTTP Client để gọi Product Service
- Lombok và MapStruct nếu cần

Cổng và context path phải thống nhất với cấu hình thực tế của API Gateway và repository.

## 4.2. Nhiệm vụ chính

- [ ] CS-01: Xây dựng entity hoặc model `Cart`.
- [ ] CS-02: Xây dựng model `CartItem`.
- [ ] CS-03: Xác định cách lưu giỏ hàng bằng MySQL, Redis hoặc mô hình kết hợp.
- [ ] CS-04: Xây dựng API lấy giỏ hàng hiện tại.
- [ ] CS-05: Xây dựng API thêm sản phẩm vào giỏ.
- [ ] CS-06: Xây dựng API cập nhật số lượng sản phẩm.
- [ ] CS-07: Xây dựng API xóa một sản phẩm khỏi giỏ.
- [ ] CS-08: Xây dựng API xóa toàn bộ giỏ hàng.
- [ ] CS-09: Tính tổng số lượng và tổng tiền.
- [ ] CS-10: Tích hợp Product Service để lấy thông tin sản phẩm.
- [ ] CS-11: Lưu bản chụp thông tin sản phẩm phục vụ hiển thị.
- [ ] CS-12: Kiểm tra số lượng hợp lệ và trạng thái sản phẩm.
- [ ] CS-13: Bảo đảm người dùng chỉ thao tác trên giỏ hàng của mình.
- [ ] CS-14: Xử lý sản phẩm đã bị xóa hoặc ngừng kinh doanh.
- [ ] CS-15: Kiểm thử nghiệp vụ giỏ hàng và tích hợp.

## 4.3. Kiến trúc nội bộ

```text
Cart Controller
       |
       v
Cart Service
       |
       +--> Cart Repository / Redis Repository
       |                |
       |                v
       |          Cart Storage
       |
       +--> Product Service Client
       |                |
       |                v
       |          Product Service
       |
       +--> Cart Calculator
       |
       +--> Cart Mapper
       |
       +--> Exception Handler
```

### Trách nhiệm từng thành phần

| Thành phần | Trách nhiệm |
|---|---|
| Controller | Nhận request và trả response |
| Service | Xử lý nghiệp vụ giỏ hàng |
| Repository | Lưu và truy vấn giỏ hàng |
| Product Client | Lấy dữ liệu sản phẩm từ Product Service |
| Calculator | Tính tổng tiền và số lượng |
| DTO | Định nghĩa request và response |
| Mapper | Chuyển đổi dữ liệu |
| Exception Handler | Xử lý lỗi nghiệp vụ |

## 4.4. Mô hình dữ liệu

### Cart

| Trường | Kiểu dữ liệu tham khảo | Ý nghĩa |
|---|---|---|
| `id` | UUID/String | ID giỏ hàng |
| `userId` | UUID/String | ID người sở hữu |
| `items` | Danh sách CartItem | Các mặt hàng |
| `totalQuantity` | Integer | Tổng số lượng |
| `totalPrice` | Decimal | Tổng tiền tạm tính |
| `updatedAt` | Timestamp | Thời điểm cập nhật |

### CartItem

| Trường | Kiểu dữ liệu tham khảo | Ý nghĩa |
|---|---|---|
| `id` | UUID/String | ID mặt hàng trong giỏ |
| `productId` | UUID/String | ID sản phẩm gốc |
| `productName` | String | Tên sản phẩm tại thời điểm thêm |
| `unitPrice` | Decimal | Giá được chụp tại thời điểm thêm |
| `imageUrl` | String | Ảnh đại diện |
| `quantity` | Integer | Số lượng |
| `subtotal` | Decimal | Thành tiền tạm tính |

Mô hình thực tế có thể khác tùy lựa chọn lưu trữ. Nếu dùng Redis, không nhất thiết phải tạo đầy đủ entity JPA.

## 4.5. Quy tắc nghiệp vụ giỏ hàng

### Thêm sản phẩm

1. Xác định người dùng từ token đã được xác thực.
2. Nhận `productId` và `quantity`.
3. Gọi Product Service để kiểm tra sản phẩm.
4. Kiểm tra sản phẩm có được phép thêm vào giỏ hay không.
5. Nếu sản phẩm đã có trong giỏ, tăng số lượng theo quy tắc thống nhất.
6. Nếu chưa có, tạo CartItem mới.
7. Tính lại tổng số lượng và tổng tiền.
8. Lưu giỏ hàng và trả kết quả.

### Cập nhật số lượng

- Số lượng phải là số nguyên dương.
- Nếu số lượng bằng 0, API có thể từ chối hoặc chuyển sang thao tác xóa theo hợp đồng đã chọn.
- Không cho phép cập nhật giỏ hàng của người dùng khác.
- Nếu sản phẩm không còn hợp lệ, trả lỗi phù hợp hoặc đánh dấu cần kiểm tra lại.

### Tính tổng tiền

Công thức:

`subtotal = unitPrice × quantity`

`totalPrice = tổng subtotal của các CartItem`

`totalQuantity = tổng quantity của các CartItem`

Sử dụng kiểu số thập phân chính xác như `BigDecimal` trong Java, không dùng `float` hoặc `double` để thực hiện phép tính tiền tệ.

**Quan trọng:** Giá trong giỏ hàng chỉ phục vụ hiển thị và ước tính. Khi tạo đơn hàng, Order Service phải xác minh lại giá hiện hành từ nguồn dữ liệu đáng tin cậy và tính lại tổng tiền. Không tin giá do frontend gửi lên.

## 4.6. Đầu vào (Input)

### Thêm sản phẩm vào giỏ

```http
POST /api/v1/cart/items
Content-Type: application/json
Authorization: Bearer <access-token>
```

```json
{
  "productId": "food-001",
  "quantity": 2
}
```

### Cập nhật số lượng

```http
PATCH /api/v1/cart/items/food-001
Content-Type: application/json
Authorization: Bearer <access-token>
```

```json
{
  "quantity": 3
}
```

Các request trên là hợp đồng đề xuất. Nếu dự án đã có API và DTO khác, phải giữ tương thích với frontend hiện tại.

## 4.7. Đầu ra (Output)

Ví dụ phản hồi giỏ hàng:

```json
{
  "code": 1000,
  "message": "Success",
  "results": {
    "userId": "user-001",
    "items": [
      {
        "productId": "food-001",
        "productName": "Com ga",
        "unitPrice": 45000,
        "imageUrl": "/api/v1/file/file-001",
        "quantity": 2,
        "subtotal": 90000
      }
    ],
    "totalQuantity": 2,
    "totalPrice": 90000
  }
}
```

Đầu ra cần có:

- Danh sách sản phẩm trong giỏ.
- Số lượng từng sản phẩm.
- Giá đơn vị được chụp tại thời điểm thêm hoặc cập nhật.
- Thành tiền từng sản phẩm.
- Tổng số lượng.
- Tổng tiền tạm tính.

Không trả về thông tin nội bộ không cần thiết như đường dẫn lưu trữ Redis hoặc đường dẫn vật lý của tệp.

## 4.8. Kết quả cần đạt

- Người dùng có thể xem giỏ hàng của mình.
- Thêm, sửa số lượng và xóa sản phẩm hoạt động đúng.
- Tổng tiền được tính chính xác.
- Giá do frontend gửi không được tin cậy.
- Dữ liệu giỏ hàng được lưu theo chiến lược đã chọn.
- Lỗi Product Service được xử lý phù hợp.
- Người dùng không thể truy cập giỏ hàng của người khác.
- Giỏ hàng không bị sai lệch khi cập nhật số lượng hoặc thao tác đồng thời.

**Tiêu chí nghiệm thu:** Kiểm thử thêm sản phẩm mới, thêm trùng sản phẩm, số lượng không hợp lệ, cập nhật số lượng, xóa sản phẩm, giỏ hàng rỗng, token không hợp lệ và Product Service không khả dụng.

---

# 5. TASK-3.2 — POST SERVICE

## 5.1. Thông tin service

**Tên:** `post-service`

**Trách nhiệm:** Quản lý các bài viết liên quan đến sản phẩm trên nền tảng Shop-Meal.

**Cổng đề xuất:** `8084`

**Context path:** `/post`

**Cơ sở dữ liệu:** MySQL, ví dụ `post_db`.

**Công nghệ chính:**

- Spring Boot
- Spring Web
- Spring Data JPA
- MySQL Connector
- Spring Security hoặc JWT validation
- OpenFeign hoặc HTTP Client để gọi Product Service
- File Service để xử lý hình ảnh nếu cần
- Lombok và MapStruct nếu sử dụng

## 5.2. Nhiệm vụ chính

- [ ] PT-01: Xây dựng entity `Post`.
- [ ] PT-02: Xây dựng repository bài viết.
- [ ] PT-03: Xây dựng API tạo bài viết.
- [ ] PT-04: Xây dựng API lấy danh sách bài viết.
- [ ] PT-05: Xây dựng API lấy chi tiết bài viết.
- [ ] PT-06: Xây dựng API cập nhật bài viết.
- [ ] PT-07: Xây dựng API xóa bài viết.
- [ ] PT-08: Liên kết bài viết với sản phẩm thông qua `productId`.
- [ ] PT-09: Tích hợp Product Service để kiểm tra sản phẩm.
- [ ] PT-10: Lưu ID người tạo bài viết.
- [ ] PT-11: Quản lý trạng thái bài viết.
- [ ] PT-12: Quản lý hình ảnh hoặc tệp đính kèm thông qua File Service nếu cần.
- [ ] PT-13: Phân quyền tạo, sửa và xóa bài viết.
- [ ] PT-14: Hỗ trợ phân trang và lọc danh sách.
- [ ] PT-15: Xử lý ngoại lệ và kiểm thử nghiệp vụ.

## 5.3. Kiến trúc nội bộ

```text
Post Controller
       |
       v
Post Service
       |
       +--> Post Repository
       |         |
       |         v
       |        MySQL
       |
       +--> Product Service Client
       |         |
       |         v
       |    Product Service
       |
       +--> File Service Client (optional)
       |
       +--> Post Mapper
       |
       +--> Exception Handler
```

### Trách nhiệm từng thành phần

| Thành phần | Trách nhiệm |
|---|---|
| Controller | Tiếp nhận API bài viết |
| Service | Xử lý nghiệp vụ |
| Repository | Lưu và truy vấn bài viết |
| Product Client | Kiểm tra và lấy thông tin sản phẩm |
| File Client | Upload hoặc tham chiếu hình ảnh |
| Mapper | Chuyển đổi Entity/DTO |
| Exception Handler | Chuẩn hóa lỗi |

## 5.4. Mô hình dữ liệu bài viết

| Trường | Kiểu dữ liệu tham khảo | Ý nghĩa |
|---|---|---|
| `id` | UUID/String | ID bài viết |
| `title` | String | Tiêu đề |
| `content` | Text | Nội dung |
| `productId` | UUID/String | Sản phẩm được nhắc đến |
| `authorId` | UUID/String | Người tạo bài viết |
| `images` | Danh sách URL hoặc file ID | Hình ảnh đính kèm |
| `status` | Enum | Trạng thái bài viết |
| `createdAt` | Timestamp | Thời điểm tạo |
| `updatedAt` | Timestamp | Thời điểm cập nhật |

Nếu nghiệp vụ có đánh giá sản phẩm, có thể bổ sung `rating` theo thang điểm đã thống nhất. Nếu bài viết chỉ là nội dung giới thiệu hoặc chia sẻ, không bắt buộc phải có trường này.

## 5.5. Quy tắc nghiệp vụ

### Tạo bài viết

1. Xác thực người dùng.
2. Kiểm tra tiêu đề và nội dung.
3. Kiểm tra `productId` nếu bài viết phải liên kết với sản phẩm.
4. Lưu `authorId` từ danh tính đã xác thực, không tin ID người tạo do frontend tự gửi.
5. Lưu bài viết.
6. Trả về dữ liệu bài viết đã tạo.

### Cập nhật bài viết

- Người dùng chỉ được sửa bài viết của mình, trừ vai trò quản trị.
- Chỉ cập nhật các trường được phép.
- Kiểm tra trạng thái bài viết trước khi sửa nếu có quy trình duyệt.
- Nếu sản phẩm liên kết không tồn tại hoặc đã bị xóa, xử lý theo chính sách đã thống nhất.

### Xóa bài viết

- Kiểm tra quyền người thực hiện.
- Xác định sử dụng xóa vật lý hay soft delete.
- Không xóa sản phẩm gốc khi xóa bài viết.
- Nếu sử dụng soft delete, bài viết đã xóa không xuất hiện trong danh sách công khai.

## 5.6. Đầu vào (Input)

### Tạo bài viết

```http
POST /api/v1/post
Content-Type: application/json
Authorization: Bearer <access-token>
```

```json
{
  "title": "Gioi thieu mon com ga",
  "content": "Mon com ga la mot lua chon phu hop cho bua trua.",
  "productId": "food-001",
  "images": [
    "file-001"
  ]
}
```

Đây là ví dụ minh họa. Tên endpoint và cấu trúc DTO thực tế phải theo repository hiện tại.

Yêu cầu kiểm tra:

- Tiêu đề không được để trống.
- Nội dung đáp ứng giới hạn độ dài.
- `productId` hợp lệ nếu bài viết gắn với sản phẩm.
- Hình ảnh phải là tài nguyên hợp lệ nếu có.
- `authorId` được lấy từ token hoặc danh tính đáng tin cậy.
- Không cho phép người dùng sửa hoặc xóa bài viết không thuộc quyền của mình.

## 5.7. Đầu ra (Output)

Ví dụ phản hồi tạo bài viết:

```json
{
  "code": 1000,
  "message": "Success",
  "results": {
    "id": "post-001",
    "title": "Gioi thieu mon com ga",
    "content": "Mon com ga la mot lua chon phu hop cho bua trua.",
    "productId": "food-001",
    "authorId": "user-001",
    "images": [
      "file-001"
    ],
    "status": "PUBLISHED"
  }
}
```

Trạng thái `PUBLISHED` chỉ là ví dụ. Nếu hệ thống có quy trình duyệt bài, cần sử dụng trạng thái phù hợp như `DRAFT`, `PENDING` hoặc `APPROVED`.

## 5.8. Kết quả cần đạt

- Tạo, đọc, cập nhật và xóa bài viết hoạt động đúng.
- Bài viết được liên kết với sản phẩm bằng ID.
- Không tạo bài viết liên kết với sản phẩm không hợp lệ nếu nghiệp vụ yêu cầu kiểm tra tồn tại.
- Người dùng chỉ sửa hoặc xóa bài viết theo quyền được cấp.
- Bài viết được phân trang khi truy vấn danh sách.
- Thông tin sản phẩm được lấy từ Product Service khi cần, không sao chép toàn bộ dữ liệu sản phẩm làm nguồn dữ liệu chính.
- Hình ảnh được tham chiếu an toàn.
- API trả về lỗi rõ ràng khi dữ liệu không hợp lệ.

**Tiêu chí nghiệm thu:** Kiểm thử tạo bài viết, thiếu tiêu đề, sản phẩm không tồn tại, cập nhật bài viết, quyền sở hữu, xóa bài viết và truy vấn phân trang.

---

# 6. HỢP ĐỒNG GIAO TIẾP GIỮA CÁC SERVICE

## 6.1. Cart Service ↔ Product Service

Cart Service sử dụng Product Service để lấy thông tin sản phẩm khi thêm vào giỏ.

Dữ liệu cần lấy tối thiểu:

- ID sản phẩm.
- Tên sản phẩm.
- Giá bán hiện tại.
- Ảnh đại diện.
- Trạng thái kinh doanh nếu có.

Quy tắc:

- Không lấy giá từ frontend làm giá đáng tin cậy.
- Nếu Product Service không khả dụng, phải xác định rõ có từ chối thêm sản phẩm hay không.
- Không cho phép thêm sản phẩm không tồn tại.
- Giá trong giỏ không thay thế việc xác minh giá ở bước tạo đơn hàng.

## 6.2. Post Service ↔ Product Service

Post Service sử dụng `productId` để liên kết bài viết với sản phẩm.

Quy tắc:

- Product Service là nguồn dữ liệu chính thức.
- Không tạo quan hệ khóa ngoại SQL trực tiếp giữa database của hai service.
- Có thể lưu `productId` trong Post Service.
- Nếu cần hiển thị tên và ảnh sản phẩm, lấy dữ liệu qua API hoặc sử dụng dữ liệu hiển thị đã được chụp theo một chính sách rõ ràng.
- Nếu sản phẩm bị xóa, cần xác định cách hiển thị bài viết liên quan.

## 6.3. Post Service ↔ File Service

Nếu bài viết có ảnh:

1. Client upload ảnh qua API được phép.
2. File Service xác thực và lưu ảnh.
3. File Service trả về `fileId` hoặc URL.
4. Post Service lưu tham chiếu ảnh trong bài viết.
5. Khi hiển thị, frontend sử dụng URL truy xuất hợp lệ.

Không lưu đường dẫn vật lý của file trên server vào nội dung trả về cho client.

## 6.4. Cart Service ↔ Order Service

Khi chuyển từ giỏ hàng sang đơn hàng:

1. Order Service lấy danh sách sản phẩm từ giỏ hàng.
2. Xác minh lại từng sản phẩm và giá hiện tại.
3. Tính lại tổng tiền ở backend.
4. Kiểm tra các quy tắc kinh doanh như sản phẩm ngừng bán.
5. Tạo đơn hàng theo snapshot đã xác minh.
6. Xóa giỏ hàng hoặc đánh dấu đã xử lý theo chính sách của hệ thống.

Không được tin tổng tiền do frontend gửi lên. Nếu quá trình tạo đơn hàng thất bại, cần tránh xóa giỏ hàng trước khi có kết quả phù hợp.

---

# 7. QUY ƯỚC API

## 7.1. Cart Service

| API đề xuất | Phương thức | Chức năng |
|---|---|---|
| `/api/v1/cart` | `GET` | Lấy giỏ hàng hiện tại |
| `/api/v1/cart/items` | `POST` | Thêm sản phẩm |
| `/api/v1/cart/items/{productId}` | `PATCH` | Cập nhật số lượng |
| `/api/v1/cart/items/{productId}` | `DELETE` | Xóa sản phẩm |
| `/api/v1/cart` | `DELETE` | Xóa toàn bộ giỏ hàng |

## 7.2. Post Service

| API đề xuất | Phương thức | Chức năng |
|---|---|---|
| `/api/v1/post` | `POST` | Tạo bài viết |
| `/api/v1/post` | `GET` | Lấy danh sách bài viết |
| `/api/v1/post/{id}` | `GET` | Lấy chi tiết |
| `/api/v1/post/{id}` | `PUT` hoặc `PATCH` | Cập nhật bài viết |
| `/api/v1/post/{id}` | `DELETE` | Xóa bài viết |
| `/api/v1/post/product/{productId}` | `GET` | Lấy bài viết theo sản phẩm |

Các đường dẫn trên là quy ước tham khảo. Cần giữ tương thích với mapping đã có trong source code và cấu hình Gateway.

## 7.3. HTTP status code

| Status | Ý nghĩa |
|---|---|
| 200 | Thành công |
| 201 | Tạo tài nguyên thành công |
| 204 | Thành công, không có nội dung |
| 400 | Dữ liệu đầu vào không hợp lệ |
| 401 | Chưa xác thực hoặc token không hợp lệ |
| 403 | Không đủ quyền |
| 404 | Không tìm thấy tài nguyên |
| 409 | Xung đột dữ liệu |
| 500 | Lỗi nội bộ |
| 502 / 503 | Service phụ thuộc gặp lỗi hoặc tạm thời không khả dụng |

---

# 8. KẾ HOẠCH TRIỂN KHAI TASK-3

## Phase 1 — Chuẩn hóa dữ liệu

- [ ] T3-001: Kiểm tra cấu trúc repository của Cart Service.
- [ ] T3-002: Kiểm tra entity và DTO của Post Service.
- [ ] T3-003: Chốt mô hình lưu giỏ hàng.
- [ ] T3-004: Chốt schema bài viết.
- [ ] T3-005: Thống nhất API với Product Service và File Service.

**Đầu ra:** Mô hình dữ liệu và hợp đồng API được xác định.

## Phase 2 — Cart Service

- [ ] T3-006: Hoàn thiện thêm sản phẩm.
- [ ] T3-007: Hoàn thiện lấy giỏ hàng.
- [ ] T3-008: Hoàn thiện cập nhật số lượng.
- [ ] T3-009: Hoàn thiện xóa sản phẩm và xóa giỏ hàng.
- [ ] T3-010: Hoàn thiện tính tổng tiền.
- [ ] T3-011: Tích hợp Product Service.
- [ ] T3-012: Kiểm thử quyền truy cập và nghiệp vụ giỏ hàng.

**Đầu ra:** Cart Service quản lý giỏ hàng đúng theo người dùng.

## Phase 3 — Post Service

- [ ] T3-013: Hoàn thiện entity và repository bài viết.
- [ ] T3-014: Hoàn thiện API tạo và truy vấn bài viết.
- [ ] T3-015: Hoàn thiện cập nhật và xóa bài viết.
- [ ] T3-016: Tích hợp Product Service.
- [ ] T3-017: Tích hợp File Service nếu cần.
- [ ] T3-018: Hoàn thiện phân quyền và validation.
- [ ] T3-019: Kiểm thử các API bài viết.

**Đầu ra:** Post Service quản lý bài viết và liên kết sản phẩm chính xác.

## Phase 4 — Tích hợp hệ thống

- [ ] T3-020: Cấu hình Gateway route.
- [ ] T3-021: Kiểm thử các API thông qua Gateway.
- [ ] T3-022: Kiểm thử Cart Service với Product Service.
- [ ] T3-023: Kiểm thử Post Service với Product Service.
- [ ] T3-024: Kiểm thử Post Service với File Service.
- [ ] T3-025: Kiểm thử luồng chuyển giỏ hàng sang đơn hàng.

**Đầu ra:** Các service hoạt động đúng trong hệ thống Shop-Meal.

## Phase 5 — Hoàn thiện và bàn giao

- [ ] T3-026: Hoàn thiện unit test.
- [ ] T3-027: Hoàn thiện integration test.
- [ ] T3-028: Hoàn thiện Postman collection.
- [ ] T3-029: Hoàn thiện README cho từng service.
- [ ] T3-030: Kiểm tra cấu hình môi trường và bí mật.
- [ ] T3-031: Kiểm thử khởi động toàn bộ hệ thống.

**Đầu ra:** Hai service có thể chạy, kiểm thử và tích hợp theo tài liệu.

---

# 9. TIÊU CHÍ HOÀN THÀNH TASK-3

## Cart Service

- [ ] Build thành công.
- [ ] Kết nối được với hệ thống lưu trữ đã chọn.
- [ ] Thêm sản phẩm vào giỏ.
- [ ] Cập nhật số lượng.
- [ ] Xóa sản phẩm và xóa giỏ hàng.
- [ ] Tính tổng tiền chính xác.
- [ ] Xác định người dùng từ danh tính đã xác thực.
- [ ] Xử lý lỗi Product Service.
- [ ] Có unit test và integration test.
- [ ] Có README và tài liệu API.

## Post Service

- [ ] Build thành công.
- [ ] Kết nối MySQL thành công.
- [ ] Tạo, đọc, cập nhật và xóa bài viết.
- [ ] Liên kết bài viết với sản phẩm.
- [ ] Kiểm tra quyền sở hữu bài viết.
- [ ] Hỗ trợ phân trang khi lấy danh sách.
- [ ] Tích hợp File Service nếu chức năng ảnh được yêu cầu.
- [ ] Có unit test và integration test.
- [ ] Có README và tài liệu API.

## Tích hợp hệ thống

- [ ] Gateway định tuyến đúng.
- [ ] JWT được kiểm tra đúng.
- [ ] Không truy cập trực tiếp database của service khác.
- [ ] Có xử lý lỗi khi service phụ thuộc không khả dụng.
- [ ] Không có lỗi nghiêm trọng chưa xử lý.

---

# 10. KẾT QUẢ BÀN GIAO CUỐI CÙNG

| Thành phần | Kết quả cần đạt |
|---|---|
| Cart Service | Quản lý giỏ hàng và tính tổng tiền tạm tính |
| Post Service | Quản lý bài viết liên quan đến sản phẩm |
| Product Service Integration | Lấy dữ liệu sản phẩm theo ID |
| File Service Integration | Tham chiếu hình ảnh an toàn khi cần |
| API Gateway | Định tuyến API giỏ hàng và bài viết |
| Security | Bảo vệ dữ liệu người dùng và quyền sửa bài |
| Testing | Có kiểm thử chức năng và tích hợp |
| Documentation | Có README, API và hướng dẫn triển khai |

**Kết quả cuối cùng:** Người dùng có thể quản lý giỏ hàng cá nhân, xem và cập nhật số lượng sản phẩm, đồng thời tạo và xem các bài viết liên quan đến sản phẩm. Các chức năng phải hoạt động thông qua API được quy định và không làm phá vỡ tính độc lập của các microservice.

---

# 11. QUY ĐỊNH QUẢN LÝ TASK

Mỗi task cần có các trường:

- **Task ID:** Mã định danh duy nhất.
- **Service:** Service phụ trách.
- **Description:** Nội dung công việc.
- **Input:** Dữ liệu hoặc điều kiện đầu vào.
- **Output:** Kết quả đầu ra.
- **Acceptance Criteria:** Điều kiện nghiệm thu.
- **Priority:** Mức độ ưu tiên.
- **Status:** Trạng thái thực hiện.
- **Dependencies:** Task phụ thuộc.

Trạng thái sử dụng:

- `TODO`: Chưa thực hiện.
- `IN_PROGRESS`: Đang thực hiện.
- `BLOCKED`: Đang bị chặn.
- `REVIEW`: Chờ kiểm tra.
- `DONE`: Đã hoàn thành và nghiệm thu.

**Nguyên tắc nghiệm thu:** Một task chỉ được đánh dấu `DONE` khi mã nguồn hoạt động đúng, kết quả đầu ra đáp ứng yêu cầu và các tiêu chí nghiệm thu đã được kiểm tra.

---

**End of Document — Shop-Meal TASK-3 v1.0.0**