# AnonWork Platform

A modern, full-stack anonymous workplace platform built with **Next.js**, orchestrated with **Docker Compose** microservices, and powered by **PostgreSQL**, **Redis**, and **RabbitMQ**. This platform enables employees to anonymously share salaries, post reviews, chat in real-time, and leverage AI for content moderation, summarization, and smart replies.

## 🚀 Features

- **Anonymous Feeds & Posts:** Users can post anonymously to company channels, share salaries, and review their workplaces without exposing their identities.
- **Real-Time Messaging:** Fully featured messaging system using WebSockets for private, real-time, and anonymous conversations.
- **AI-Powered Copilot:** Integrated AI features using local or third-party LLMs (e.g., Llama, Mistral, Groq) to provide:
  - Smart reply suggestions.
  - Thread summarization.
  - Content redaction and toxicity moderation.
  - Post title and tag suggestions.
- **Microservices Architecture:** Scalable backend broken down into isolated services (API Gateway, User, Content, Notification, Messaging, and AI).
- **Responsive & Modern UI:** Built with **Tailwind CSS**, **Radix UI**, and **Framer Motion** for a sleek, glassmorphic, and dynamic user experience.
- **Secure Authentication:** Robust JWT-based authentication flow with email verification support.

## 🛠 Tech Stack

### Frontend & Core App
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, PostCSS
- **Components:** Radix UI / shadcn/ui
- **Icons:** Lucide React
- **Forms & Validation:** React Hook Form + Zod

### Backend & Microservices
- **Runtime:** Node.js (Alpine Docker images)
- **Databases:** PostgreSQL (Neon Serverless / Supabase)
- **Caching & Pub/Sub:** Redis
- **Message Broker:** RabbitMQ
- **Email:** Nodemailer

## 🏗 Architecture

The backend is built as a set of decoupled microservices:

1. **API Gateway:** Routes frontend traffic to appropriate microservices and handles rate-limiting/auth parsing.
2. **User Service:** Manages authentication, profiles, and anonymity mappings.
3. **Content Service:** Handles posts, channels, comments, and voting.
4. **Messaging Service:** WebSocket-based real-time chat service.
5. **Notification Service:** Handles email and in-app notifications.
6. **AI Service:** Interfaces with LLMs for text analysis and generation.

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/) (v20 or higher)
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/)
- A running PostgreSQL database (or an account with Supabase/Neon).

## 🏃 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ramanbajpai7/anonwork.git
cd anonwork
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory. You can use `.env.example` as a template if available. You will need to configure:
```env
# Database
DATABASE_URL="postgres://user:password@host:port/db"

# Authentication
JWT_SECRET_KEY="your_super_secret_jwt_key"

# AI Integration
AI_PROVIDER="groq" # or other supported provider
GROQ_API_KEY="your_api_key_here"
AI_MODEL_ID="llama3-8b-8192"

# Email SMTP
EMAIL_USER="your_email_user"
EMAIL_PASS="your_email_pass"
```

### 4. Start the Microservices Infrastructure
The platform relies on Redis, RabbitMQ, and custom microservices. Run them via Docker Compose:
```bash
docker-compose up -d --build
```
*Note: Make sure your Docker daemon is running before executing this command.*

### 5. Start the Next.js Frontend Development Server
```bash
npm run dev
```

The application will now be running at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```text
anon-work-platform-build/
├── app/                  # Next.js App Router (Frontend pages & Next.js API routes)
├── components/           # Reusable UI components (React/Radix UI)
├── hooks/                # Custom React hooks
├── lib/                  # Shared utilities (AI, DB clients, config)
├── public/               # Static assets
├── scripts/              # Database migration and seed scripts
├── services/             # Backend Microservices
│   ├── ai-service/
│   ├── api-gateway/
│   ├── content-service/
│   ├── messaging-service/
│   ├── notification-service/
│   ├── user-service/
│   └── shared/           # Shared database/message queue drivers
├── styles/               # Global CSS configurations
├── docker-compose.yml    # Infrastructure orchestration
└── package.json          # Project dependencies and scripts
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
