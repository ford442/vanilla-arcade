import './styles.css';
import VanillaTilt from 'vanilla-tilt';
import { WebGPURenderer } from './webgpu-renderer';
import { AsteroidsGame } from './asteroids-game';

// Type declaration for vanilla-tilt
declare global {
  interface HTMLElement {
    vanillaTilt?: VanillaTilt;
  }
}

class VanillaArcade {
  private renderer: WebGPURenderer | null = null;
  private game: AsteroidsGame | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private animationId: number = 0;
  private startTime: number = 0;

  async initialize(): Promise<void> {
    // Get canvas element
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    if (!this.canvas) {
      console.error('Canvas element not found');
      return;
    }

    // Set canvas resolution
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // Check for WebGPU support
    if (!navigator.gpu) {
      this.showWebGPUError();
      return;
    }

    // Initialize WebGPU renderer
    this.renderer = new WebGPURenderer(this.canvas);
    const initialized = await this.renderer.initialize();

    if (!initialized) {
      this.showWebGPUError();
      return;
    }

    // Initialize game
    this.game = new AsteroidsGame(this.canvas.width, this.canvas.height);

    // Initialize vanilla-tilt on the screen bezel
    const screenBezel = document.querySelector('.screen-bezel') as HTMLElement;
    if (screenBezel) {
      VanillaTilt.init(screenBezel, {
        max: 8,
        speed: 400,
        perspective: 1000,
        glare: true,
        'max-glare': 0.3,
        scale: 1.02,
        gyroscope: true,
        gyroscopeMinAngleX: -45,
        gyroscopeMaxAngleX: 45,
        gyroscopeMinAngleY: -45,
        gyroscopeMaxAngleY: 45,
      });
    }

    // Setup UI Controls animation
    this.setupUIControls();

    // Start game loop
    this.startTime = performance.now();
    this.gameLoop();

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private setupUIControls(): void {
    const joystickArea = document.querySelector('.joystick-area');
    const fireBtn = document.querySelector('.fire-btn');
    const thrustBtn = document.querySelector('.thrust-btn');

    if (!joystickArea || !fireBtn || !thrustBtn) return;

    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      // Joystick
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        isDown ? joystickArea.classList.add('active-up') : joystickArea.classList.remove('active-up');
        // Thrust button mirrors up key
        isDown ? thrustBtn.classList.add('active') : thrustBtn.classList.remove('active');
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        isDown ? joystickArea.classList.add('active-down') : joystickArea.classList.remove('active-down');
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        isDown ? joystickArea.classList.add('active-left') : joystickArea.classList.remove('active-left');
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        isDown ? joystickArea.classList.add('active-right') : joystickArea.classList.remove('active-right');
      }

      // Fire Button
      if (e.code === 'Space') {
        isDown ? fireBtn.classList.add('active') : fireBtn.classList.remove('active');
      }
    };

    document.addEventListener('keydown', (e) => handleKey(e, true));
    document.addEventListener('keyup', (e) => handleKey(e, false));

    // Also handle touch/mouse events on the onscreen buttons to animate them
    const addBtnListeners = (btn: Element) => {
        btn.addEventListener('mousedown', () => btn.classList.add('active'));
        btn.addEventListener('mouseup', () => btn.classList.remove('active'));
        btn.addEventListener('mouseleave', () => btn.classList.remove('active'));
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); btn.classList.add('active'); });
        btn.addEventListener('touchend', () => btn.classList.remove('active'));
    };

    addBtnListeners(fireBtn);
    addBtnListeners(thrustBtn);
  }

  private showWebGPUError(): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'webgpu-not-supported';
    errorDiv.innerHTML = `
      <h2>WebGPU Not Supported</h2>
      <p>Your browser does not support WebGPU.</p>
      <p>Please try using Chrome 113+ or Edge 113+</p>
    `;
    document.querySelector('.screen-recess')?.appendChild(errorDiv);
  }

  private handleResize(): void {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Reinitialize game with new dimensions
    if (this.game) {
      this.game = new AsteroidsGame(this.canvas.width, this.canvas.height);
    }
  }

  private gameLoop = (): void => {
    const currentTime = (performance.now() - this.startTime) / 1000;
    
    // Update game state
    this.game?.update();
    
    // Get vertices and render
    const vertices = this.game?.getVertices(currentTime) || [];
    this.renderer?.render(vertices, currentTime);
    
    // Schedule next frame
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  destroy(): void {
    cancelAnimationFrame(this.animationId);
    this.renderer?.destroy();
    
    const screenBezel = document.querySelector('.screen-bezel') as HTMLElement;
    if (screenBezel?.vanillaTilt) {
      screenBezel.vanillaTilt.destroy();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const arcade = new VanillaArcade();
  arcade.initialize().catch(console.error);
});
