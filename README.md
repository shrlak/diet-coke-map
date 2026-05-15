# Diet Coke Store Locator

A web application that helps users find Diet Coke retailers across the United States, view store hours, and discover available product types.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- A Supabase account (free at https://supabase.com)
- Git

### Local Development Setup

1. **Clone and install dependencies:**
```bash
git clone https://github.com/yourusername/diet-coke-map.git
cd diet-coke-map
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
```
Add your Supabase credentials to `.env.local`

3. **Start the development server:**
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser

## 📋 Features

### MVP (Phase 1)
- ✅ User authentication (email/password + Google + Apple OAuth)
- ✅ Interactive map with store locations
- ✅ Store search by address, zip code, or current location
- ✅ Distance-based filtering (5, 10, 25 miles)
- ✅ Product availability filtering
- ✅ Store details (hours, phone, products, distance)
- ✅ Save favorite stores (requires login)
- ✅ Responsive design (mobile, tablet, desktop)

### Phase 2 (Planned)
- Crowdsourced store updates
- Admin dashboard for data management
- Expand to multiple states
- SEO improvements

### Phase 3 (Future)
- React Native mobile app (iOS + Android)
- Real-time inventory updates
- Stock alerts & notifications
- Store ratings & reviews

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Maps:** Leaflet (free) or Mapbox GL (optional)
- **Backend:** Supabase (PostgreSQL + REST API + Auth)
- **Deployment:** GitHub Pages
- **Routing:** React Router

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
├── pages/              # Page-level components
├── services/           # Supabase client & utilities
├── hooks/              # Custom React hooks
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component
└── main.tsx            # React entry point
```

## 🗄️ Supabase Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Click "New Project"
- Name it "diet-coke-map"
- Choose your region (US recommended)
- Create project

### 2. Create Database Tables
See `docs/SUPABASE_SETUP.md` for detailed SQL schema and instructions

### 3. Set Up Authentication
- In Supabase dashboard, go to "Auth" → "Providers"
- Enable "Email" (default is on)
- Add Google OAuth provider
- Add Apple Sign-In provider
- Get your project URL and anon key from Settings → API

### 4. Update .env.local
```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run preview         # Preview production build

# Building
npm run build           # Build for production

# Code Quality
npm run type-check      # TypeScript type checking
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint errors

# Deployment
git push origin main   # Triggers GitHub Actions deployment to GitHub Pages
```

## 🚀 Deployment

### GitHub Pages Setup
1. Enable GitHub Pages in repo settings
2. Set source to "GitHub Actions"
3. Ensure `.github/workflows/deploy.yml` exists
4. Push to `main` branch to trigger deployment

## 📝 Development Workflow

1. Create feature branch: `git checkout -b feature/store-search`
2. Make changes and test locally
3. Commit with clear messages: `git commit -m "Add store search by zip code"`
4. Push to branch: `git push origin feature/store-search`
5. Create Pull Request on GitHub
6. Code review and merge to `main` to deploy

## 🎯 Roadmap

- **Week 1-2:** Project setup ✅ (in progress)
- **Week 3-4:** Database & data import
- **Week 5-6:** Authentication & user system
- **Week 7-8:** Map & store search
- **Week 9-10:** Store details & favorites
- **Week 11-12:** Testing & launch
- **Week 13+:** Expansion & mobile app

## 📄 License

MIT License - feel free to use this project for personal or commercial use.

---

Built with ❤️ for Diet Coke fans
