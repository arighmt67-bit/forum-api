# Postmortem: Latihan Deployment Gagal

> Insiden **disengaja** (latihan). Dokumen ini memakai format postmortem untuk menunjukkan alur
> penanganan insiden: deteksi, mitigasi, akar masalah, dan pencegahan.

| Item | Isi |
| --- | --- |
| Tanggal | 30 Oktober 2026 (UTC) |
| Lingkungan | Server uji Google Cloud (`e2-micro`, `us-central1`), sudah dihapus |
| Commit bermasalah | `ac5cb47` (PR #14) |
| Commit sehat sebelumnya | `a294f8c` |
| Dampak | `/health` mengembalikan `500` selama proses verifikasi, sekitar 30 detik |
| Pemulihan | Otomatis oleh workflow CD, tanpa tindakan manual |

## Ringkasan

PR #14 sengaja membuat `GET /health` mengembalikan `500`. Setelah di-*merge*, workflow CD
men-*deploy* commit tersebut, gagal memverifikasi `/health`, lalu mengembalikan server ke commit
sebelumnya dan memverifikasi ulang hingga sehat. Job CD tetap ditandai gagal agar deployment yang
bermasalah terlihat di riwayat Actions.

## Linimasa (UTC)

| Waktu | Kejadian |
| --- | --- |
| 02:35:41 | CD untuk `ac5cb47` dimulai |
| 02:35:48 | Langkah *Deploy over SSH* berjalan: tarik kode, `npm ci`, migrasi, `pm2 reload` |
| 02:35:50 (kira-kira) | Verifikasi dimulai. Percobaan 1: tidak ada respons (`000`, aplikasi belum siap) |
| setelahnya | Percobaan 2 sampai 10: `/health` mengembalikan `500` |
| setelahnya | Workflow mencetak `Verifikasi deployment gagal. Rollback otomatis ke a294f8c` |
| setelahnya | `git reset --hard a294f8c`, `npm ci`, `pm2 reload`; percobaan ulang menunjukkan `200` |
| 02:36:37 | Langkah selesai. Job ditandai gagal (disengaja) |
| 02:38:40 | PR #15 (revert) di-*merge*; CD berhasil pada `d110d0a` |

Waktu detail di dalam langkah SSH tidak dicatat per baris, jadi urutan di antara 02:35:48 dan
02:36:37 diambil dari urutan keluaran log, bukan dari cap waktu per baris.

## Deteksi

Pemeriksaan otomatis `/health` di akhir workflow CD. Tidak ada pemantauan terpisah di lingkungan
uji; deteksi bergantung pada langkah verifikasi tersebut.

## Mitigasi

Rollback otomatis ke commit sebelumnya di dalam run yang sama. Pemulihan dikonfirmasi dengan
`/health` kembali `200` baik di dalam workflow maupun dari luar lewat HTTPS.

## Akar masalah

Perubahan kode pada PR #14 membuat endpoint `/health` selalu gagal. Perubahan itu lolos CI karena
tes pada PR yang sama diubah mengikuti perilaku baru, sehingga CI tidak menangkapnya. Hal ini
disengaja agar kegagalan baru terdeteksi pada tahap deployment, bukan pada tahap tes.

## Yang berjalan baik

- Verifikasi pasca-deploy mendeteksi kegagalan tanpa campur tangan manusia.
- Rollback dan verifikasi ulang berjalan otomatis dan server pulih.
- Kegagalan tetap terlihat di riwayat Actions, tidak tertutup oleh pemulihan.

## Yang perlu diperbaiki

| Temuan | Tindak lanjut |
| --- | --- |
| Rollback mengembalikan kode, bukan skema database | Migrasi harus kompatibel dengan versi sebelumnya (tercatat di `RUNBOOK.md`) |
| Mekanisme hanya mendeteksi kegagalan `/health` | Bug fungsional yang tidak memengaruhi `/health` tidak tertangkap; tambahkan *smoke test* ringan bila perlu |
| Tes dan kode diubah bersamaan dapat lolos CI | Terapkan *code owner review* untuk berkas `/health` pada lingkungan nyata |
| Tidak ada pemantauan di luar saat deploy | Tambahkan pemeriksaan berkala (misalnya *uptime check*) pada lingkungan yang berjalan terus |

## Referensi

- Bukti dan cuplikan log: [BUKTI-ROLLBACK-OTOMATIS.md](BUKTI-ROLLBACK-OTOMATIS.md)
- Langkah operasional: [RUNBOOK.md](../RUNBOOK.md)
- Run gagal (disengaja): https://github.com/arighmt67-bit/forum-api/actions/runs/40992596988
- Run pemulihan: https://github.com/arighmt67-bit/forum-api/actions/runs/40992881715
