import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  Input,
} from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-hero-3d',
  standalone: true,
  template: `<canvas #canvas class="hero-3d-canvas"></canvas>`,
  styles: [
    `
      .hero-3d-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
      }
    `,
  ],
})
export class Hero3DComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() particleCount = 200;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;
  private animationId = 0;
  private mouse = { x: 0, y: 0 };
  private time = 0;

  ngAfterViewInit() {
    this.init();
    this.animate();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.geometry?.dispose();
    this.material?.dispose();
    this.renderer?.dispose();
  }

  private init() {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || window.innerWidth;
    const h = parent?.clientHeight || window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    this.camera.position.z = 5;

    // Renderer (optimizado)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particle count: menos en mobile
    const isMobile = w < 768;
    const count = isMobile ? Math.floor(this.particleCount * 0.4) : this.particleCount;

    // Geometry
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);

    const gold = new THREE.Color(0xc9a227);
    const goldLight = new THREE.Color(0xf0c94e);
    const green = new THREE.Color(0x4caf50);
    const white = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i++) {
      // Posiciones dispersas en un volumen
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      // Velocidades lentas
      velocities[i * 3] = (Math.random() - 0.5) * 0.003;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;

      // Colores: dorado, verde, blanco (distribución)
      const r = Math.random();
      let color: THREE.Color;
      if (r < 0.5) color = gold;
      else if (r < 0.7) color = goldLight;
      else if (r < 0.85) color = green;
      else color = white;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Tamaños variables
      sizes[i] = Math.random() * 3 + 1;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Material: partículas con brillo
    this.material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);

    // Guardar velocidades para la animación
    (this.particles as any).velocities = velocities;
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.time += 0.003;

    const positions = this.geometry.attributes['position'].array as Float32Array;
    const velocities = (this.particles as any).velocities as Float32Array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;

      // Movimiento suave + onda
      positions[ix] += velocities[ix] + Math.sin(this.time + i * 0.1) * 0.001;
      positions[ix + 1] += velocities[ix + 1] + Math.cos(this.time + i * 0.15) * 0.0008;
      positions[ix + 2] += velocities[ix + 2];

      // Rebotar en bordes
      if (positions[ix] > 6 || positions[ix] < -6) velocities[ix] *= -1;
      if (positions[ix + 1] > 4 || positions[ix + 1] < -4) velocities[ix + 1] *= -1;
      if (positions[ix + 2] > 3 || positions[ix + 2] < -3) velocities[ix + 2] *= -1;
    }

    this.geometry.attributes['position'].needsUpdate = true;

    // Rotación suave basada en mouse
    this.particles.rotation.y += (this.mouse.x * 0.15 - this.particles.rotation.y) * 0.02;
    this.particles.rotation.x += (this.mouse.y * 0.1 - this.particles.rotation.x) * 0.02;

    // Pulso de opacidad
    this.material.opacity = 0.6 + Math.sin(this.time * 2) * 0.15;

    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || window.innerWidth;
    const h = parent?.clientHeight || window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };
}
