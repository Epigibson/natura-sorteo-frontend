import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  Input,
} from '@angular/core';
import * as THREE from 'three';
// @ts-ignore
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// @ts-ignore
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// @ts-ignore
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

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

  @Input() particleCount = 150;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: any;
  private particles!: THREE.Points;
  private torusKnot!: THREE.Mesh;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;
  private animationId = 0;
  private mouse = { x: 0, y: 0 };
  private time = 0;
  private clock = new THREE.Clock();

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
    this.composer?.dispose?.();
  }

  private init() {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || window.innerWidth;
    const h = parent?.clientHeight || window.innerHeight;
    const isMobile = w < 768;

    // Scene + fog para profundidad
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050a15, 0.06);

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 6);

    // Renderer optimizado
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // ===== TORUS KNOT DORADO =====
    const torusGeo = new THREE.TorusKnotGeometry(1, 0.35, 128, 24, 2, 3);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0xc9a227,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xc9a227,
      emissiveIntensity: 0.15,
    });
    this.torusKnot = new THREE.Mesh(torusGeo, torusMat);
    this.torusKnot.position.set(0, 0, -2);
    this.torusKnot.scale.setScalar(isMobile ? 0.7 : 1);
    this.scene.add(this.torusKnot);

    // Luces para el torus
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.6);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xc9a227, 2.5, 12);
    pointLight1.position.set(3, 2, 3);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4caf50, 1.5, 12);
    pointLight2.position.set(-3, -1, 2);
    this.scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xf0c94e, 1.8, 10);
    pointLight3.position.set(0, 3, 1);
    this.scene.add(pointLight3);

    // ===== PARTÍCULAS =====
    const count = isMobile ? Math.floor(this.particleCount * 0.5) : this.particleCount;
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    const gold = new THREE.Color(0xc9a227);
    const goldLight = new THREE.Color(0xf0c94e);
    const green = new THREE.Color(0x4caf50);
    const white = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      velocities[i * 3] = (Math.random() - 0.5) * 0.004;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.003;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;

      const r = Math.random();
      let color: THREE.Color;
      if (r < 0.45) color = gold;
      else if (r < 0.65) color = goldLight;
      else if (r < 0.82) color = green;
      else color = white;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);

    (this.particles as any).velocities = velocities;

    // ===== POSTPROCESSING: BLOOM =====
    if (!isMobile) {
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(w, h),
        0.55,  // strength (bajo para performance)
        0.6,   // radius
        0.7,   // threshold
      );
      this.composer.addPass(bloomPass);
    }
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    this.time += delta;

    // Rotación del torus knot
    if (this.torusKnot) {
      this.torusKnot.rotation.x += delta * 0.15;
      this.torusKnot.rotation.y += delta * 0.22;

      // Mouse parallax en el torus
      this.torusKnot.position.x += (this.mouse.x * 0.6 - this.torusKnot.position.x) * 0.03;
      this.torusKnot.position.y += (this.mouse.y * 0.4 - this.torusKnot.position.y) * 0.03;
    }

    // Partículas
    const positions = this.geometry.attributes['position'].array as Float32Array;
    const velocities = (this.particles as any).velocities as Float32Array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      positions[ix] += velocities[ix] + Math.sin(this.time * 0.5 + i * 0.1) * 0.0012;
      positions[ix + 1] += velocities[ix + 1] + Math.cos(this.time * 0.4 + i * 0.15) * 0.001;
      positions[ix + 2] += velocities[ix + 2];

      if (positions[ix] > 7 || positions[ix] < -7) velocities[ix] *= -1;
      if (positions[ix + 1] > 4.5 || positions[ix + 1] < -4.5) velocities[ix + 1] *= -1;
      if (positions[ix + 2] > 4 || positions[ix + 2] < -4) velocities[ix + 2] *= -1;
    }

    this.geometry.attributes['position'].needsUpdate = true;

    // Rotación de partículas con mouse
    this.particles.rotation.y += (this.mouse.x * 0.2 - this.particles.rotation.y) * 0.025;
    this.particles.rotation.x += (this.mouse.y * 0.12 - this.particles.rotation.x) * 0.025;

    // Pulso de opacidad
    this.material.opacity = 0.7 + Math.sin(this.time * 1.5) * 0.15;

    // Render (con bloom si está disponible)
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
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
    if (this.composer) {
      this.composer.setSize(w, h);
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };
}
