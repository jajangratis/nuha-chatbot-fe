# Deploy nuha-chatbot-fe ke server (IP / reverse proxy)

## Kenapa lokal jalan tapi `http://103.67.244.236/tickets` tidak?

| Lokal | Server |
|-------|--------|
| `npm run dev` + `.env.local` | `next build` + `next start` + `.env.production` |
| `SUPPORT_API_URL` ke backend dev | **Harus** mengarah ke backend di mesin yang sama |
| `localStorage` di `localhost` | `localStorage` di **origin IP** (terpisah) |

API lewat curl bisa **200**, tapi halaman tetap "Memuat…" jika **bundle JS lama** atau **hydration auth** macet.

## Checklist di mesin app (mis. `100.119.82.23`)

### 1. Backend `chatbot-nuha` jalan

```bash
curl -sS http://127.0.0.1:7000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"apoy","password":"password"}'
```

(Sesuaikan port jika bukan 7000.)

### 2. `.env.production` frontend

```env
SUPPORT_API_URL=http://127.0.0.1:7000/api/v1
PORT=7001
HOSTNAME=0.0.0.0
```

**Penting:** `SUPPORT_API_URL` dipakai **server-side** oleh route `/api/v1/*`. Tanpa ini, BFF default ke port 3000 dan bisa gagal diam-diam.

### 3. Build & restart (wajib setelah setiap perubahan kode)

```bash
cd nuha-chatbot-fe
npm ci
npm run build
pm2 restart nuha-fe   # atau: PORT=7001 npm run start
```

### 4. Tes BFF dari luar

```bash
TOKEN=... # dari login
curl -sS "http://103.67.244.236/api/v1/tickets" \
  -H "Authorization: Bearer $TOKEN"
```

Harus JSON `tickets`, bukan HTML.

### 5. Browser

- Login di **origin yang sama**: `http://103.67.244.236/login`
- Staff: `/agent` atau `/tickets` (bukan hanya `/` — beranda = landing clone + chat tamu)
- Hard refresh setelah deploy

## Nginx (mylab → app)

Proxy semua path ke Next (7001), jangan arahkan `/api/v1` ke service lain (Open WebUI, dll.).
