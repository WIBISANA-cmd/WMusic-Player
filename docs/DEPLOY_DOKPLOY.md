# Deploy WMusic ke Dokploy (Docker Compose)

Panduan ini men-deploy seluruh aplikasi (web Next.js + API Express) sebagai satu
service **Compose** di Dokploy, memakai [`docker-compose.yml`](../docker-compose.yml)
di root repo.

## Arsitektur

```
Internet ──> Traefik (Dokploy, HTTPS)
               ├── music.example.com/        ──> wmusic-web :3000  (Next.js)
               └── music.example.com/api/*   ──> wmusic-api :4000  (Express)
                                                    └── volume wmusic_media (/app/media)
```

Web dan API berada di **satu domain**. Browser memanggil `/api/...` secara
same-origin, sehingga tidak perlu subdomain API terpisah dan tidak ada masalah CORS.

## Prasyarat

- Server dengan Dokploy terpasang (minimal 2 GB RAM; build Next.js butuh memori).
- Domain dengan DNS **A record** yang mengarah ke IP server.
- Repo ini bisa diakses Dokploy (GitHub App / Git provider / deploy key).

## 1. Buat service Compose

1. Dokploy → **Projects** → pilih/buat project → **Create Service** → **Compose**.
2. Compose Type: **Docker Compose** (bukan Stack).
3. Tab **General** → Provider:
   - Repository: `WIBISANA-cmd/WMusic-Player`
   - Branch: `main`
   - Compose Path: `./docker-compose.yml`
4. Simpan.

## 2. Isi Environment

Tab **Environment**, tempel lalu sesuaikan (referensi lengkap: [`.env.example`](../.env.example)):

```env
CORS_ORIGIN=https://music.example.com
NEXT_PUBLIC_API_URL=
YOUTUBE_API_KEY=
MEDIA_PROVIDER=local
```

| Variabel | Wajib | Keterangan |
|---|---|---|
| `CORS_ORIGIN` | Ya | URL publik aplikasi, pakai `https://`, tanpa `/` di akhir. Deploy gagal jika kosong. |
| `NEXT_PUBLIC_API_URL` | Tidak | Kosongkan untuk setup satu domain. Nilai ini di-*bake* saat build. |
| `YOUTUBE_API_KEY` | Tidak | Mengaktifkan pencarian YouTube. |
| `MEDIA_PROVIDER` | Tidak | `local` (default), `s3`, atau `cdn`. |
| `S3_*`, `CDN_*` | Tidak | Hanya jika `MEDIA_PROVIDER` bukan `local`. |

## 3. Tambahkan Domain

Tab **Domains** → **Add Domain**, buat **dua** entri dengan host yang sama:

| Service Name | Host | Path | Container Port | HTTPS | Certificate |
|---|---|---|---|---|---|
| `wmusic-web` | `music.example.com` | `/` | `3000` | On | Let's Encrypt |
| `wmusic-api` | `music.example.com` | `/api` | `4000` | On | Let's Encrypt |

Jangan aktifkan *Strip Path* pada entri `/api`, karena API memang melayani prefix `/api`.

Entri kedua bersifat opsional tetapi disarankan: tanpa entri itu `/api` tetap
berfungsi karena diteruskan oleh Next.js (rewrite) ke `wmusic-api`, namun streaming
audio jadi melewati dua proxy. Dengan entri itu Traefik langsung ke API.

## 4. Deploy

Klik **Deploy**. Dokploy akan clone repo, build dua image, lalu menjalankan stack.
Build pertama memakan beberapa menit. `wmusic-web` baru start setelah
`wmusic-api` berstatus *healthy*.

Aktifkan **Auto Deploy** di tab General bila ingin deploy otomatis tiap push ke `main`.

## 5. Verifikasi

```bash
curl https://music.example.com/api/v1/health      # {"status":"ok",...}
curl -I https://music.example.com/                # HTTP/2 200
curl -I -H "Range: bytes=0-1023" \
  https://music.example.com/api/stream/track-neon-horizon   # HTTP/2 206
```

Lalu buka domain di browser dan putar satu lagu.

## Data persisten

File audio disimpan di named volume `wmusic_media` (mount ke `/app/media`), yang
bertahan saat redeploy. API otomatis membuat ulang aset audio demo jika volume
masih kosong. Untuk backup, gunakan **Volume Backups** di Dokploy.

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Deploy gagal: `Set CORS_ORIGIN to the public URL` | `CORS_ORIGIN` belum diisi di tab Environment. |
| Halaman tampil tapi data kosong / `/api` 404 atau 502 | Cek log `wmusic-api`; pastikan entri domain `/api` memakai port `4000` dan service `wmusic-api`. |
| Membuat playlist gagal dengan 403 `CORS_ERROR` | `CORS_ORIGIN` tidak sama persis dengan URL di browser (skema, `www`, atau `/` di akhir). |
| Mengubah `NEXT_PUBLIC_API_URL` tidak berpengaruh | Nilai build-time; lakukan **Redeploy** (bukan sekadar restart). |
| Build berhenti / `Killed` saat `next build` | Server kehabisan RAM. Tambahkan swap atau naikkan memori. |
| 404 dari Traefik atau sertifikat belum terbit | DNS belum mengarah ke server, atau port 80/443 tertutup. |
| PWA tidak bisa di-install | Wajib diakses lewat HTTPS. |

## Uji lokal sebelum deploy

Stack yang sama dengan port ter-publish (web `:3000`, API `:4000`):

```bash
docker compose -f docker/docker-compose.yml up --build
```
