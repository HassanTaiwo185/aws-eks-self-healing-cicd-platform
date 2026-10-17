# CollabsUp — Real-Time Team Collaboration Platform

> A production-deployed collaboration platform where teams post daily standups and discuss them live via WebSockets.

🔗 **Live Demo:** https://real-time-collaboration-app-mu.vercel.app

---

## What it does

CollabsUp solves a simple problem: remote teams need a lightweight way to share daily progress and have quick, focused discussions around each update — without the noise of a full chat tool.

Each day, team members post a standup update. Anyone on the team can reply, and that reply opens a **dedicated real-time chat room** for that standup, powered by WebSockets. Standups automatically expire after 24 hours, keeping the workspace clean.

---

## Features

**Team management**
- The first registered user on a team automatically becomes Team Leader
- Team Leaders invite members via a tokenized email link (expires in 24 hours)
- Role-based access: Team Leaders can manage members, Team Members can post and discuss

**Daily standups**
- Post a standup with a title and progress update
- Standups auto-delete after 24 hours via a Celery scheduled task
- Edit or delete your own standup

**Real-time chat**
- Replying to a standup creates a dedicated WebSocket chat room for that standup
- Live typing indicators show when other users are composing a message
- Messages can be deleted in real time — all connected users see the deletion instantly
- JWT authentication is enforced at the WebSocket connection layer via custom middleware

**Authentication**
- Email verification with a 6-digit code on signup (expires in 10 minutes)
- Forgot password / reset password flow via email
- JWT access + refresh tokens
- Unverified accounts are automatically cleaned up by a background task

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python, Django 5, Django REST Framework |
| Real-time | Django Channels, WebSockets, Redis Pub/Sub |
| Background tasks | Celery (standup expiry, invite cleanup, user cleanup) |
| Auth | JWT (SimpleJWT), custom WebSocket JWT middleware |
| Frontend | React 19, Vite, Tailwind CSS |
| Database | PostgreSQL (production), SQLite (local) |
| Email | Brevo HTTP API |
| Deployment | Vercel (frontend), AWS Elastic Beanstalk (backend) |

---

## Architecture

```
React (Vite) ──── REST API ────► Django + DRF
                                      │
                  WebSocket ────► Django Channels
                                      │
                                   Redis Pub/Sub
                                      │
                                   Celery Workers
                                  (scheduled tasks)
```

Key design decisions:
- **Custom JWT WebSocket middleware** — Django Channels doesn't support DRF auth out of the box. A custom ASGI middleware extracts and validates the JWT from the WebSocket query string before the connection is accepted.
- **Room-per-standup model** — each standup that receives a reply gets its own isolated chat room, keeping conversations contextual and scoped.
- **Celery beat tasks** — four scheduled tasks handle automatic cleanup: expired confirmation codes, unverified users, expired standups, and expired invite tokens.

---

## Local setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Redis
- PostgreSQL (or use SQLite for local dev)

### 1. Clone the repo
```bash
git clone https://github.com/HassanTaiwo185/Real-Time-Collaboration-App
cd Real-Time-Collaboration-App
```

### 2. Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```
SECRET_KEY=your-django-secret-key
DEBUG=False
FRONTEND_URL=http://localhost:5173

REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0

DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=5432

BREVO_API_KEY=your-brevo-api-key
```

Generate a secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Run migrations and start the server:
```bash
python manage.py migrate
python manage.py runserver
```

### 3. Redis
```bash
redis-server
```

### 4. Celery worker (optional — needed for background tasks)
```bash
cd backend
source .venv/bin/activate
celery -A backend worker -l info
celery -A backend beat -l info    # for scheduled tasks
```

### 5. Frontend
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
```
VITE_API_URL=http://127.0.0.1:8000/api
VITE_WS_URL=ws://127.0.0.1:8000/
```

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Testing real-time features

1. Open two browser windows (or use incognito for the second)
2. Create two separate accounts and verify both via email
3. Have one user post a standup
4. Have the other user reply to it — a chat room opens for both
5. Type in one window — the other sees the typing indicator in real time
6. Delete a message in one window — it disappears instantly in the other

---

## Running tests

```bash
cd backend
python manage.py test
```

Tests cover serializers, API views, WebSocket consumers, and model logic across the `chat`, `standup`, and `users` apps.

---

## Project structure

```
├── backend/
│   ├── users/          # Custom user model, auth, email verification
│   ├── teams/          # Team creation, invite system
│   ├── standup/        # Standup CRUD, 24hr expiry
│   ├── chat/           # WebSocket consumer, JWT middleware, rooms, messages
│   └── backend/        # Django settings, Celery config, ASGI routing
└── frontend/
    └── src/
        ├── components/ # ChatRoom, StandupPage, CreateStandup, etc.
        ├── pages/      # Dashboard, Auth flows, Invite
        └── Utils/      # Token refresh utilities
```
