# Nuha Chatbot Frontend

Frontend Next.js untuk Nuha Care Chatbot. Menampilkan halaman landing Nuha Care beserta floating chat widget yang terhubung ke backend chatbot RAG.

## Arsitektur

```
nuha-chatbot-fe (Next.js 16 + React 19)
├── / (halaman utama) → mirror nuha.care (SSR + DOMPurify sanitasi)
├── FloatingChatbot  → chat widget overlay (client component)
└── /api/chat         → proxy ke backend chatbot-nuha
```

## Setup

### Prasyarat

- Node.js >= 20
- Backend `chatbot-nuha` sudah berjalan di `http://localhost:3000`

### Instalasi

```bash
npm install
cp .env.example .env   # sesuaikan CHATBOT_API_URL jika perlu
npm run dev            # berjalan di port 3001
```

### Environment Variables

| Variable | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `CHATBOT_API_URL` | Tidak | `http://localhost:3000/api/chat` | URL backend chatbot |

## Perintah

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Development server (port 3001) |
| `npm run build` | Production build |
| `npm start` | Production server |

## Keamanan

- **DOMPurify**: HTML dari nuha.care disanitasi server-side sebelum dirender — inline event handler (`onerror`, `onload`, dll.) dihapus.
- **Content-Security-Policy**: Header CSP ketat mencegah eksekusi inline script dan membatasi resource ke origin yang diizinkan.
- **Security Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.

## Deployment

Build dan deploy sebagai aplikasi Next.js standar:

```bash
npm run build
npm start
```

Atau deploy ke Vercel — pastikan environment variable `CHATBOT_API_URL` diatur di dashboard Vercel.