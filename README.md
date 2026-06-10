# 🐍 Neon Snake: Retro Evolution

A feature-rich browser snake game built with vanilla HTML, CSS, and JavaScript — far beyond the classic. Four difficulty levels, unlockable neon themes, a combo multiplier system, power-ups, achievements, lifetime stats, and full mobile support.

**[▶ Play Live](https://neon-snake-gamee.netlify.app)** &nbsp;|&nbsp; **[View Code](https://github.com/Hammadniazi/neon-snake-game)**

---

## ✨ Features

### Gameplay

- **4 difficulty levels** — Easy, Medium, Hard, Xtreme (each with a different speed and score multiplier)
- **Combo multiplier** — eat food quickly to chain combos and multiply your score
- **Boost / dash mechanic** — hold `Space` for a burst of speed with bonus score
- **5 food types** — Normal, Golden, Mega, Speedy, Slow Down (each with different points and effects)
- **4 power-ups** — Shield 🛡️, Magnet 🧲, 2× Points ⚡, Ghost 👻 (with active timers shown in HUD)
- **3-2-1 countdown** before each game starts so you're always ready
- **Particle explosions**, **floating score popups**, and **screen shake** on impact

### Customisation

- **4 neon snake themes** — Toxic, Cyber, Candy, Viper
- **Dark / Light mode** toggle — preferences saved across sessions

### Progression & Persistence

- **High score** visible in both the menu and the in-game HUD
- **Lifetime stats** — games played, total food eaten, top score, longest snake, favourite mode
- **Local leaderboard** — top 5 scores across all sessions
- **6 unlockable achievements** with toast notifications on unlock

### Controls

| Input                     | Action                |
| ------------------------- | --------------------- |
| `Arrow Keys` or `W A S D` | Move snake            |
| `Space` (hold)            | Boost / dash          |
| `Escape`                  | Pause / resume        |
| On-screen D-pad           | Mobile touch controls |
| Swipe on canvas           | Mobile swipe controls |

---

## 🚀 Getting Started

No build tools or dependencies required for playing. It's a Vite project for development.

### Play instantly

Open `index.html` directly — or use the [live demo](https://neon-snake-gamee.netlify.app).

### Local development

```bash
git clone https://github.com/Hammadniazi/neon-snake-game.git
cd neon-snake-game
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
```

Output goes to `/dist` — deploy that folder to Netlify, Vercel, or GitHub Pages.

---

## 📁 Project Structure

```
neon-snake-game/
├── index.html          # Game markup, screens, modals, and HUD
├── src/
│   ├── main.js         # All game logic — engine, controls, UI, storage, achievements
│   └── style.css       # All styling — neon theme variables, animations, responsive layout
├── package.json        # Vite dev dependency
└── vite.config.js      # Vite config (if present)
```

---

## 🧠 How It Works

### Architecture

Everything lives in a single `Game` object in `main.js` — state machine, game loop, rendering, input, and UI routing. Sections are clearly labelled:

1. **Sound System** — Web Audio API synthesizer (no external files, all tones generated in-code)
2. **Storage & Persistence** — lightweight `localStorage` wrapper
3. **Achievements** — condition-based unlock system checked after each food eat and on game over
4. **Particle Engine** — canvas particle system for food explosions
5. **Core Game Loop** — `requestAnimationFrame` loop with delta-time tick control
6. **UI Interactions** — DOM event wiring for all buttons, modals, and controls

### Scoring

```
points = foodBase × difficultyMultiplier × comboMultiplier × [powerupBonus] × [boostBonus]
```

### State Machine

```
STATE_MENU → STATE_PLAYING ⇄ STATE_PAUSED → STATE_GAMEOVER → STATE_MENU
```

---

## 🛠️ Built With

- **HTML5 Canvas** — game rendering
- **CSS3** — glassmorphism UI, neon glow effects, CSS custom properties, responsive layout
- **Vanilla JavaScript (ES6+)** — zero runtime dependencies
- **Web Audio API** — synthesised retro sound effects
- **localStorage API** — persistent stats, preferences, leaderboard
- **Vite** — dev server and bundler
- **Netlify** — deployment

---

## 🗺️ Roadmap

- [ ] Online leaderboard via a serverless function
- [ ] More unlockable themes (unlock by reaching score milestones)
- [ ] Speed ramp-up over time within a single game
- [ ] Obstacle / maze mode
- [ ] Share score card as image

---

## 👤 Author

**Hammad Khan**

- 🌐 Portfolio: [hammad-portfolio-site.netlify.app](https://hammad-portfolio-site.netlify.app)
- 💻 GitHub: [@Hammadniazi](https://github.com/Hammadniazi)
- 🔗 LinkedIn: [linkedin.com/in/hammad-khan-902bb7b7](https://www.linkedin.com/in/hammad-khan-902bb7b7)

---

## 📄 License

MIT — free to use, modify, and distribute.
