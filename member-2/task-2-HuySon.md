# SHOP-MEAL — TASK-2: PRODUCT SERVICE & SEARCH SERVICE HUYSON

**Project:** Shop-Meal  
**Task:** TASK-2 — Product Management & Search  
**Architecture:** Microservices  
**Backend:** Java + Spring Boot  
**Version:** 1.0.0

---

# 1. MỤC TIÊU TASK-2

Xây dựng hệ thống quản lý sản phẩm và tìm kiếm sản phẩm cho Shop-Meal, bao gồm hai service độc lập:

1. **Product Service:** Quản lý dữ liệu sản phẩm, danh mục, giá bán, hình ảnh và thông tin liên quan.
2. **Search Service:** Cung cấp khả năng tìm kiếm sản phẩm dựa trên dữ liệu đã được lập chỉ mục trong Elasticsearch.

Hai service cần phối hợp để bảo đảm dữ liệu sản phẩm được quản lý tập trung tại Product Service và được đồng bộ sang Search Service khi có thay đổi.

## 1.1. Phạm vi chức năng

| Service | Chức năng chính |
|---|---|
| Product Service | Tạo, đọc, cập nhật, xóa và quản lý sản phẩm |
| Search Service | Tìm kiếm, lọc và sắp xếp sản phẩm |
| Kafka | Truyền sự kiện sản phẩm giữa các service |
| Elasticsearch | Lưu chỉ mục phục vụ tìm kiếm |
| API Gateway | Định tuyến request từ frontend đến backend |

## 1.2. Nguyên tắc thiết kế

- Product Service là nguồn dữ liệu chính thức của sản phẩm.
- Search Service không được sử dụng Elasticsearch làm nguồn dữ liệu nghiệp vụ chính.
- Search Service chỉ quản lý dữ liệu phục vụ truy vấn tìm kiếm.
- Product Service không phụ thuộc trực tiếp vào Elasticsearch.
- Các service giao tiếp qua API hoặc sự kiện Kafka theo hợp đồng đã thống nhất.
- Không chia sẻ trực tiếp entity hoặc repository giữa các service.
- Việc đồng bộ dữ liệu phải có khả năng xử lý sự kiện trùng lặp và lỗi tạm thời.
- Việc xóa sản phẩm phải được đồng bộ sang chỉ mục tìm kiếm.

---

# 2. YÊU CẦU VỀ PHIÊN BẢN VÀ MÔI TRƯỜNG

## 2.1. Công nghệ sử dụng

Các phiên bản dưới đây là baseline tham khảo. Khi triển khai phải đối chiếu với `pom.xml` và môi trường hiện có của Shop-Meal.

| Công nghệ | Phiên bản mục tiêu | Mục đích |
|---|---|---|
| Java JDK | 25 | Runtime và biên dịch |
| Spring Boot | 4.1.x | Framework backend |
| Spring Data JPA | Phiên bản tương thích Spring Boot | Truy cập MySQL |
| Spring Kafka | Phiên bản tương thích Spring Boot | Gửi và nhận sự kiện |
| Spring Cloud | 2025.1.x nếu cần các tích hợp Cloud | Quản lý thành phần Cloud |
| MySQL | 8.4 LTS | Lưu trữ dữ liệu sản phẩm |
| Elasticsearch | 9.2.x nếu đang sử dụng | Tìm kiếm toàn văn |
| Apache Kafka | Phiên bản tương thích với client đã chọn | Truyền sự kiện |
| Maven | 3.9.x trở lên | Build và quản lý dependency |
| Docker | Phiên bản tương thích môi trường | Chạy hạ tầng |
| Postman | Phiên bản hiện hành | Kiểm thử API |

### Yêu cầu tương thích

- Giữ đồng bộ phiên bản Spring Boot giữa các module theo cấu hình thực tế của dự án.
- Sử dụng dependency management của Spring Boot và Spring Cloud, không tự ý nâng phiên bản thư viện riêng lẻ.
- Elasticsearch Java Client phải tương thích với Elasticsearch server.
- Kafka producer và consumer phải thống nhất serializer, deserializer và cấu trúc message.
- Không được giả định Spring Boot 4.x tương thích với mọi phiên bản Spring Cloud chỉ vì số phiên bản gần nhau.
- Các phiên bản trong tài liệu là mục tiêu tham khảo, không thay thế việc kiểm tra dependency thực tế.

## 2.2. Cấu hình môi trường

Mỗi service cần có:

- `pom.xml`
- `application.yml`
- `.env.example` nếu sử dụng biến môi trường
- `.gitignore`
- README hướng dẫn khởi chạy
- Unit test và integration test phù hợp

Các thông tin nhạy cảm như mật khẩu MySQL, thông tin xác thực Elasticsearch và Kafka không được hard-code vào mã nguồn.

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
       PRODUCT SERVICE     SEARCH SERVICE
              |                 ^
              |                 |
              v                 |
            MySQL               |
              |                 |
              | Product Events  |
              v                 |
             Kafka -------------+
                                |
                                v
                         Elasticsearch
```

Luồng dữ liệu:

1. Frontend gửi request quản lý sản phẩm qua API Gateway.
2. Product Service kiểm tra dữ liệu và thực hiện thao tác với MySQL.
3. Khi sản phẩm được tạo, cập nhật hoặc xóa, hệ thống phát sự kiện tương ứng.
4. Search Service nhận sự kiện từ Kafka.
5. Search Service cập nhật hoặc xóa tài liệu trong Elasticsearch.
6. Frontend gửi yêu cầu tìm kiếm đến Search Service thông qua API Gateway.
7. Search Service truy vấn Elasticsearch và trả kết quả.

**Lưu ý:** Việc ghi MySQL và phát Kafka không nên được triển khai như hai thao tác độc lập không có cơ chế khôi phục. Nên cân nhắc Transactional Outbox hoặc cơ chế retry và đối soát dữ liệu để tránh trường hợp MySQL đã cập nhật nhưng sự kiện không được gửi.

---

# 4. TASK-2.1 — PRODUCT SERVICE

## 4.1. Thông tin service

**Tên:** `product-service`

**Trách nhiệm:** Quản lý dữ liệu sản phẩm và cung cấp API cho các nghiệp vụ liên quan đến sản phẩm.

**Cổng đề xuất:** `8083`

**Cơ sở dữ liệu:** MySQL, ví dụ `product_db`.

**Công nghệ chính:**

- Spring Boot
- Spring Web
- Spring Data JPA
- MySQL Connector
- Bean Validation
- Spring Kafka Producer
- Lombok
- MapStruct nếu sử dụng

Tên cổng và database phải được giữ đúng theo cấu hình thực tế của repository.

## 4.2. Nhiệm vụ chính

- [ ] PS-01: Xây dựng entity `Food` hoặc entity sản phẩm tương ứng.
- [ ] PS-02: Xây dựng repository thao tác với MySQL.
- [ ] PS-03: Xây dựng API tạo sản phẩm.
- [ ] PS-04: Xây dựng API lấy danh sách sản phẩm.
- [ ] PS-05: Xây dựng API lấy chi tiết sản phẩm theo ID.
- [ ] PS-06: Xây dựng API cập nhật sản phẩm.
- [ ] PS-07: Xây dựng API xóa sản phẩm.
- [ ] PS-08: Kiểm tra dữ liệu đầu vào và tính hợp lệ của giá bán.
- [ ] PS-09: Quản lý hình ảnh và thông tin danh mục.
- [ ] PS-10: Phân quyền các API quản lý sản phẩm.
- [ ] PS-11: Phát sự kiện Kafka khi dữ liệu sản phẩm thay đổi.
- [ ] PS-12: Chuẩn hóa response và xử lý ngoại lệ.
- [ ] PS-13: Viết unit test và integration test.

## 4.3. Kiến trúc nội bộ

```text
Product Controller
        |
        v
Product Service
        |
        +--> Product Repository
        |          |
        |          v
        |         MySQL
        |
        +--> Product Mapper
        |
        +--> Product Event Publisher
                   |
                   v
                  Kafka
```

### Trách nhiệm từng thành phần

| Thành phần | Trách nhiệm |
|---|---|
| Controller | Nhận request và trả response |
| Service | Xử lý nghiệp vụ sản phẩm |
| Repository | Truy vấn và lưu dữ liệu MySQL |
| Entity | Mô hình dữ liệu sản phẩm |
| DTO | Định nghĩa dữ liệu đầu vào và đầu ra |
| Mapper | Chuyển đổi Entity và DTO |
| Event Publisher | Phát sự kiện đồng bộ dữ liệu tìm kiếm |
| Exception Handler | Xử lý lỗi và chuẩn hóa phản hồi |

## 4.4. Mô hình dữ liệu sản phẩm

Các trường đề xuất dựa trên nghiệp vụ Shop-Meal:

| Trường | Kiểu dữ liệu tham khảo | Ý nghĩa |
|---|---|---|
| `id` | String/UUID | Định danh sản phẩm |
| `name` | String | Tên sản phẩm |
| `description` | Text | Mô tả |
| `price` | Decimal | Giá bán |
| `images` | Danh sách URL hoặc file ID | Hình ảnh |
| `type` | String/Enum | Loại sản phẩm |
| `categories` | Danh sách ID hoặc quan hệ | Danh mục |
| `position` | String hoặc kiểu phù hợp | Vị trí/phân loại nếu nghiệp vụ yêu cầu |
| `timeWork` | Kiểu phù hợp | Thời gian hoạt động nếu nghiệp vụ yêu cầu |
| `createdAt` | Timestamp | Thời điểm tạo |
| `updatedAt` | Timestamp | Thời điểm cập nhật |

Cấu trúc cuối cùng phải khớp với entity `Food` hiện có. Không thêm các trường chỉ vì xuất hiện trong tài liệu nếu nghiệp vụ không sử dụng.

## 4.5. Đầu vào (Input)

### Tạo sản phẩm

Ví dụ:

```http
POST /api/v1/product
Content-Type: application/json
Authorization: Bearer <access-token>
```

```json
{
  "name": "Com ga",
  "description": "Com ga chien gion",
  "price": 45000,
  "images": [
    "file-id-001"
  ],
  "type": "FOOD",
  "categories": [
    "category-001"
  ]
}
```

Đây là request minh họa; tên endpoint và cấu trúc DTO phải theo API thực tế.

Yêu cầu kiểm tra:

- Tên sản phẩm không được để trống.
- Giá bán không âm.
- Danh mục phải hợp lệ nếu có liên kết danh mục.
- ID phải duy nhất.
- Hình ảnh phải tham chiếu đến tài nguyên hợp lệ nếu sử dụng File Service.
- Các API tạo, sửa, xóa phải kiểm tra quyền người dùng.

### Cập nhật sản phẩm

Input gồm ID sản phẩm và các trường được phép cập nhật.

Hệ thống cần phân biệt rõ:

- `PUT`: thay thế tài nguyên theo hợp đồng API.
- `PATCH`: cập nhật một phần tài nguyên.

### Xóa sản phẩm

Input gồm ID sản phẩm. Nếu sản phẩm không tồn tại, phải trả lỗi thích hợp.

Nếu sử dụng soft delete, Search Service phải nhận được trạng thái hoặc sự kiện để loại sản phẩm khỏi kết quả tìm kiếm.

## 4.6. Đầu ra (Output)

Ví dụ response tạo sản phẩm:

```json
{
  "code": 1000,
  "message": "Success",
  "results": {
    "id": "food-001",
    "name": "Com ga",
    "price": 45000
  }
}
```

Ví dụ response lấy danh sách:

```json
{
  "code": 1000,
  "message": "Success",
  "results": [
    {
      "id": "food-001",
      "name": "Com ga",
      "price": 45000
    }
  ]
}
```

Các trường đầu ra phải được quy định bằng DTO, không trả về trực tiếp dữ liệu nội bộ không cần thiết.

## 4.7. Sự kiện Kafka

Product Service cần phát sự kiện theo các thao tác nghiệp vụ.

Tên sự kiện đề xuất:

- `PRODUCT_CREATED`
- `PRODUCT_UPDATED`
- `PRODUCT_DELETED`

Ví dụ payload:

```json
{
  "eventId": "event-001",
  "eventType": "PRODUCT_CREATED",
  "productId": "food-001",
  "occurredAt": "2026-10-15T10:00:00Z",
  "data": {
    "id": "food-001",
    "name": "Com ga",
    "description": "Com ga chien gion",
    "price": 45000,
    "images": [
      "file-id-001"
    ],
    "type": "FOOD",
    "categories": [
      "category-001"
    ]
  }
}
```

Yêu cầu:

- `eventId` duy nhất.
- `eventType` được quy định thống nhất.
- `productId` phải xác định được tài nguyên.
- Consumer phải phân biệt sự kiện tạo, cập nhật và xóa.
- Cần có cơ chế retry hoặc đối soát khi sự kiện bị mất.
- Không phát sự kiện tạo/cập nhật nếu thao tác nghiệp vụ thất bại.
- Nếu hệ thống có dữ liệu cũ chưa được lập chỉ mục, phải có quy trình backfill riêng.

## 4.8. Kết quả cần đạt

- Quản lý sản phẩm bằng MySQL.
- API tạo, đọc, cập nhật và xóa hoạt động đúng.
- Dữ liệu được kiểm tra hợp lệ.
- Quyền quản lý sản phẩm được kiểm soát.
- Sự kiện được phát theo hợp đồng đã thống nhất.
- Search Service có thể sử dụng sự kiện để cập nhật chỉ mục.
- Các lỗi nghiệp vụ được trả về rõ ràng.

**Tiêu chí nghiệm thu:** Kiểm thử CRUD, ID không tồn tại, dữ liệu sai, giá âm, thiếu quyền, lỗi cơ sở dữ liệu và phát sự kiện sau thay đổi dữ liệu.

---

# 5. TASK-2.2 — SEARCH SERVICE

## 5.1. Thông tin service

**Tên:** `search-service`

**Trách nhiệm:** Cung cấp API tìm kiếm sản phẩm dựa trên chỉ mục Elasticsearch.

**Cổng đề xuất:** `8086`

**Công nghệ chính:**

- Spring Boot
- Elasticsearch Java Client hoặc thư viện Spring Data Elasticsearch tương thích
- Apache Kafka Consumer
- Elasticsearch
- Bean Validation
- Spring Security nếu API cần bảo vệ

Search Service không phải nơi quản lý dữ liệu sản phẩm chính thức. Mọi dữ liệu được lập chỉ mục cần xuất phát từ Product Service hoặc quy trình đồng bộ đã được phê duyệt.

## 5.2. Nhiệm vụ chính

- [ ] SS-01: Cấu hình kết nối Elasticsearch.
- [ ] SS-02: Xây dựng mapping cho chỉ mục sản phẩm.
- [ ] SS-03: Xây dựng API tìm kiếm theo từ khóa.
- [ ] SS-04: Hỗ trợ phân trang.
- [ ] SS-05: Hỗ trợ sắp xếp theo tiêu chí được quy định.
- [ ] SS-06: Hỗ trợ lọc theo danh mục, loại sản phẩm hoặc khoảng giá nếu cần.
- [ ] SS-07: Xây dựng Kafka Consumer nhận sự kiện sản phẩm.
- [ ] SS-08: Thực hiện upsert tài liệu khi sản phẩm được tạo hoặc cập nhật.
- [ ] SS-09: Xóa tài liệu khi sản phẩm bị xóa.
- [ ] SS-10: Xử lý sự kiện trùng lặp và sự kiện đến sai thứ tự.
- [ ] SS-11: Xây dựng quy trình lập chỉ mục dữ liệu ban đầu.
- [ ] SS-12: Xử lý lỗi Elasticsearch hoặc Kafka.
- [ ] SS-13: Viết unit test và integration test.

## 5.3. Kiến trúc nội bộ

```text
Search Controller
        |
        v
Search Service
        |
        v
Elasticsearch Client
        |
        v
Elasticsearch Index

Kafka Consumer
        |
        v
Product Event Handler
        |
        v
Indexing Service
        |
        v
Elasticsearch Index
```

Search Service gồm hai luồng chính:

1. **Search API:** Nhận request tìm kiếm và truy vấn Elasticsearch.
2. **Indexing Consumer:** Nhận sự kiện từ Product Service và cập nhật chỉ mục.

Hai luồng này cần được kiểm thử độc lập.

## 5.4. Thiết kế chỉ mục Elasticsearch

Tên chỉ mục đề xuất: `products`.

Mapping có thể bao gồm:

| Trường | Kiểu Elasticsearch tham khảo | Mục đích |
|---|---|---|
| `id` | `keyword` | Định danh |
| `name` | `text` | Tìm kiếm toàn văn |
| `description` | `text` | Tìm kiếm mô tả |
| `price` | `scaled_float` hoặc `double` | Lọc và sắp xếp giá |
| `images` | `keyword` hoặc cấu trúc phù hợp | Lưu tham chiếu ảnh |
| `type` | `keyword` | Lọc theo loại |
| `categories` | `keyword` | Lọc theo danh mục |
| `updatedAt` | `date` | Đối soát và quản lý phiên bản |

Mapping phải phù hợp với dữ liệu thực tế. Nếu cần tìm kiếm tiếng Việt không dấu, cần thiết kế analyzer và quy tắc chuẩn hóa phù hợp thay vì giả định analyzer mặc định sẽ xử lý hoàn hảo.

## 5.5. Đầu vào (Input)

Ví dụ API tìm kiếm:

```http
GET /api/v1/search?keyword=com%20ga&page=0&size=10
```

Các tham số đề xuất:

| Tham số | Ý nghĩa |
|---|---|
| `keyword` | Từ khóa tìm kiếm |
| `page` | Trang hiện tại |
| `size` | Số kết quả mỗi trang |
| `sortBy` | Trường sắp xếp được cho phép |
| `direction` | `asc` hoặc `desc` |
| `category` | Lọc theo danh mục |
| `minPrice` | Giá thấp nhất |
| `maxPrice` | Giá cao nhất |

Các tham số lọc chỉ cần triển khai nếu thuộc phạm vi nghiệp vụ.

Yêu cầu kiểm tra:

- `page` không âm.
- `size` không vượt giới hạn cấu hình.
- Giá thấp nhất không lớn hơn giá cao nhất.
- Chỉ chấp nhận các trường sắp xếp nằm trong danh sách cho phép.
- Từ khóa phải được xử lý an toàn, không tạo query tùy ý từ input.

## 5.6. Đầu ra (Output)

Ví dụ response:

```json
{
  "code": 1000,
  "message": "Success",
  "results": {
    "content": [
      {
        "id": "food-001",
        "name": "Com ga",
        "description": "Com ga chien gion",
        "price": 45000,
        "images": [
          "file-id-001"
        ],
        "categories": [
          "category-001"
        ]
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

Khi không tìm thấy kết quả, trả về danh sách rỗng và thông tin phân trang hợp lệ. Không nên xem trường hợp không có kết quả là lỗi hệ thống.

## 5.7. Đồng bộ dữ liệu qua Kafka

Search Service cần xử lý ba loại sự kiện:

| Sự kiện | Hành động |
|---|---|
| `PRODUCT_CREATED` | Tạo tài liệu trong chỉ mục |
| `PRODUCT_UPDATED` | Cập nhật hoặc upsert tài liệu |
| `PRODUCT_DELETED` | Xóa tài liệu hoặc đánh dấu không còn hoạt động |

### Quy tắc xử lý

- Sử dụng ID sản phẩm làm document ID để việc upsert ổn định.
- Xử lý lặp cùng một sự kiện không được tạo nhiều tài liệu trùng nhau.
- Có chính sách xử lý sự kiện đến sai thứ tự.
- Chỉ commit offset theo chiến lược bảo đảm message đã được xử lý theo thiết kế.
- Lỗi tạm thời cần được retry có kiểm soát.
- Sự kiện không hợp lệ cần được ghi nhận và có phương án xử lý.
- Không để một sự kiện lỗi làm consumer dừng vĩnh viễn mà không có giám sát.

Để giải quyết sự kiện đến sai thứ tự, có thể bổ sung `version` tăng dần hoặc `updatedAt` đáng tin cậy vào sự kiện. Khi đó Search Service chỉ áp dụng bản cập nhật mới hơn theo quy tắc đã thống nhất.

## 5.8. Đồng bộ dữ liệu ban đầu

Trước khi bật chức năng tìm kiếm, các sản phẩm đã tồn tại trong MySQL phải được lập chỉ mục.

Quy trình đề xuất:

1. Truy vấn danh sách sản phẩm hiện có từ Product Service.
2. Chuyển đổi dữ liệu sang document tìm kiếm.
3. Ghi dữ liệu vào Elasticsearch.
4. Kiểm tra số lượng bản ghi và các trường quan trọng.
5. Bật hoặc tiếp tục consumer Kafka.
6. Đối soát lại dữ liệu trong trường hợp có cập nhật đồng thời.

Không nên dựa vào việc gửi sự kiện tạo sản phẩm một lần duy nhất để xử lý toàn bộ dữ liệu cũ. Cần có một quy trình backfill có thể chạy lại và không tạo bản ghi trùng.

Nếu hệ thống đang sử dụng sự kiện `ADD_SEARCH` để nạp dữ liệu ban đầu, cần xác định rõ đây là cơ chế migration/backfill tạm thời hay một phần của giao thức lâu dài. Sau khi hoàn thành, phải lưu lại cách tái lập chỉ mục để có thể phục hồi khi cần.

## 5.9. Kết quả cần đạt

- Tìm kiếm sản phẩm bằng từ khóa.
- Trả về kết quả phân trang.
- Lọc và sắp xếp theo các trường được hỗ trợ.
- Elasticsearch được cập nhật từ sự kiện sản phẩm.
- Sản phẩm bị xóa không còn xuất hiện trong kết quả.
- Dữ liệu cũ có thể được lập chỉ mục lại.
- Có cơ chế phát hiện và khôi phục sai lệch dữ liệu.
- Search API vẫn trả về lỗi phù hợp khi Elasticsearch tạm thời không khả dụng.

**Tiêu chí nghiệm thu:** Kiểm thử tìm thấy/không tìm thấy, phân trang, lọc, cập nhật sản phẩm, xóa sản phẩm, sự kiện trùng, sự kiện sai thứ tự và đồng bộ dữ liệu ban đầu.

---

# 6. HỢP ĐỒNG GIAO TIẾP GIỮA PRODUCT VÀ SEARCH

## 6.1. Product Service → Kafka → Search Service

Hợp đồng sự kiện phải xác định:

- Tên topic.
- Tên sự kiện.
- Schema payload.
- Kiểu dữ liệu ID.
- Trường version hoặc thời điểm cập nhật.
- Chính sách retry.
- Chính sách xử lý message trùng.
- Chính sách xử lý message không hợp lệ.

Tên topic đề xuất: `product-events`.

Tên topic và cấu trúc payload cần được thống nhất với cấu hình Kafka thực tế.

## 6.2. Tính nhất quán dữ liệu

Dữ liệu trong MySQL và Elasticsearch không nhất thiết được cập nhật đồng thời. Kiến trúc này chấp nhận eventual consistency: sau khi Product Service thay đổi dữ liệu, Search Service cần một khoảng thời gian để cập nhật chỉ mục.

Các yêu cầu:

- Không cam kết kết quả tìm kiếm thay đổi tức thời nếu chưa có cơ chế bảo đảm.
- Theo dõi độ trễ đồng bộ.
- Có thể chạy lại quá trình lập chỉ mục.
- Có khả năng đối soát số lượng và trạng thái sản phẩm.
- Không cho phép Search Service ghi ngược dữ liệu nghiệp vụ vào Product Service thông qua Elasticsearch.

---

# 7. QUY ƯỚC API VÀ XỬ LÝ LỖI

## 7.1. API Product Service

| API | Phương thức | Chức năng |
|---|---|---|
| `/api/v1/product` | `POST` | Tạo sản phẩm |
| `/api/v1/product` | `GET` | Lấy danh sách |
| `/api/v1/product/{id}` | `GET` | Lấy chi tiết |
| `/api/v1/product/{id}` | `PUT` hoặc `PATCH` | Cập nhật |
| `/api/v1/product/{id}` | `DELETE` | Xóa sản phẩm |

Đây là đường dẫn công khai đề xuất. Gateway có thể rewrite prefix để phù hợp với context path thực tế.

## 7.2. API Search Service

| API | Phương thức | Chức năng |
|---|---|---|
| `/api/v1/search` | `GET` | Tìm kiếm sản phẩm |
| `/api/v1/search/{id}` | `GET` | Lấy document theo ID nếu cần |
| `/internal/search/reindex` | `POST` | Yêu cầu lập chỉ mục lại nếu được triển khai |

API reindex cần được bảo vệ, không công khai cho người dùng thông thường.

## 7.3. HTTP status code

| Status | Ý nghĩa |
|---|---|
| 200 | Thành công |
| 201 | Tạo sản phẩm thành công |
| 400 | Dữ liệu đầu vào không hợp lệ |
| 401 | Chưa xác thực hoặc token không hợp lệ |
| 403 | Không đủ quyền |
| 404 | Không tìm thấy sản phẩm |
| 409 | Xung đột dữ liệu |
| 500 | Lỗi nội bộ |
| 502 / 503 | Lỗi hoặc dịch vụ phụ thuộc không khả dụng |

Search API trả danh sách rỗng khi không có kết quả, không nhất thiết trả `404`.

---

# 8. KẾ HOẠCH TRIỂN KHAI TASK-2

## Phase 1 — Chuẩn bị dữ liệu và hợp đồng

- [ ] T2-001: Kiểm tra entity sản phẩm hiện tại.
- [ ] T2-002: Chốt DTO tạo, cập nhật và trả về sản phẩm.
- [ ] T2-003: Chốt schema sự kiện Kafka.
- [ ] T2-004: Chốt mapping Elasticsearch.
- [ ] T2-005: Xác định API public và internal.

**Đầu ra:** Mô hình dữ liệu và hợp đồng giao tiếp được thống nhất.

## Phase 2 — Product Service

- [ ] T2-006: Hoàn thiện CRUD sản phẩm.
- [ ] T2-007: Hoàn thiện validation.
- [ ] T2-008: Hoàn thiện phân quyền.
- [ ] T2-009: Phát sự kiện Kafka.
- [ ] T2-010: Kiểm thử CRUD và event publishing.

**Đầu ra:** Product Service quản lý dữ liệu chính thức và phát sự kiện theo thiết kế.

## Phase 3 — Search Service

- [ ] T2-011: Cấu hình Elasticsearch.
- [ ] T2-012: Tạo mapping và chỉ mục `products`.
- [ ] T2-013: Xây dựng API tìm kiếm.
- [ ] T2-014: Xây dựng Kafka Consumer.
- [ ] T2-015: Xử lý sự kiện tạo, cập nhật và xóa.
- [ ] T2-016: Xây dựng cơ chế retry và xử lý trùng lặp.
- [ ] T2-017: Kiểm thử search và indexing.

**Đầu ra:** Search Service truy vấn Elasticsearch và đồng bộ sản phẩm từ Kafka.

## Phase 4 — Đồng bộ dữ liệu cũ

- [ ] T2-018: Xây dựng quy trình backfill.
- [ ] T2-019: Nạp các sản phẩm đã có vào Elasticsearch.
- [ ] T2-020: Đối soát dữ liệu giữa MySQL và Elasticsearch.
- [ ] T2-021: Kiểm thử chạy lại quy trình backfill.

**Đầu ra:** Tất cả sản phẩm hợp lệ hiện có đều có thể tìm kiếm theo chính sách lập chỉ mục.

## Phase 5 — Tích hợp và nghiệm thu

- [ ] T2-022: Cấu hình Gateway route.
- [ ] T2-023: Kiểm thử API qua Gateway.
- [ ] T2-024: Kiểm thử sự kiện Kafka end-to-end.
- [ ] T2-025: Kiểm thử lỗi Elasticsearch và Kafka.
- [ ] T2-026: Hoàn thiện README từng service.
- [ ] T2-027: Hoàn thiện tài liệu chạy hệ thống.

**Đầu ra:** Product và Search hoạt động độc lập, tích hợp đúng và có thể kiểm thử lại.

---

# 9. TIÊU CHÍ HOÀN THÀNH TASK-2

TASK-2 được nghiệm thu khi đáp ứng tất cả các điều kiện sau:

- [ ] Product Service build thành công.
- [ ] Search Service build thành công.
- [ ] Product Service kết nối MySQL.
- [ ] Search Service kết nối Elasticsearch.
- [ ] CRUD sản phẩm hoạt động đúng.
- [ ] Search API hoạt động đúng.
- [ ] Kafka producer và consumer giao tiếp đúng schema.
- [ ] Tạo sản phẩm mới có thể xuất hiện trong kết quả tìm kiếm.
- [ ] Cập nhật sản phẩm được phản ánh trong Elasticsearch.
- [ ] Xóa sản phẩm được phản ánh trong Elasticsearch.
- [ ] Dữ liệu cũ có quy trình backfill.
- [ ] Xử lý được sự kiện trùng hoặc có phương án khôi phục rõ ràng.
- [ ] Có kiểm thử lỗi và phân quyền.
- [ ] Có README và cấu hình môi trường.
- [ ] Không có lỗi nghiêm trọng chưa xử lý.

---

# 10. KẾT QUẢ BÀN GIAO CUỐI CÙNG

| Thành phần | Kết quả cần đạt |
|---|---|
| Product Service | Quản lý dữ liệu sản phẩm tập trung trong MySQL |
| Search Service | Tìm kiếm sản phẩm dựa trên Elasticsearch |
| Kafka | Truyền sự kiện sản phẩm |
| Elasticsearch | Lưu chỉ mục tìm kiếm |
| API Gateway | Định tuyến API quản lý và tìm kiếm sản phẩm |
| Backfill | Nạp và khôi phục chỉ mục dữ liệu cũ |
| Testing | Có kiểm thử chức năng và tích hợp |
| Documentation | Có tài liệu cấu hình, API và triển khai |

**Kết quả cuối cùng:** Khi quản trị viên tạo, cập nhật hoặc xóa sản phẩm qua Product Service, hệ thống phải có cơ chế đồng bộ thay đổi sang Search Service. Người dùng có thể tìm kiếm sản phẩm thông qua API Gateway mà không cần truy cập trực tiếp MySQL hoặc Elasticsearch.

---

## 11. QUY ĐỊNH QUẢN LÝ TASK

Mỗi task cần có:

- **Task ID:** Mã công việc.
- **Service:** Service phụ trách.
- **Description:** Nội dung triển khai.
- **Input:** Dữ liệu hoặc điều kiện đầu vào.
- **Output:** Kết quả cần tạo ra.
- **Acceptance Criteria:** Điều kiện nghiệm thu.
- **Priority:** Mức độ ưu tiên.
- **Status:** Trạng thái thực hiện.
- **Dependencies:** Các task phụ thuộc.

Trạng thái:

- `TODO`
- `IN_PROGRESS`
- `BLOCKED`
- `REVIEW`
- `DONE`

Chỉ chuyển task sang `DONE` sau khi kết quả đầu ra đã được kiểm tra và tiêu chí nghiệm thu được đáp ứng.

**End of Document — Shop-Meal TASK-2 v1.0.0**