import { Vertex } from './webgpu-renderer';

// Game entity interfaces
interface Vector2D {
  x: number;
  y: number;
}

interface Ship {
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;
  thrust: boolean;
  vertices: Vector2D[];
}

interface Asteroid {
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;
  rotationSpeed: number;
  size: number;
  vertices: Vector2D[];
}

interface Bullet {
  position: Vector2D;
  velocity: Vector2D;
  life: number;
}

interface Star {
  x: number;
  y: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

// Game constants
const SHIP_SIZE = 20;
const SHIP_THRUST = 0.15;
const SHIP_FRICTION = 0.99;
const SHIP_ROTATION_SPEED = 0.08;
const BULLET_SPEED = 8;
const BULLET_LIFE = 60;
const MAX_ASTEROIDS = 15;
const ASTEROID_SPEED = 1.5;
const STAR_COUNT = 100;

export class AsteroidsGame {
  private width: number;
  private height: number;
  private ship: Ship;
  private asteroids: Asteroid[] = [];
  private bullets: Bullet[] = [];
  private stars: Star[] = [];
  private score: number = 0;
  private keys: { [key: string]: boolean } = {};
  private gameOver: boolean = false;
  private invincibleTime: number = 120;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.ship = this.createShip();
    this.initAsteroids(5);
    this.initStars();
    this.setupControls();
  }

  private createShip(): Ship {
    return {
      position: { x: this.width / 2, y: this.height / 2 },
      velocity: { x: 0, y: 0 },
      rotation: -Math.PI / 2,
      thrust: false,
      vertices: [
        { x: SHIP_SIZE, y: 0 },
        { x: -SHIP_SIZE * 0.7, y: -SHIP_SIZE * 0.6 },
        { x: -SHIP_SIZE * 0.4, y: 0 },
        { x: -SHIP_SIZE * 0.7, y: SHIP_SIZE * 0.6 },
      ],
    };
  }

  private createAsteroidVertices(size: number): Vector2D[] {
    const vertices: Vector2D[] = [];
    const numVertices = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numVertices; i++) {
      const angle = (i / numVertices) * Math.PI * 2;
      const variance = 0.6 + Math.random() * 0.4;
      vertices.push({
        x: Math.cos(angle) * size * variance,
        y: Math.sin(angle) * size * variance,
      });
    }
    return vertices;
  }

  private initAsteroids(count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawnAsteroid(60 + Math.random() * 20);
    }
  }

  private spawnAsteroid(size: number, position?: Vector2D): void {
    if (this.asteroids.length >= MAX_ASTEROIDS) return;

    let pos: Vector2D;
    if (position) {
      pos = { ...position };
    } else {
      // Spawn at edge of screen
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: pos = { x: 0, y: Math.random() * this.height }; break;
        case 1: pos = { x: this.width, y: Math.random() * this.height }; break;
        case 2: pos = { x: Math.random() * this.width, y: 0 }; break;
        default: pos = { x: Math.random() * this.width, y: this.height }; break;
      }
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = (ASTEROID_SPEED * (100 - size)) / 50;

    this.asteroids.push({
      position: pos,
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.04,
      size,
      vertices: this.createAsteroidVertices(size),
    });
  }

  private initStars(): void {
    for (let i = 0; i < STAR_COUNT; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        brightness: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.02 + Math.random() * 0.05,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  private setupControls(): void {
    const handleKey = (e: KeyboardEvent, pressed: boolean) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.keys['left'] = pressed;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.keys['right'] = pressed;
          break;
        case 'ArrowUp':
        case 'KeyW':
          this.keys['up'] = pressed;
          break;
        case 'Space':
          if (pressed && !this.keys['fire']) {
            this.fireBullet();
          }
          this.keys['fire'] = pressed;
          break;
      }
    };

    document.addEventListener('keydown', (e) => handleKey(e, true));
    document.addEventListener('keyup', (e) => handleKey(e, false));

    // Button controls
    const fireBtn = document.querySelector('.fire-btn');
    const thrustBtn = document.querySelector('.thrust-btn');
    
    fireBtn?.addEventListener('mousedown', () => this.fireBullet());
    fireBtn?.addEventListener('touchstart', (e) => { e.preventDefault(); this.fireBullet(); });
    
    thrustBtn?.addEventListener('mousedown', () => { this.keys['up'] = true; });
    thrustBtn?.addEventListener('mouseup', () => { this.keys['up'] = false; });
    thrustBtn?.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys['up'] = true; });
    thrustBtn?.addEventListener('touchend', () => { this.keys['up'] = false; });
  }

  private fireBullet(): void {
    if (this.gameOver) {
      this.restart();
      return;
    }

    this.bullets.push({
      position: {
        x: this.ship.position.x + Math.cos(this.ship.rotation) * SHIP_SIZE,
        y: this.ship.position.y + Math.sin(this.ship.rotation) * SHIP_SIZE,
      },
      velocity: {
        x: Math.cos(this.ship.rotation) * BULLET_SPEED + this.ship.velocity.x * 0.5,
        y: Math.sin(this.ship.rotation) * BULLET_SPEED + this.ship.velocity.y * 0.5,
      },
      life: BULLET_LIFE,
    });
  }

  private restart(): void {
    this.ship = this.createShip();
    this.asteroids = [];
    this.bullets = [];
    this.score = 0;
    this.gameOver = false;
    this.invincibleTime = 120;
    this.initAsteroids(5);
  }

  update(): void {
    if (this.gameOver) return;

    if (this.invincibleTime > 0) {
      this.invincibleTime--;
    }

    // Ship rotation
    if (this.keys['left']) {
      this.ship.rotation -= SHIP_ROTATION_SPEED;
    }
    if (this.keys['right']) {
      this.ship.rotation += SHIP_ROTATION_SPEED;
    }

    // Ship thrust
    this.ship.thrust = this.keys['up'] || false;
    if (this.ship.thrust) {
      this.ship.velocity.x += Math.cos(this.ship.rotation) * SHIP_THRUST;
      this.ship.velocity.y += Math.sin(this.ship.rotation) * SHIP_THRUST;
    }

    // Apply friction
    this.ship.velocity.x *= SHIP_FRICTION;
    this.ship.velocity.y *= SHIP_FRICTION;

    // Update ship position
    this.ship.position.x += this.ship.velocity.x;
    this.ship.position.y += this.ship.velocity.y;

    // Wrap ship position
    this.wrapPosition(this.ship.position);

    // Update bullets
    this.bullets = this.bullets.filter((bullet) => {
      bullet.position.x += bullet.velocity.x;
      bullet.position.y += bullet.velocity.y;
      this.wrapPosition(bullet.position);
      bullet.life--;
      return bullet.life > 0;
    });

    // Update asteroids
    for (const asteroid of this.asteroids) {
      asteroid.position.x += asteroid.velocity.x;
      asteroid.position.y += asteroid.velocity.y;
      asteroid.rotation += asteroid.rotationSpeed;
      this.wrapPosition(asteroid.position);
    }

    // Check bullet-asteroid collisions (using squared distances to avoid sqrt)
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j];
        const dx = bullet.position.x - asteroid.position.x;
        const dy = bullet.position.y - asteroid.position.y;
        const distSquared = dx * dx + dy * dy;
        const radiusSquared = asteroid.size * asteroid.size;

        if (distSquared < radiusSquared) {
          // Remove bullet
          this.bullets.splice(i, 1);
          
          // Split or remove asteroid
          const removedAsteroid = this.asteroids.splice(j, 1)[0];
          this.score += Math.floor(100 / removedAsteroid.size * 10);

          if (removedAsteroid.size > 25) {
            const newSize = removedAsteroid.size * 0.5;
            this.spawnAsteroid(newSize, removedAsteroid.position);
            this.spawnAsteroid(newSize, removedAsteroid.position);
          }

          break;
        }
      }
    }

    // Check ship-asteroid collisions (using squared distances to avoid sqrt)
    if (this.invincibleTime <= 0) {
      for (const asteroid of this.asteroids) {
        const dx = this.ship.position.x - asteroid.position.x;
        const dy = this.ship.position.y - asteroid.position.y;
        const distSquared = dx * dx + dy * dy;
        const collisionRadius = asteroid.size + SHIP_SIZE * 0.5;
        const radiusSquared = collisionRadius * collisionRadius;

        if (distSquared < radiusSquared) {
          this.gameOver = true;
          break;
        }
      }
    }

    // Spawn new asteroids if needed
    if (this.asteroids.length < 3) {
      this.spawnAsteroid(50 + Math.random() * 30);
    }
  }

  private wrapPosition(pos: Vector2D): void {
    if (pos.x < 0) pos.x = this.width;
    if (pos.x > this.width) pos.x = 0;
    if (pos.y < 0) pos.y = this.height;
    if (pos.y > this.height) pos.y = 0;
  }

  getVertices(time: number): Vertex[] {
    const vertices: Vertex[] = [];

    // Draw stars with twinkling
    for (const star of this.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
      const brightness = star.brightness * twinkle;
      
      // Draw star as a small cross
      const size = 1;
      const color = { r: brightness, g: brightness, b: brightness * 1.2, a: 1 };
      
      vertices.push({ x: star.x - size, y: star.y, ...color });
      vertices.push({ x: star.x + size, y: star.y, ...color });
    }

    // Draw ship
    const shipColor = this.invincibleTime > 0 && Math.floor(time * 10) % 2 === 0
      ? { r: 0.5, g: 0.5, b: 1, a: 1 }
      : { r: 0, g: 1, b: 0.5, a: 1 };

    if (!this.gameOver) {
      const shipVerts = this.ship.vertices.map((v) => ({
        x: this.ship.position.x + v.x * Math.cos(this.ship.rotation) - v.y * Math.sin(this.ship.rotation),
        y: this.ship.position.y + v.x * Math.sin(this.ship.rotation) + v.y * Math.cos(this.ship.rotation),
      }));

      for (let i = 0; i < shipVerts.length; i++) {
        const next = (i + 1) % shipVerts.length;
        vertices.push({ x: shipVerts[i].x, y: shipVerts[i].y, ...shipColor });
        vertices.push({ x: shipVerts[next].x, y: shipVerts[next].y, ...shipColor });
      }

      // Draw thrust flame
      if (this.ship.thrust) {
        const flameSize = SHIP_SIZE * 0.6 * (0.8 + Math.random() * 0.4);
        const flameBase = {
          x: this.ship.position.x - Math.cos(this.ship.rotation) * SHIP_SIZE * 0.4,
          y: this.ship.position.y - Math.sin(this.ship.rotation) * SHIP_SIZE * 0.4,
        };
        const flameTip = {
          x: flameBase.x - Math.cos(this.ship.rotation) * flameSize,
          y: flameBase.y - Math.sin(this.ship.rotation) * flameSize,
        };
        const flameColor = { r: 1, g: 0.5, b: 0, a: 1 };
        
        vertices.push({ x: flameBase.x, y: flameBase.y, ...flameColor });
        vertices.push({ x: flameTip.x, y: flameTip.y, r: 1, g: 0.8, b: 0, a: 1 });
      }
    }

    // Draw asteroids
    const asteroidColor = { r: 0.7, g: 0.7, b: 0.7, a: 1 };
    for (const asteroid of this.asteroids) {
      const rotatedVerts = asteroid.vertices.map((v) => ({
        x: asteroid.position.x + v.x * Math.cos(asteroid.rotation) - v.y * Math.sin(asteroid.rotation),
        y: asteroid.position.y + v.x * Math.sin(asteroid.rotation) + v.y * Math.cos(asteroid.rotation),
      }));

      for (let i = 0; i < rotatedVerts.length; i++) {
        const next = (i + 1) % rotatedVerts.length;
        vertices.push({ x: rotatedVerts[i].x, y: rotatedVerts[i].y, ...asteroidColor });
        vertices.push({ x: rotatedVerts[next].x, y: rotatedVerts[next].y, ...asteroidColor });
      }
    }

    // Draw bullets
    const bulletColor = { r: 1, g: 1, b: 0, a: 1 };
    for (const bullet of this.bullets) {
      const size = 3;
      vertices.push({ x: bullet.position.x - size, y: bullet.position.y, ...bulletColor });
      vertices.push({ x: bullet.position.x + size, y: bullet.position.y, ...bulletColor });
      vertices.push({ x: bullet.position.x, y: bullet.position.y - size, ...bulletColor });
      vertices.push({ x: bullet.position.x, y: bullet.position.y + size, ...bulletColor });
    }

    // Draw score
    this.drawText(vertices, `SCORE: ${this.score}`, 20, 30, { r: 1, g: 1, b: 1, a: 1 });

    // Draw game over message
    if (this.gameOver) {
      this.drawText(vertices, 'GAME OVER', this.width / 2 - 80, this.height / 2, { r: 1, g: 0, b: 0, a: 1 });
      this.drawText(vertices, 'PRESS FIRE TO RESTART', this.width / 2 - 150, this.height / 2 + 30, { r: 1, g: 1, b: 0, a: 1 });
    }

    return vertices;
  }

  private drawText(vertices: Vertex[], text: string, x: number, y: number, color: { r: number; g: number; b: number; a: number }): void {
    // Simple line-based font rendering for arcade style
    const charWidth = 12;
    const charHeight = 16;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const cx = x + i * charWidth;
      
      // Simplified character rendering with lines
      const segments = this.getCharacterSegments(char);
      for (const seg of segments) {
        vertices.push({
          x: cx + seg[0] * charWidth * 0.8,
          y: y + seg[1] * charHeight,
          ...color
        });
        vertices.push({
          x: cx + seg[2] * charWidth * 0.8,
          y: y + seg[3] * charHeight,
          ...color
        });
      }
    }
  }

  private getCharacterSegments(char: string): number[][] {
    // Returns line segments for simple character rendering [x1, y1, x2, y2] normalized 0-1
    const segments: { [key: string]: number[][] } = {
      'S': [[1, 0, 0, 0], [0, 0, 0, 0.5], [0, 0.5, 1, 0.5], [1, 0.5, 1, 1], [1, 1, 0, 1]],
      'C': [[1, 0, 0, 0], [0, 0, 0, 1], [0, 1, 1, 1]],
      'O': [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0]],
      'R': [[0, 0, 0, 1], [0, 0, 1, 0], [1, 0, 1, 0.5], [1, 0.5, 0, 0.5], [0, 0.5, 1, 1]],
      'E': [[1, 0, 0, 0], [0, 0, 0, 1], [0, 0.5, 0.8, 0.5], [0, 1, 1, 1]],
      'G': [[1, 0, 0, 0], [0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0.5], [1, 0.5, 0.5, 0.5]],
      'A': [[0, 1, 0.5, 0], [0.5, 0, 1, 1], [0.2, 0.6, 0.8, 0.6]],
      'M': [[0, 1, 0, 0], [0, 0, 0.5, 0.4], [0.5, 0.4, 1, 0], [1, 0, 1, 1]],
      'V': [[0, 0, 0.5, 1], [0.5, 1, 1, 0]],
      'P': [[0, 0, 0, 1], [0, 0, 1, 0], [1, 0, 1, 0.5], [1, 0.5, 0, 0.5]],
      'I': [[0.5, 0, 0.5, 1], [0.2, 0, 0.8, 0], [0.2, 1, 0.8, 1]],
      'F': [[0, 0, 0, 1], [0, 0, 1, 0], [0, 0.5, 0.8, 0.5]],
      'T': [[0, 0, 1, 0], [0.5, 0, 0.5, 1]],
      'N': [[0, 1, 0, 0], [0, 0, 1, 1], [1, 1, 1, 0]],
      'D': [[0, 0, 0, 1], [0, 0, 0.8, 0], [0.8, 0, 1, 0.5], [1, 0.5, 0.8, 1], [0.8, 1, 0, 1]],
      ' ': [],
      ':': [[0.5, 0.2, 0.5, 0.3], [0.5, 0.7, 0.5, 0.8]],
      '0': [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0], [0, 0, 1, 1]],
      '1': [[0.3, 0.2, 0.5, 0], [0.5, 0, 0.5, 1], [0.2, 1, 0.8, 1]],
      '2': [[0, 0, 1, 0], [1, 0, 1, 0.5], [1, 0.5, 0, 0.5], [0, 0.5, 0, 1], [0, 1, 1, 1]],
      '3': [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0.2, 0.5, 1, 0.5]],
      '4': [[0, 0, 0, 0.5], [0, 0.5, 1, 0.5], [1, 0, 1, 1]],
      '5': [[1, 0, 0, 0], [0, 0, 0, 0.5], [0, 0.5, 1, 0.5], [1, 0.5, 1, 1], [1, 1, 0, 1]],
      '6': [[1, 0, 0, 0], [0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0.5], [1, 0.5, 0, 0.5]],
      '7': [[0, 0, 1, 0], [1, 0, 0.5, 1]],
      '8': [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0], [0, 0.5, 1, 0.5]],
      '9': [[0, 0.5, 1, 0.5], [1, 0.5, 1, 0], [1, 0, 0, 0], [0, 0, 0, 0.5], [1, 0, 1, 1], [1, 1, 0, 1]],
    };
    return segments[char] || [];
  }
}
