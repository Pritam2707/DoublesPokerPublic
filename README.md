# ♠️ Doubles Poker

**Doubles Poker** is a fast-paced, real-time PvP card game inspired by classic Poker — with a unique twist made for modern web play. Built with **Next.js** for lightning-fast frontend performance and **Firebase** for real-time multiplayer and user authentication.


## 🎮 Gameplay Overview

- 🃏 **2-Player real-time battles**: Challenge friends or strangers in short poker-inspired duels.
- ♣️ **Simplified hand mechanics**: Combines the thrill of poker with quick strategic rounds.
- 💬 **Instant matchmaking**: Join a game in seconds.
- 🔥 **Real-time sync**: All moves and hand updates reflect instantly with Firebase.

---

## 🧱 Tech Stack

| Tech            | Role                              |
|-----------------|-----------------------------------|
| **Next.js**     | Frontend UI & SSR/SPA rendering   |
| **Firebase**    | Auth, Firestore (Realtime DB), Hosting |
| **Tailwind CSS**| Styling and responsive layout     |
| **Vercel**      | Deployment (optional)             |


## 🚀 Getting Started

### 1. Clone the repo

```
git clone https://github.com/Pritam2707/DoublesPoker.git
cd DoublesPoker
````

### 2. Install dependencies

```
npm install
```

### 3. Set up Firebase

Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)


### 4. Run the app locally

```
npm run dev
```

Visit `http://localhost:3000` in your browser to start playing.


## 🧩 Features

* ✅ Firebase Authentication (Email, Google)
* ✅ Firestore-based real-time game engine
* ✅ Matchmaking and room creation
* ✅ Poker-style UI and gameplay
* ✅ Mobile-friendly layout

## 📁 Folder Structure

```
doubles-poker/
├── components/      # UI components (cards, buttons, etc.)
├── pages/           # Next.js pages (lobby, game, login)
├── lib/             # Firebase config and helper functions
├── styles/          # Tailwind/global styles
└── public/          # Static assets (images, icons, etc.)
```

## 📦 Build & Deploy

To build for production:

```
npm run build
```

To deploy (e.g., using Vercel):

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Add the same environment variables in the Vercel dashboard
3. Click **Deploy**


## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

## ✨ Credits

* Developed by [Pritam2707](https://github.com/Pritam2707) & [Interested-Person](https://github.com/Interested-Person)
* Inspired by traditional Poker, adapted for fast 1v1 play

