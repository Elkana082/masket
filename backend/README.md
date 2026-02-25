# 🛍️ Masket — Full-Stack E-commerce Platform

## Tech Stack
- **Backend:** Node.js + Express + MongoDB + JWT
- **Frontend:** Vanilla HTML/CSS/JS (SPA)
- **Auth:** JWT (30-day long sessions)
- **Storage:** MongoDB + local file uploads

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# 3. Start the server
npm start

# For development (auto-restart)
npm run dev
```

## Admin Access
Set `ADMIN_EMAIL=your@email.com` in `.env`.
Register an account with that email → you become admin automatically.

## Features
- ✅ JWT Authentication (30-day sessions)
- ✅ Landing page with editable hero content
- ✅ Categories: Shoes, Jewelry, Clothes, Electronics
- ✅ Brand New / Refurbished product filtering
- ✅ Shopping cart (persistent)
- ✅ Manual checkout (M-Pesa / Airtel Money)
- ✅ Order tracking
- ✅ Contact form with working hours
- ✅ User profile page
- ✅ Admin panel: products, orders, messages, landing editor
- ✅ Product image upload
- ✅ Dark mode
- ✅ Mobile responsive

## Default Ports
- App: http://localhost:3000
- MongoDB: mongodb://localhost:27017/masket

## Payment Numbers (customize in index.html)
- M-Pesa: 0712 345 678
- Airtel: 0733 456 789