# Forum API

RESTful API aplikasi forum diskusi untuk Garuda Game. Dibangun dengan Express.js,
PostgreSQL, dan menerapkan Clean Architecture serta automation testing.

## Fitur

**Kriteria wajib**

- Registrasi pengguna, login, refresh access token, dan logout
- Menambahkan thread (restrict, membutuhkan access token)
- Menambahkan dan menghapus komentar pada thread (soft delete)
- Melihat detail thread beserta seluruh komentarnya (terbuka, tanpa token)

**Kriteria opsional**

- Menambahkan dan menghapus balasan pada komentar thread (soft delete)
- Balasan ditampilkan ter-nested pada setiap item komentar

## Arsitektur

Source code disusun dalam empat layer sesuai Clean Architecture:

| Layer | Lokasi | Isi |
|---|---|---|
| Entities | `src/Domains/*/entities` | Entitas bisnis dan validasi propertinya |
| Use Case | `src/Applications/use_case` | Alur logika bisnis |
| Interface Adapter | `src/Interfaces`, `src/Infrastructures/repository` | Handler HTTP dan implementasi repository |
| Frameworks | `src/Infrastructures` | Express server, PostgreSQL, JWT, bcrypt |

Logika bisnis hanya berada di entities dan use case. Repository murni berisi
akses database tanpa percabangan bisnis, dan autentikasi ditangani di level
interface melalui middleware sehingga use case tetap dapat dipakai ulang.

## Persiapan

1. Pasang dependensi.

   ```
   npm install
   ```

2. Buat dua basis data PostgreSQL, satu untuk aplikasi dan satu untuk pengujian.

   ```
   createdb forumapi
   createdb forumapi_test
   ```

3. Salin `.env.example` menjadi `.env`, lalu sesuaikan kredensial PostgreSQL dan
   nilai secret key JWT.

   ```
   cp .env.example .env
   ```

   Untuk menjalankan pengujian, buat juga berkas `.test.env` dengan isi yang sama
   tetapi mengarah ke basis data `forumapi_test` dan menambahkan `NODE_ENV=test`.

4. Jalankan migration.

   ```
   npm run migrate up
   ```

## Menjalankan Aplikasi

```
npm run start          # mode produksi
npm run start:dev      # mode pengembangan dengan nodemon
```

Server berjalan pada host dan port sesuai `HOST` dan `PORT` di berkas `.env`.

## Pengujian

```
npm run migrate:test up    # siapkan skema pada basis data pengujian
npm test                   # unit, integration, dan functional test
npm run test:coverage      # sekaligus laporan coverage
```

Pengujian mencakup unit test pada entities dan use case, integration test pada
repository terhadap PostgreSQL, serta functional test pada endpoint HTTP.

## Daftar Endpoint

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/users` | – | Registrasi pengguna |
| POST | `/authentications` | – | Login |
| PUT | `/authentications` | – | Refresh access token |
| DELETE | `/authentications` | – | Logout |
| POST | `/threads` | Ya | Menambahkan thread |
| GET | `/threads/{threadId}` | – | Melihat detail thread |
| POST | `/threads/{threadId}/comments` | Ya | Menambahkan komentar |
| DELETE | `/threads/{threadId}/comments/{commentId}` | Ya | Menghapus komentar |
| POST | `/threads/{threadId}/comments/{commentId}/replies` | Ya | Menambahkan balasan |
| DELETE | `/threads/{threadId}/comments/{commentId}/replies/{replyId}` | Ya | Menghapus balasan |

Endpoint yang membutuhkan autentikasi memerlukan header
`Authorization: Bearer <access token>`.
