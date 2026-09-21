# 📌 Blueprint Teknis Sistem: StudyHub (PWA)

## 1. Arsitektur & Tech Stack

### Front-End (Web & Mobile PWA)

* **Core Framework:** Vite + React (TypeScript)
* **Styling:** Tailwind CSS + Shadcn/ui (UI minimalis & responsif)
* **PWA Engine:** `vite-plugin-pwa` (Service Worker, Web App Manifest, Caching, Installable PWA)
* **State Management & Data Fetching:** `@tanstack/react-query` (Caching, Sync, & Offline support)
* **Routing:** `react-router-dom` v6
* **Icons & Components:** `lucide-react`, `date-fns` (Manipulasi tanggal), `@schedule-x/react` (Tampilan Kalender)

### Back-End (REST API & Scheduler)

* **Runtime & Framework:** Node.js + Express.js (TypeScript)
* **Telegram Integration:** `telegraf` / `node-telegram-bot-api`
* **Cron Engine:** `node-cron` (Pengecekan *deadline* berkala)
* **Security & Auth:** `jsonwebtoken` (JWT), `bcryptjs`, `cors`, `helmet`

### Database & ORM

* **Database Engine:** SQLite3 (File-based: `studyhub.db`)
* **Driver / Query Engine:** `better-sqlite3` (Cepat, synchronous execution)
* **ORM:** Prisma ORM (Provider `sqlite`) atau Drizzle ORM

---

## 2. Fitur PWA & Offline Capability

1. **Manifest File (`manifest.json`):**
* *Display Mode:* `standalone` (Tampilan seperti aplikasi native tanpa URL bar browser).
* *Icons:* Icon 192x192 px & 512x512 px + Maskable icon.
* *Theme Color:* Dark / Minimalist Slate (`#0F172A`).


2. **Service Worker Caching Strategy:**
* **App Shell (Static Assets):** *Cache-First* untuk HTML, CSS, JS, dan Fonts.
* **API Requests:** *Network-First* dengan *Fallback Cache* jika offline.


3. **Background Sync & Offline Fallback:**
* Menggunakan IndexedDB via `idb` / `localforage` untuk menyimpan draft tugas saat pengguna offline.
* Sync otomatis ke server Express saat koneksi internet terhubung kembali.



---

## 3. Detail Integrasi Telegram Bot

1. **Sinkronisasi Akun (Linking):**
* Pengguna mengklik tombol **"Hubungkan Telegram"** di pengaturan akun StudyHub.
* Web membuat token autentikasi sekali pakai (*Deep Link Token*), contoh: `t.me/StudyHubBot?start=LINK_TOK_98765`.
* Saat tombol `/start` diklik di Telegram, bot menangkap token tersebut, mencocokkan pengguna di database, lalu menyimpan `telegram_chat_id`.


2. **Alur Cron Job Pengingat (`node-cron`):**
* Cron berjalan setiap **5 menit**.
* Menjalankan query ke SQLite untuk mengambil tugas yang memenuhi kriteria:
* `is_completed = 0`
* `reminder_sent = 0`
* `due_date` <= `Waktu Sekarang + 2 jam`
* `telegram_chat_id IS NOT NULL`


* Mengirim pesan terformat via Bot Telegram.
* Mengubah status `reminder_sent = 1` setelah pesan berhasil terkirim.



---

## 4. Diagram UML Detail & Lengkap

### A. Class Diagram (Struktur Data & Relasi Database)

```mermaid
classDiagram
    class User {
        +Int id
        +String name
        +String email
        +String password_hash
        +String telegram_chat_id
        +DateTime created_at
        +register()
        +login()
        +linkTelegram()
    }

    class Course {
        +Int id
        +Int user_id
        +String course_name
        +String lecturer_name
        +String day_of_week
        +String start_time
        +String end_time
        +String color_code
        +addCourse()
        +updateCourse()
        +deleteCourse()
    }

    class Task {
        +Int id
        +Int user_id
        +Int course_id
        +String title
        +String description
        +DateTime due_date
        +String priority
        +Boolean is_completed
        +Boolean reminder_sent
        +addTask()
        +updateTask()
        +markAsCompleted()
    }

    class CalendarIntegration {
        +Int id
        +Int user_id
        +String ical_token
        +generateICSFile()
    }

    User "1" -- "0..*" Course : owns
    User "1" -- "0..*" Task : creates
    Course "1" -- "0..*" Task : categorizes
    User "1" -- "1" CalendarIntegration : configures

```

### B. Use Case Diagram

```mermaid
graph TD
    User((Mahasiswa))
    SystemCron((Node-Cron Service))

    subgraph StudyHub PWA & Backend
        UC1[Registrasi / Login]
        UC2[Kelola Jadwal Kuliah]
        UC3[Kelola Tugas & Deadline]
        UC4[Lihat Kalender Interaktif]
        UC5[Hubungkan Akun Telegram]
        UC6[Ekspor / Sync iCal .ics]
        UC7[Kirim Notifikasi Telegram]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    SystemCron --> UC7

```

### C. Sequence Diagram: Menghubungkan Telegram & Pengiriman Notifikasi

```mermaid
sequenceDiagram
    autonumber
    actor User as Mahasiswa
    participant PWA as PWA Frontend (Vite)
    participant API as Express API
    participant DB as SQLite Database
    participant Bot as Telegram Bot
    participant Cron as Cron Job Scheduler

    %% Phase 1: Linking Telegram Account
    rect rgb(240, 248, 255)
    note over User, Bot: Fase 1: Linking Akun Telegram
    User->>PWA: Klik "Hubungkan Telegram"
    PWA->>API: GET /api/telegram/link-token
    API->>API: Generate unique LinkToken
    API-->>PWA: Return Link URL (t.me/StudyHubBot?start=TOKEN)
    PWA->>User: Redirect / Buka Telegram App
    User->>Bot: Klik /start TOKEN
    Bot->>API: Webhook / Event Handler (/start TOKEN)
    API->>DB: UPDATE users SET telegram_chat_id = chat_id WHERE token = TOKEN
    API-->>Bot: Confirmation Status
    Bot-->>User: "Akun StudyHub berhasil terhubung! 🎉"
    end

    %% Phase 2: Cron Job Notification
    rect rgb(255, 240, 245)
    note over Cron, User: Fase 2: Pengiriman Pengingat Otomatis
    Cron->>API: Trigger (Setiap 5 Menit)
    API->>DB: Query Tugas (due_date <= 2 jam && reminder_sent == 0)
    DB-->>API: Return List Tugas & telegram_chat_id
    loop For each task
        API->>Bot: Send Message (chat_id, task_detail)
        Bot-->>User: Notifikasi Pesan Telegram 🚨
        API->>DB: UPDATE tasks SET reminder_sent = 1 WHERE id = task.id
    end
    end

```

### D. Entity Relationship Diagram (ERD - SQLite Schema)

```mermaid
erDiagram
    USERS {
        INTEGER id PK
        TEXT name
        TEXT email
        TEXT password_hash
        TEXT telegram_chat_id
        DATETIME created_at
    }

    COURSES {
        INTEGER id PK
        INTEGER user_id FK
        TEXT course_name
        TEXT lecturer_name
        TEXT day_of_week
        TEXT start_time
        TEXT end_time
        TEXT color_code
    }

    TASKS {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER course_id FK
        TEXT title
        TEXT description
        DATETIME due_date
        TEXT priority
        INTEGER is_completed
        INTEGER reminder_sent
        DATETIME created_at
    }

    CALENDAR_SYNC {
        INTEGER id PK
        INTEGER user_id FK
        TEXT ical_token
        DATETIME updated_at
    }

    USERS ||--o{ COURSES : "memiliki"
    USERS ||--o{ TASKS : "membuat"
    COURSES ||--o{ TASKS : "mengelompokkan"
    USERS ||--|| CALENDAR_SYNC : "mengonfigurasi"

```

---

## 5. Struktur Folder Project

```text
studyhub/
├── client/ (Vite + React PWA)
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/             # Shadcn UI Components
│   │   │   ├── Calendar.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   └── TaskList.tsx
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Courses.tsx
│   │   │   ├── Tasks.tsx
│   │   │   └── Settings.tsx
│   │   ├── services/           # Axios / React Query API Calls
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts          # Vite + PWA Plugin Config
│   └── tailwind.config.js
│
└── server/ (Node.js Express + SQLite)
    ├── prisma/
    │   └── schema.prisma       # Prisma SQLite Schema
    ├── src/
    │   ├── config/             # DB & Env Config
    │   ├── controllers/        # Auth, Course, Task, Telegram Controllers
    │   ├── middlewares/        # Auth JWT Middleware
    │   ├── routes/             # Express API Routes
    │   ├── services/
    │   │   ├── botService.ts   # Telegram Bot Listener
    │   │   ├── cronService.ts  # Node-Cron Job Engine
    │   │   └── icalService.ts  # .ics Generator Engine
    │   └── app.ts
    ├── data/
    │   └── studyhub.db         # SQLite Database File
    ├── .env
    └── package.json

```