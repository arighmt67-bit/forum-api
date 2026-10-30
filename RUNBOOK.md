# Runbook Operasional Forum API

Panduan singkat untuk memeriksa, memulihkan, dan membatalkan deploy Forum API di server produksi.
Asumsi: aplikasi jalan di bawah PM2 dengan nama `forum-api`, di belakang NGINX, folder `~/forum-api`.

## 1. Cek kesehatan

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://<DOMAIN>/health
```

| Hasil | Arti | Tindakan |
|---|---|---|
| `200` | Aplikasi dan database hidup | Tidak ada |
| `503` | Aplikasi hidup, database tidak terjangkau | Bagian 3 |
| `502` / `000` | Aplikasi mati atau NGINX tidak bisa menjangkaunya | Bagian 2 |

## 2. Aplikasi tidak merespons

```bash
pm2 status                    # status harus online
pm2 logs forum-api --lines 50 # cari error terakhir
sudo systemctl status nginx   # pastikan NGINX hidup
```

Restart tanpa downtime:

```bash
pm2 reload forum-api --update-env
```

Kalau reload gagal atau proses tidak terdaftar:

```bash
pm2 restart forum-api || pm2 start src/app.js --name forum-api
pm2 save
```

Verifikasi: ulangi bagian 1 sampai `200`.

## 3. Database tidak terjangkau

```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
pm2 reload forum-api
```

Kalau masih `503`, periksa `pm2 logs forum-api` dan nilai `PG*` di `~/forum-api/.env`.

## 4. Rollback manual setelah deploy gagal

Dipakai kalau `/health` bermasalah setelah deploy baru.

```bash
cd ~/forum-api
git log --oneline -5                 # pilih commit terakhir yang sehat
git reset --hard <COMMIT_SEHAT>
npm ci --omit=dev
pm2 reload forum-api --update-env
curl -s https://<DOMAIN>/health      # harus 200
```

Catatan penting:
- Rollback kode **tidak** membatalkan migrasi database. Karena itu setiap migrasi harus
  kompatibel dengan versi kode sebelumnya (tambah kolom boleh, hapus atau ganti nama kolom tidak).
- Kalau migrasi yang menjadi penyebab, jangan rollback sendiri. Eskalasi (bagian 5).

## 5. Kapan eskalasi

- `/health` masih gagal setelah restart dan rollback.
- Ada error migrasi atau indikasi data rusak.
- Disk penuh atau memori habis (`df -h`, `free -m`).

Sertakan saat eskalasi: waktu kejadian, hasil `pm2 status`, 50 baris terakhir `pm2 logs`,
commit yang sedang berjalan (`git rev-parse HEAD`), dan langkah yang sudah dicoba.
