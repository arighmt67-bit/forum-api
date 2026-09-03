# Catatan untuk Reviewer — Forum API (Proyek CI/CD dan Security)

## URL Produksi
**https://aconk-forumapi.duckdns.org**

Membuka URL di atas lewat browser akan menampilkan health check:

```json
{ "status": "success", "message": "Forum API is running" }
```

Endpoint fungsional berada pada path spesifik (`/users`, `/authentications`,
`/threads`, dst.) sesuai dokumentasi kriteria, dan diuji dengan Postman
collection **Forum API V2**.

## Ringkasan Pemenuhan Kriteria

| # | Kriteria | Implementasi |
|---|----------|--------------|
| 1 | Continuous Integration | GitHub Actions menjalankan seluruh automation test pada setiap *pull request* ke branch `master`. |
| 2 | Continuous Deployment | GitHub Actions melakukan deploy otomatis ke server EC2 pada setiap *push* ke branch `master`. |
| 3 | Limit Access (Rate Limit) | Nginx membatasi request ke resource `/threads` maksimum 90 request per menit per IP; kelebihannya dibalas HTTP 429. |
| 4 | HTTPS | Sertifikat Let's Encrypt terpasang pada Nginx. Akses `http://` otomatis dialihkan (301) ke `https://`. |

## Informasi Tambahan

- **Repository**: https://github.com/arighmt67-bit/forum-api (publik)
- **Automation test**: 50 file, 186 test, coverage 100% (statements, branch, functions, lines)
- **Branch protection**: branch `master` dilindungi — perubahan wajib melalui pull request yang lulus pengecekan CI
- **Arsitektur**: Clean Architecture (Domains, Applications, Infrastructures, Interfaces, Commons)
- **Stack**: Node.js + Express, PostgreSQL, JWT, bcrypt, node-pg-migrate

Terima kasih atas waktu dan masukannya.
