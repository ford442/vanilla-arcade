# Vanilla Arcade

A virtual arcade machine with a recessed screen effect using vanilla-tilt.js and WebGPU rendering.

## Features

- **3D Tilt Effect**: The arcade screen uses vanilla-tilt.js to create a realistic recessed screen appearance that responds to mouse movement
- **WebGPU Rendering**: Modern GPU-accelerated graphics using the WebGPU API
- **Asteroids Game**: Classic asteroid blasting gameplay with expanded screen area from the tilt effect
- **Retro Arcade Design**: Authentic arcade cabinet styling with marquee, controls, and coin slot

## Requirements

- Node.js 18+ 
- A browser with WebGPU support (Chrome 113+, Edge 113+)

## Installation

```bash
npm install
```

## Usage

### Development Server

Start the development server with hot reload:

```bash
npm run dev
```

Or open in browser automatically:

```bash
npm start
```

### Production Build

Build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Type Checking

Run TypeScript type checking:

```bash
npm run lint
```

## Controls

- **Arrow Keys / WASD**: Rotate ship
- **Arrow Up / W**: Thrust
- **Space**: Fire
- **On-screen buttons**: Fire and Thrust controls

## Technology Stack

- **vanilla-tilt.js**: 3D tilt effect for the recessed screen
- **WebGPU**: GPU-accelerated rendering
- **TypeScript**: Type-safe JavaScript
- **Webpack**: Module bundling and development server
