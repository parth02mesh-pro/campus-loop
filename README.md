# 🎓 Campus Loop

**From Your Campus. To Your Campus.**

A modern Gen-Z student marketplace connecting students to buy, sell, rent and exchange items within their campus community.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8)

## ✨ Features

### Marketplace
- 🛒 **Buy & Sell** - List and purchase items with ease
- 🔄 **Rent** - Rent items by the day, week, month or semester
- ♻️ **Exchange** - Swap items with other students
- 🎁 **Free** - Give away items to your campus community

### Core Features
- ✅ Email & phone verification
- 💬 Real-time chat between buyers and sellers
- ⭐ Rating & reviews system
- 🛡️ Verified student badges
- 📊 Buyer & seller dashboards
- 🔍 Advanced search & filters
- 📱 Mobile-first responsive design
- 🔐 Secure authentication with JWT
- 🎨 Beautiful Gen-Z inspired UI

### Admin Panel
- User management
- Product moderation
- Campus management
- Email campaigns
- Analytics & insights
- Notifications & broadcasts

## 🚀 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4.1
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Custom JWT with jose
- **Icons**: Lucide React
- **UI**: Radix UI primitives
- **Payments**: Razorpay (ready for integration)
- **Email/SMS**: Ready for integration

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd campus-loop
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and other secrets.

4. **Push database schema**
```bash
npx drizzle-kit push
```

5. **Seed demo data**
```bash
npx tsx src/db/seed.ts
```

6. **Start the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🔐 Demo Accounts

After seeding, use these accounts:

**Admin**
- Email: `admin@campusloop.in`
- Password: `Admin@123`

**Student**
- Email: `arjun@campusloop.in`
- Password: `Student@123`

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin panel
│   ├── dashboard/         # User dashboard
│   ├── explore/           # Marketplace
│   ├── products/          # Product detail
│   ├── sell/              # Sell flow
│   ├── rent/              # Rental listings
│   ├── exchange/          # Exchange listings
│   ├── free/              # Free items
│   ├── login/             # Authentication
│   ├── signup/
│   └── profile/           # User profile
├── components/            # Reusable components
├── contexts/             # React contexts (Auth)
├── db/                   # Database schema & client
│   ├── schema.ts         # Drizzle schema
│   ├── seed.ts           # Seed script
│   └── index.ts          # DB connection
└── lib/                  # Utilities & helpers
    ├── auth.ts           # Auth utilities
    ├── api.ts            # API helpers
    └── utils.ts          # General utilities
```

## 🚢 Deployment

### Environment Variables

Required environment variables:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
AUTH_SECRET=your-256-bit-secret-minimum-32-chars
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Optional for production features:
```bash
EMAIL_API_KEY=
SMS_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
STORAGE_URL=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

### Build for Production

```bash
npm run build
npm start
```

### Docker Deployment

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Recommended Platforms
- **Vercel** - Zero-config Next.js deployment
- **Railway** - Full-stack with PostgreSQL
- **Fly.io** - Global edge deployment
- **AWS/GCP/Azure** - Enterprise scale

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 7-day expiry
- OTP verification with rate limiting
- Server-side authorization on all routes
- Admin routes protected with role checks
- Input validation with Zod
- SQL injection prevention (Drizzle ORM)
- XSS protection
- Secure HTTP headers
- CORS configuration
- File upload validation

## 📊 Database

### Key Tables
- `users` - User accounts
- `user_profiles` - User details
- `products` - Listings
- `orders` - Purchase orders
- `rentals` - Rental transactions
- `exchanges` - Exchange requests
- `reviews` - Ratings & feedback
- `messages` - Chat conversations
- `notifications` - User notifications
- `audit_logs` - System audit trail

### Migrations
```bash
# Generate migration
npx drizzle-kit generate

# Apply migration
npx drizzle-kit push
```

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build
npm run build
```

## 📝 API Endpoints

### Public
- `GET /api/products` - List products
- `GET /api/products/[id]` - Product detail
- `GET /api/categories` - List categories
- `GET /api/stats` - Platform statistics

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Protected
- `POST /api/products` - Create listing (auth)
- `GET /api/admin/users` - Admin user list (admin)
- More endpoints available...

## 🎨 Design System

### Colors
- **Primary**: Deep Purple (#7c3aed)
- **Secondary**: Electric Blue (#3b82f6)
- **Accent**: Fresh Green (#22c55e)
- **Neutral**: Off-white (#fafafa)

### Typography
- Modern sans-serif font stack
- Bold headlines (3xl-6xl)
- Clean body text
- Readable contrast ratios

### Components
- Rounded cards (rounded-2xl)
- Smooth transitions
- Subtle shadows
- Micro-interactions
- Skeleton loaders
- Toast notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)

## 📧 Contact

For questions or support:
- Email: hello@campusloop.in
- Website: https://campusloop.in

---

**Keep It Moving. Keep It in the Loop.** 🔄
