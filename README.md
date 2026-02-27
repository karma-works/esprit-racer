# Esprit Racer

> Open source reimplementation of Lotus Challenge 3 as a modern web-based racing game with retro aesthetics.

🎮 **Play it now:** https://karma-works.github.io/esprit-racer/

![Main Menu](screenshots/main-menu.png)
![Radio Channel Selection](screenshots/radio.png)
![Gameplay](screenshots/gameplay.png)

## Features

### 🏎️ Core Racing Experience

- **Fast-paced arcade racing** with smooth 60fps gameplay
- **Pseudo-3D graphics** using classic segment-based rendering technique
- **Dynamic camera system** that follows the road curves and elevation
- **Responsive controls** with keyboard and gamepad support

### 👥 2-Player Split Screen

- **Local multiplayer** with horizontal split-screen mode
- **Independent viewports** for each player
- **Competitive racing** against friends on the same device
- **Optimized rendering** to maintain performance in split-screen

### 🎮 Multiple Game Modes

- **Single Race** - Quick race on any unlocked track
- **Time Challenge** - Race against the clock to set best lap times
- **Scenario Mode** - Complete various racing challenges:
- Overcome obstacles and hazards
- Navigate through traffic
- Survive extreme weather conditions (rain, snow, fog)
- Master different track themes and environments

### 🎵 Dynamic Music System

- **Radio channel selection** with multiple synthwave/retrowave tracks
- **Seamless music transitions** between menu and gameplay
- **Multiple music channels** to choose from:
- ESPRIT THEME
- VELOCITY VORTEX
- NEBULA NAVIGATOR
- NEON DRIVE
- NEON VELOCITY

### 🎨 Rich Visual Experience

- **Multiple track themes**: Country, City, Desert, Snow, Storm, Night, Future, and more
- **Dynamic weather effects**: Rain, snow, fog with particle systems
- **Animated scenery**: Palm trees, cacti, billboards, and trackside objects
- **Smooth sprite scaling** and rendering at multiple resolutions
- **Retro-futuristic UI** with CRT scanline effects and neon aesthetics

### 🏗️ Interactive Main Menu

- **Full menu system** with smooth transitions
- **Car selection screen** with multiple vehicle options
- **Music/radio selection** interface
- **Track builder** for custom scenarios
- **Settings and controls configuration**

### ⚡ Technical Highlights

- **TypeScript** for type-safe code
- **Canvas 2D rendering** for maximum compatibility
- **Sprite caching system** for smooth performance
- **Asset preloading** for seamless gameplay
- **Mobile-friendly** responsive design
- **No external dependencies** - pure vanilla TypeScript

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/karma-works/esprit-racer.git
   cd esprit-racer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

### Development

Start the development server with hot reload:

```bash
pnpm dev
```

The game will be available at `http://localhost:3000`

### Build

Build the project for production:

```bash
pnpm build
```

The built files will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
pnpm preview
```

### Testing

Run the test suite:

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Type Checking

Check TypeScript types:

```bash
pnpm typecheck
```

## Controls

### Player 1

- **Arrow Keys** - Steer, accelerate, brake
- **Space** - Handbrake
- **Enter** - Select/Confirm

### Player 2 (Split Screen)

- **WASD** - Steer, accelerate, brake
- **Shift** - Handbrake

## Credits

This project is inspired by and builds upon the excellent work of **Jake Gordon's JavaScript Racer**:

- **Original Engine**: [jakesgordon/javascript-racer](https://github.com/jakesgordon/javascript-racer)
- **Blog Post**: [How to build a racing game in JavaScript](https://www.codeincomplete.com/articles/javascript-racer/)

The segment-based pseudo-3D rendering technique and core racing mechanics are based on Jake's pioneering work in creating a JavaScript racing game engine.

## License

MIT License - Feel free to use, modify, and distribute!

## Acknowledgments

- Original Lotus Challenge series by Magnetic Fields
- Jake Gordon for the JavaScript Racer engine and tutorials
- The retro gaming community for inspiration

---

Built with ❤️ and a passion for retro racing games.
