# Forum API

[![CI](https://github.com/arighmt67-bit/forum-api/actions/workflows/ci.yml/badge.svg)](https://github.com/arighmt67-bit/forum-api/actions/workflows/ci.yml)
[![Release](https://github.com/arighmt67-bit/forum-api/actions/workflows/release.yml/badge.svg)](https://github.com/arighmt67-bit/forum-api/actions/workflows/release.yml)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](#cakupan-pengujian)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-multi--stage-2496ED?logo=docker&logoColor=white)](Dockerfile)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

RESTful API aplikasi forum diskusi. Dibangun dengan **Express.js** dan **PostgreSQL**,
menerapkan **Clean Architecture**, **Test-Driven Development** dengan cakupan pengujian
**100%**, serta dikirim ke produksi melalui **CI/CD pipeline** dengan *security gate*
dan *container image* ke GHCR.

## Ringkasan Teknis

| Aspek | Implementasi |
| --- | --- |
| Bahasa & Runtime | JavaScript (Node.js 22), Express.js |
| Basis Data | PostgreSQL — migrasi terversi via `node-pg-migrate` |
| Arsitektur | Clean Architecture 4 lapis + Dependency Injection container |
| Pengujian | Vitest — unit, integration, functional (**100% coverage**) |
| Autentikasi | JWT access token + refresh token rotation, hashing bcrypt |
| CI/CD | GitHub Actions — CI, CD via SSH, release image ke GHCR |
| Keamanan | Gitleaks (secret scanning), Trivy (SCA), NGINX rate limiting, TLS |
| Kontainer | Multi-stage `Dockerfile`, image publik di GHCR |

## Arsitektur Sistem

```text
                  ┌────────────────────────────┐
   Client ──────► │  NGINX (TLS, rate limit)   │
                  └─────────────┬──────────────┘
                                │ reverse proxy
                  ┌─────────────▼──────────────┐
                  │   Express HTTP Server      │  ◄── Interfaces (router, handler)
                  ├────────────────────────────┤
                  │   Use Case / Applications  │  ◄── business logic (framework-agnostic)
                  ├────────────────────────────┤
                  │   Domains (entity + kontrak repository) │
                  ├────────────────────────────┤
                  │   Infrastructures          │  ◄── PostgreSQL, bcrypt, JWT
                  └─────────────┬──────────────┘
                                │
                        ┌───────▼────────┐
                        │   PostgreSQL   │
                        └────────────────┘
```

Arah ketergantungan selalu mengarah ke dalam: lapisan `Domains` dan `Applications`
tidak mengetahui keberadaan Express maupun PostgreSQL, sehingga *business logic*
dapat diuji tanpa menjalankan server atau basis data.

## Fitur

**Kriteria wajib**

- Registrasi pengguna, login, refresh access token, dan logout
- Menambahkan thread (restrict, membutuhkan access token)
- Menambahkan dan menghapus komentar pada thread (soft delete)
- Melihat detail thread beserta seluruh komentarnya (terbuka, tanpa token)

**Kriteria opsional**

- Menambahkan dan menghapus balasan pada komentar thread (soft delete)
- Balasan ditampilkan ter-nested pada setiap item komentar
- Menyukai dan batal menyukai komentar thread (restrict)
- Jumlah suka (`likeCount`) ditampilkan pada setiap item komentar

## Struktur Lapisan

| Lapisan | Isi |
| --- | --- |
| `src/Domains` | Entitas dan kontrak repository (abstract) |
| `src/Applications` | Use case dan kontrak layanan keamanan |
| `src/Infrastructures` | Implementasi konkret: PostgreSQL, bcrypt, JWT, server HTTP |
| `src/Interfaces` | Router dan handler Express |

Ketergantungan antar lapisan diatur melalui container (`instances-container`),
sehingga lapisan dalam tidak pernah bergantung pada lapisan luar.

## Continuous Integration dan Continuous Deployment

| Berkas | Pemicu | Kegunaan |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Pull request ke `master` | ESLint, *secret scanning* (Gitleaks), *dependency scanning* (Trivy), serta unit, integration, dan functional test di atas PostgreSQL service container |
| `.github/workflows/cd.yml` | Push ke `master` | Deployment otomatis ke server produksi melalui SSH |
| `.github/workflows/release.yml` | Tag `v*` | *Build* image multi-stage dan publikasi ke GitHub Container Registry (GHCR) |

Branch `master` dilindungi: setiap perubahan wajib melalui *pull request*,
lulus seluruh *status check* CI, dan mendapat satu *approval* sebelum dapat
di-*merge*. Secrets deployment: `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`,
dan `SSH_PORT`.

## Keamanan

- **Shift-left security gate** — *pipeline* CI menjalankan **Gitleaks** untuk
  mendeteksi kredensial yang tidak sengaja ter-*commit* dan **Trivy** untuk
  memindai kerentanan dependensi. Keduanya bersifat *blocking*, sehingga
  *build* yang bermasalah tidak pernah sampai ke tahap rilis.
- **Limit Access** — resource `/threads` beserta seluruh path di dalamnya
  dibatasi 90 request per menit melalui NGINX, sebagai langkah preventif
  terhadap DDoS Attack. Konfigurasinya tersedia pada `nginx.conf`.
- **HTTPS** — seluruh lalu lintas dialihkan ke TLS dengan sertifikat
  Let's Encrypt agar terhindar dari serangan Man In The Middle.
- **Autentikasi** — *access token* berumur pendek dengan mekanisme
  *refresh token rotation*; kata sandi disimpan sebagai *hash* bcrypt.

## Menjalankan Proyek

### Lokal

```bash
npm install
cp .env.example .env      # sesuaikan nilainya
npm run migrate up
npm run start
```

### Docker

Image multi-stage tersedia di GitHub Container Registry:

```bash
docker pull ghcr.io/arighmt67-bit/forum-api:latest
docker run -p 5000:5000 --env-file .env ghcr.io/arighmt67-bit/forum-api:latest
```

`Dockerfile` menggunakan *multi-stage build* sehingga *image* akhir hanya memuat
dependensi produksi, tanpa *build tool* maupun *dev dependency*.

## Pengujian

```bash
npm run lint              # memeriksa gaya penulisan kode
npm run test              # menjalankan seluruh pengujian
npm run test:coverage     # menjalankan pengujian beserta laporan cakupan
```

Pengujian memerlukan basis data terpisah yang dikonfigurasi melalui `.test.env`,
lalu dimigrasikan dengan `npm run migrate:test up`.

### Cakupan Pengujian

Pengujian ditulis lebih dahulu mengikuti alur *Test-Driven Development*
(*red → green → refactor*), mencakup *unit test* untuk entitas dan *use case*,
*integration test* untuk lapisan repository terhadap PostgreSQL, serta
*functional test* untuk seluruh *endpoint* HTTP.

| Metrik | Cakupan | Jumlah |
| --- | --- | --- |
| Statements | **100%** | 559 / 559 |
| Branches | **100%** | 208 / 208 |
| Functions | **100%** | 163 / 163 |
| Lines | **100%** | 557 / 557 |

Laporan HTML dihasilkan pada direktori `coverage/` setelah menjalankan
`npm run test:coverage`.

## Daftar Endpoint

| Method | Path | Akses |
| --- | --- | --- |
| POST | `/users` | Terbuka |
| POST | `/authentications` | Terbuka |
| PUT | `/authentications` | Terbuka |
| DELETE | `/authentications` | Terbuka |
| POST | `/threads` | Restrict |
| GET | `/threads/{threadId}` | Terbuka |
| POST | `/threads/{threadId}/comments` | Restrict |
| DELETE | `/threads/{threadId}/comments/{commentId}` | Restrict |
| POST | `/threads/{threadId}/comments/{commentId}/replies` | Restrict |
| DELETE | `/threads/{threadId}/comments/{commentId}/replies/{replyId}` | Restrict |
| PUT | `/threads/{threadId}/comments/{commentId}/likes` | Restrict |
