# Уналага.мн

Монголын хөдөө орон нутгийн тээврийн платформ. Сул зогсож байгаа
машинтай хүнийг тээвэр хэрэгтэй хүнтэй холбоно.

> Энэ файлыг Claude Code автоматаар уншина. Дизайны дэлгэрэнгүй
> зааврыг `DESIGN.md`-ээс үзнэ үү.

---

## 1. Асуудал ба шийдэл

Хөдөө орон нутагт унаа хэрэгтэй болоход хүмүүс Facebook группээр,
танилаараа дамжуулан жолооч хайдаг. Энэ нь удаан, найдваргүй,
үнэ нь тодорхойгүй.

Нөгөө талд Porter, Bongo, Delica, УАЗ зэрэг машинтай олон хүн
нэг чиглэлд **хоосон** явдаг. Хоёр талыг холбовол хоёуланд нь
ашигтай.

### Тээврийн 4 төрөл

| Төрөл | Жишээ | Онцлог |
|---|---|---|
| Хүн тээвэр | УБ → Хөвсгөл, 3 суудал | Хамгийн энгийн |
| Мал тээвэр | 5 хонь, 1 үхэр, 1 морь | Хайрцагтай машин шаардана |
| Бараа тээвэр | Малын тэжээл, тавилга, хэрэглээ | Жин/эзэлхүүн чухал |
| Гэр нүүлгэх | 5 ханатай гэр бүтнээр | Том ачааны машин, 800кг+ |

Мал тээвэр, гэр нүүлгэх — энэ хоёр нь Uber, BlaBlaCar-т
байхгүй, зөвхөн Монголд байдаг хэрэгцээ. Платформын гол
ялгарал энд байгаа.

---

## 2. Хэрэглэгч

### Жолооч
Хөдөө болон хот хооронд машинаа жолоодож явдаг хүн. Порт, Бонго,
Делика, УАЗ, суудлын машинтай. Хоосон явахын оронд нэмэлт орлого
олохыг хүсэж байна.

**Хэрэгцээ:** Хурдан пост оруулах. Машинаа зурагтайгаар итгэл
төрүүлэхээр харуулах. Утсаар шууд холбогдох.

### Захиалагч
Унаа, тээвэр хэрэгтэй болсон хүн. Ихэвчлэн яаралтай.

**Хэрэгцээ:** Хэн явж байгааг хурдан харах. Найдвартай эсэхийг
шалгах. Үнийг урьдчилан мэдэх.

### Хэрэглэгчийн орчин — ЭНЭ НЬ ЧУХАЛ

- **Гар утас 80%+.** Хөдөөд компьютер ховор. Mobile нь хоёрдогч
  биш, **үндсэн** дэлгэц.
- **Интернэт удаан.** 3G, заримдаа 2G. Зураг lazy-load хийх,
  файлын хэмжээ багасгах ёстой.
- **Насны хүрээ өргөн.** 20-иос 65 хүртэл. Технологид дасаагүй
  хүн ч ойлгох ёстой.
- **Facebook бол лавлах загвар.** Хүн бүр мэддэг. Шинэ загвар
  зохиохоос илүү танил хэв маягийг ашиглах нь зөв.

---

## 3. Одоогийн байдал

### Хийгдсэн

- `index.html` + `style.css` — статик нүүр хуудас
- Header: лого, хайлт, мэдэгдэл, avatar
- Sidebar: 6 цэс
- 8 жишээ пост (хүн/мал/бараа/гэр тээвэр)
- Пост бүрд машины зураг
- Тээврийн төрлийн badge (4 өнгө)
- "Шинэ захиалга үүсгэх" modal — форм, validation, role switch

### Хийгдээгүй

- Пост үнэхээр үүсэхгүй (одоо зөвхөн `alert`)
- Sidebar-ийн цэсүүд хоосон (өөр хуудас байхгүй)
- Хайлт, шүүлтүүр ажиллахгүй
- Профайл, жолоочийн дэлгэрэнгүй хуудас байхгүй
- Backend, database байхгүй
- Нэвтрэх систем байхгүй

### Технологи

Одоо: **HTML + CSS + vanilla JavaScript.** Framework байхгүй.
Мэдээллийг `localStorage`-д хадгална.

Дараа (backend үе шатанд): Django + PostgreSQL/PostGIS, газрын
зураг нь Leaflet + OpenStreetMap.

---

## 4. Файлын бүтэц

```
C:\unalaga\
├── CLAUDE.md          ← энэ файл
├── DESIGN.md          ← дизайны заавар
├── index.html         ← нүүр хуудас
├── style.css          ← бүх стиль
└── app.js             ← JavaScript (тусад нь гаргах)
```

Одоо JavaScript нь `index.html` дотор байгаа. Дараагийн засварт
`app.js` болгож салгах.

---

## 5. Database бүтэц

Backend хийхэд ашиглах 9 хүснэгт. Одоогийн frontend-ийн жишээ
өгөгдөл энэ бүтцийг дагаж байх ёстой.

### users
`id`, `phone_number` (unique), `password_hash`, `first_name`,
`last_name`, `profile_photo`, `user_type` (passenger/driver/both),
`is_verified`, `rating`, `created_at`

### drivers
`id`, `user_id` → users, `license_number`, `license_photo`,
`license_expiry`, `years_of_experience`, `verification_status`
(pending/approved/rejected), `home_aimag`, `home_sum`

### vehicles
`id`, `driver_id` → drivers, `vehicle_category`
(passenger/cargo/livestock/moving), `vehicle_type` (sedan/suv/van/
porter/bongo/damas/truck_small/truck_large/livestock_truck/
gher_truck), `make`, `model`, `year`, `plate_number`,
`capacity_passengers`, `capacity_cargo_kg`, `capacity_volume_m3`,
`has_livestock_box`, `livestock_capacity`, `has_winch`,
`has_refrigeration`, `registration_photo`, `is_active`

### vehicle_photos
`id`, `vehicle_id` → vehicles, `photo_url`, `photo_type`
(main/interior/cargo_area/livestock_box/other), `caption`,
`order_number`, `uploaded_at`

### locations
`id`, `name`, `type` (aimag/sum/city), `parent_id`, `latitude`,
`longitude`

21 аймаг + Улаанбаатар + ~330 сум урьдчилан бэлдэнэ.

### trip_requests
`id`, `passenger_id` → users, `request_type` (passenger/livestock/
cargo/gher_moving/mixed), `from_location_id`, `to_location_id`,
`from_lat`, `from_lng`, `to_lat`, `to_lng`, `departure_date`,
`departure_time`, `passenger_count`, `cargo_description`,
`cargo_weight_kg`, `cargo_volume_m3`, `livestock_type` (horse/cow/
sheep/goat/camel/mixed), `livestock_count`, `needs_livestock_box`,
`gher_size`, `notes`, `photos`, `status` (open/matched/completed/
cancelled), `created_at`

### driver_offers
`id`, `driver_id` → drivers, `vehicle_id` → vehicles,
`featured_photo_id` → vehicle_photos, `from_location_id`,
`to_location_id`, `departure_date`, `departure_time`,
`available_seats`, `available_cargo_kg`, `price_per_seat`,
`status` (open/full/completed/cancelled)

### bookings
`id`, `trip_request_id`, `driver_offer_id`, `passenger_id`,
`driver_id`, `vehicle_id`, `agreed_price`, `seats_booked`,
`status` (pending/confirmed/in_progress/completed/cancelled),
`created_at`

### reviews
`id`, `booking_id` → bookings, `reviewer_id`, `reviewed_id`,
`rating` (1-5), `comment`, `created_at`

---

## 6. Замын зураг

### Одоо хийж байгаа — Frontend бүрэн болгох
1. Дизайныг сайжруулах (`DESIGN.md` дагуу)
2. Пост үнэхээр үүсдэг болгох (localStorage)
3. Хайлт, шүүлтүүр ажиллуулах
4. "Жолооч хайх" хуудас
5. Жолоочийн дэлгэрэнгүй хуудас
6. Профайл хуудас
7. Mobile-д бүрэн тохируулах

### Дараа — Backend
8. Django төсөл, database
9. Утасны дугаараар бүртгэх/нэвтрэх
10. Зураг upload
11. Frontend-ийг API-тай холбох

### Хожим
12. Газрын зураг (Leaflet + OSM)
13. Жолоочийн баталгаажуулалт
14. Үнэлгээний систем
15. Мессеж солилцох

---

## 7. Ажиллах журам

### Хэл
- Интерфейсийн бүх текст **монгол хэлээр**
- Код доторх comment монгол хэлээр
- Хувьсагч, класс, функцын нэр англи хэлээр

### Кодын хэв маяг
- CSS хувьсагчийг `:root`-д төвлөрүүлнэ, hex-ийг шууд бичихгүй
- Класс нэр: `.post-card`, `.badge-livestock` — kebab-case
- JavaScript: `const`/`let`, `var` хэрэглэхгүй
- Функц бүр нэг ажил хийнэ

### Өөрчлөлт хийхдээ
- Ажиллаж байгаа зүйлийг **бүү эвд**. Нэмэх нь засахаас илүү
  аюулгүй.
- Том өөрчлөлтийн өмнө юу өөрчлөх гэж байгаагаа тайлбарла
- Нэг удаад нэг зорилго. 5 зүйлийг зэрэг өөрчлөхгүй.

### Хэрэглэгчийн тухай
Төсөл эзэн нь програмчлалын гүн мэдлэггүй. Тиймээс:
- Юу хийснээ **энгийн монгол хэлээр** тайлбарла
- Ямар файлын аль хэсгийг өөрчилснөө хэл
- Шинэ ойлголт гарвал 1-2 өгүүлбэрээр тайлбарла
- Алдаа гарвал юу болсныг, яаж засахыг хэл

---

## 8. Хийхгүй зүйлс

- **Framework нэмэхгүй.** React, Vue, Tailwind — одоохондоо
  хэрэггүй. Vanilla-аар сурч байгаа.
- **npm, build tool оруулахгүй.** Файлыг browser шууд нээх
  ёстой.
- **Гадаад номын сан** зөвхөн шаардлагатай үед (жишээ нь газрын
  зурагт Leaflet). CDN-ээр татна.
- **localStorage-оос өөр** хадгалалт одоохондоо хэрэггүй.
- **Анимаци хэтрүүлэхгүй.** Удаан интернэт, хуучин утсанд
  хүндрэл болно.
