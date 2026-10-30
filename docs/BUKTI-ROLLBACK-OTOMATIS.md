# Bukti Rollback Otomatis

Latihan sengaja untuk membuktikan bahwa pipeline CD memulihkan server sendiri ketika
deployment gagal diverifikasi. Dijalankan di server uji Google Cloud (`e2-micro`, `us-central1`),
yang sudah dihapus setelah latihan selesai.

## Skenario

1. PR #14 sengaja membuat `GET /health` mengembalikan `500`.
2. PR tersebut di-*merge*, sehingga workflow CD berjalan ke server.
3. CD gagal memverifikasi `/health`, lalu kembali ke commit sebelumnya secara otomatis.
4. PR #15 mengembalikan perubahan tersebut dan CD kembali berhasil.

## Hasil

| Tahap | Commit | Hasil CD | Kondisi `/health` di server |
| --- | --- | --- | --- |
| Deploy normal dengan rollback otomatis | `a294f8c` | Berhasil | `200` |
| Deploy dengan `/health` sengaja gagal | `ac5cb47` | **Gagal (sengaja)** | `500` sebanyak 9 kali, lalu rollback |
| Setelah rollback otomatis | `a294f8c` | (di dalam run yang sama) | `200` |
| Revert latihan | `d110d0a` | Berhasil | `200` |

Cuplikan log run gagal (`ac5cb47`):

```text
Verifikasi 2/10: http://127.0.0.1:5000/health -> 500
...
Verifikasi 10/10: http://127.0.0.1:5000/health -> 500
::error::Verifikasi deployment gagal. Rollback otomatis ke a294f8c
HEAD is now at a294f8c ci(cd): rollback automatically to previous commit ...
Verifikasi 2/10: http://127.0.0.1:5000/health -> 200
::warning::Rollback berhasil, server kembali sehat di a294f8c
```

Run Actions: [ac5cb47 (gagal sengaja)](https://github.com/arighmt67-bit/forum-api/actions/runs/40992596988),
[d110d0a (pulih)](https://github.com/arighmt67-bit/forum-api/actions/runs/40992881715).

## Batasan

- Rollback mengembalikan **kode**, bukan skema database. Migrasi harus kompatibel dengan versi
  sebelumnya agar rollback aman (lihat `RUNBOOK.md`).
- Rollback hanya terpicu oleh kegagalan `/health`. Bug fungsional yang tidak memengaruhi `/health`
  tidak terdeteksi oleh mekanisme ini.
- Latihan dilakukan di server uji tunggal, bukan lingkungan produksi dengan lalu lintas pengguna.
