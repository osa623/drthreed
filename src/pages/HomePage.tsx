import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Terminal,
  FileCode,
  Menu,
  X,
} from 'lucide-react';
import { DrThreeDLogo } from '../components/brand/DrThreeDLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { ShowcaseGallery4 } from '../components/ShowcaseGallery4';
import { ABOUT_CONTENT } from '../config/siteContent';

export const HomePage: React.FC = () => {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [webGLError, setWebGLError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<'home' | 'platform' | 'capabilities' | 'blender' | 'about'>('home');

  // Track scroll position to update sticky navbar and active section
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);

      const sectionElements = [
        { id: 'about' as const, el: document.getElementById('about') },
        { id: 'blender' as const, el: document.getElementById('blender') },
        { id: 'capabilities' as const, el: document.getElementById('capabilities') },
        { id: 'platform' as const, el: document.getElementById('platform') },
      ];

      const scrollY = window.scrollY + 160;
      let current: 'home' | 'platform' | 'capabilities' | 'blender' | 'about' = 'home';

      for (const sec of sectionElements) {
        if (sec.el && sec.el.offsetTop <= scrollY) {
          current = sec.id;
          break;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('home');
      setMobileMenuOpen(false);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id as any);
      setMobileMenuOpen(false);
    }
  };

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Initialize interactive 3D WebGL preview scene on hero background
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const container = previewContainerRef.current;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-canvas-bg';
    container.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch {
      setWebGLError('WebGL preview requires WebGL 2.0 support.');
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 3.8, 9.5);
    camera.lookAt(0, 0.6, 0);

    // Atmospheric lighting
    const ambLight = new THREE.AmbientLight(0x223344, 1.4);
    scene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.8);
    dirLight.position.set(6, 12, 8);
    scene.add(dirLight);

    const warmLight = new THREE.PointLight(0xe63946, 2.0, 14);
    warmLight.position.set(-3, 2, -2);
    scene.add(warmLight);

    // Procedural sci-fi habitat dome & contour terrain wireframe group
    const previewGroup = new THREE.Group();

    // Habitat Dome
    const domeGeo = new THREE.SphereGeometry(2.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x141d28,
      roughness: 0.25,
      metalness: 0.85,
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    previewGroup.add(domeMesh);

    // Habitat Wireframe Accents
    const wireGeo = new THREE.WireframeGeometry(domeGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.55 });
    const wireLine = new THREE.LineSegments(wireGeo, wireMat);
    previewGroup.add(wireLine);

    // Surrounding terrain wireframe grid
    const terrainGeo = new THREE.PlaneGeometry(20, 20, 24, 24);
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      if (dist > 2.8) {
        pos.setY(i, Math.sin(x * 0.55) * 0.45 + Math.cos(z * 0.55) * 0.45);
      }
    }
    terrainGeo.computeVertexNormals();

    const terrainWire = new THREE.WireframeGeometry(terrainGeo);
    const terrainWireMat = new THREE.LineBasicMaterial({ color: 0xe63946, transparent: true, opacity: 0.35 });
    const terrainLine = new THREE.LineSegments(terrainWire, terrainWireMat);
    previewGroup.add(terrainLine);

    // Satellite communications dish
    const dishGeo = new THREE.CylinderGeometry(0.85, 0.2, 0.3, 12);
    const dishMesh = new THREE.Mesh(dishGeo, domeMat);
    dishMesh.position.set(0, 2.45, 0);
    previewGroup.add(dishMesh);

    scene.add(previewGroup);

    let animId: number;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      previewGroup.rotation.y += 0.003;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseX * 2.5, 0.04);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 3.8 - mouseY * 1.5, 0.04);
      camera.lookAt(0, 0.6, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      domeGeo.dispose();
      domeMat.dispose();
      terrainGeo.dispose();
      wireGeo.dispose();
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div className="home-page">
      {/* Sticky Theme-Aware Navigation Header */}
      <div className={`reference-header-wrapper ${isScrolled ? 'is-scrolled' : ''}`}>
        <header className="reference-header">
          <Link to="/" style={{ textDecoration: 'none' }} title="DrThreeD Platform" onClick={(e) => scrollToSection(e, 'home')}>
            <DrThreeDLogo size={36} showWordmark={true} />
          </Link>

          <nav className="reference-nav-links" aria-label="Main Navigation">
            <a
              href="#"
              onClick={(e) => scrollToSection(e, 'home')}
              className={`reference-nav-item ${activeSection === 'home' ? 'active' : ''}`}
            >
              <span>Home</span>
            </a>
            <a
              href="#platform"
              onClick={(e) => scrollToSection(e, 'platform')}
              className={`reference-nav-item ${activeSection === 'platform' ? 'active' : ''}`}
            >
              <span>Platform</span>
            </a>
            <a
              href="#capabilities"
              onClick={(e) => scrollToSection(e, 'capabilities')}
              className={`reference-nav-item ${activeSection === 'capabilities' ? 'active' : ''}`}
            >
              <span>Features</span>
              <span className="reference-badge-pill">v1</span>
            </a>
            <a
              href="#blender"
              onClick={(e) => scrollToSection(e, 'blender')}
              className={`reference-nav-item ${activeSection === 'blender' ? 'active' : ''}`}
            >
              <span>Manual</span>
            </a>
            <a
              href="#about"
              onClick={(e) => scrollToSection(e, 'about')}
              className={`reference-nav-item ${activeSection === 'about' ? 'active' : ''}`}
            >
              <span>About</span>
            </a>
            <ThemeToggle />
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/inspector" className="reference-header-cta" title="Launch 3D Inspector">
              <DrThreeDLogo size={32} showWordmark={false} />
              <span className="cta-text-full">Open Inspector</span>
              <span className="cta-text-short">Inspector</span>
              <ArrowUpRight size={14} />
            </Link>

            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>
      </div>

      {/* Mobile Navigation Drawer with Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="mobile-nav-drawer-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
            <div className="mobile-drawer-header">
              <Link to="/" onClick={(e) => scrollToSection(e, 'home')}>
                <DrThreeDLogo size={32} showWordmark={true} />
              </Link>
              <button
                type="button"
                className="mobile-drawer-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-drawer-links">
              <a
                href="#"
                className={`mobile-drawer-link ${activeSection === 'home' ? 'active' : ''}`}
                onClick={(e) => scrollToSection(e, 'home')}
              >
                <span>Home</span>
                <ArrowRight size={14} style={{ opacity: 0.5 }} />
              </a>
              <a
                href="#platform"
                className={`mobile-drawer-link ${activeSection === 'platform' ? 'active' : ''}`}
                onClick={(e) => scrollToSection(e, 'platform')}
              >
                <span>Platform Architecture</span>
                <ArrowRight size={14} style={{ opacity: 0.5 }} />
              </a>
              <a
                href="#capabilities"
                className={`mobile-drawer-link ${activeSection === 'capabilities' ? 'active' : ''}`}
                onClick={(e) => scrollToSection(e, 'capabilities')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Capabilities
                  <span className="reference-badge-pill">v1</span>
                </span>
                <ArrowRight size={14} style={{ opacity: 0.5 }} />
              </a>
              <a
                href="#blender"
                className={`mobile-drawer-link ${activeSection === 'blender' ? 'active' : ''}`}
                onClick={(e) => scrollToSection(e, 'blender')}
              >
                <span>Blender Export Guide</span>
                <ArrowRight size={14} style={{ opacity: 0.5 }} />
              </a>
              <a
                href="#about"
                className={`mobile-drawer-link ${activeSection === 'about' ? 'active' : ''}`}
                onClick={(e) => scrollToSection(e, 'about')}
              >
                <span>About Project</span>
                <ArrowRight size={14} style={{ opacity: 0.5 }} />
              </a>
            </div>

            <div className="mobile-drawer-footer">
              <div className="mobile-drawer-footer-row">
                <span>Interface Theme</span>
                <ThemeToggle />
              </div>
              <Link
                to="/inspector"
                className="btn-pill-accent"
                style={{ justifyContent: 'center', width: '100%', padding: '13px 20px', fontSize: '14.5px' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Open 3D Inspector Workspace</span>
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================
          Section 1 & 2: Top Dark Hero Section (With Integrated Header)
          Directly matching Image 2 composition & layout
          =================================================================== */}
      <div className="reference-hero-container" ref={previewContainerRef}>
        {/* Hero Content Area */}
        <div className="reference-hero-content">
          <div>


            <h1 className="reference-hero-headline">
              <DrThreeDLogo size={96} marginTop={-12} scale={1.5} showWordmark={false} />Next-Gen<br />
              Inspection Platform for<br />
              3D Environments.
            </h1>
          </div>

          <div className="reference-hero-bottom">
            <div className="hero-bottom-tags">
              <span>+ Ingest</span>
              <span>+ Inspect</span>
              <span>+ Traverse</span>
            </div>

            <div className="hero-bottom-right">
              <p className="hero-bottom-right-text">
                Browser-native environment inspection, physics collider generation, and terrain traversal powered by WebGL 2.0 and Rapier 3D WebAssembly.
              </p>

              <div className="hero-bottom-actions">
                <Link to="/inspector" className="btn-pill-accent">
                  <span>Launch Inspector</span>
                  <ArrowUpRight size={15} />
                </Link>

                <a href="#about" className="btn-pill-outline">
                  <span>Explore Features</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {webGLError && (
          <div style={{ position: 'absolute', bottom: '16px', left: '54px', zIndex: 20, color: '#f87171', fontSize: '12px' }}>
            {webGLError}
          </div>
        )}
      </div>

      {/* ===================================================================
          Section 3: Slim Supporting Partner/Tech Strip (White Background)
          =================================================================== */}
      <section className="reference-strip-section" id="platform">
        <div className="reference-strip-inner">
          <div className="strip-left-label">
            <Sparkles size={16} className="strip-star-icon" />
            <span>ENGINEERED ON WEBGL 2.0 AND RAPIER 3D WEBASSEMBLY.</span>
          </div>

          <div className="strip-logos">
            <span className="strip-logo-text">THREE.JS r186</span>
            <span className="strip-logo-text">RAPIER 3D WASM</span>
            <span className="strip-logo-text">KHRONOS glTF 2.0</span>
            <span className="strip-logo-text">RADIANCE RGBE HDR</span>
            <span className="strip-logo-text">DRACO COMPRESSION</span>
          </div>
        </div>
      </section>

      {/* ===================================================================
          Section 4: Large Editorial Introduction (White Background)
          =================================================================== */}
      <section className="reference-intro-section">
        <div className="reference-intro-inner">
          <div className="reference-tag-label" style={{ color: '#64748b' }}>
            <span className="tag-square-icon" />
            <span>WHAT IS DRTHREED</span>
          </div>

          <h2 className="reference-intro-headline">
            We replace heavyweight desktop 3D tooling with an instantaneous, browser-native inspection workspace for artists, engineers, and environment designers.{' '}
            <span className="highlight-muted">
              Inspect geometry, verify real-world scale, configure dynamic physics colliders, and traverse 3D terrain with zero software installs.
            </span>
          </h2>

          <div className="reference-intro-side">
            <a href="#about" className="reference-about-link">
              <span>About DrThreeD</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ===================================================================
          Section 5: Horizontal Image Gallery (4 Tall Rounded Cards)
          =================================================================== */}
      <section className="reference-gallery-section">
        <div className="reference-gallery-inner">
          <ShowcaseGallery4 />
        </div>
      </section>

      {/* ===================================================================
          Section 6: By The Numbers (4-Column Typographic Layout with Dashed Lines)
          =================================================================== */}
      <section className="reference-numbers-section">
        <div className="reference-numbers-inner">
          <div className="reference-tag-label" style={{ color: '#64748b' }}>
            <span className="tag-square-icon" />
            <span>BY THE NUMBERS</span>
          </div>

          <div className="reference-numbers-grid">
            <div className="reference-number-col">
              <div className="reference-big-stat">0ms</div>
              <div className="reference-dashed-divider" />
              <div className="reference-stat-title">Server Latency</div>
              <div className="reference-stat-desc">
                100% in-browser WebGL and WebAssembly execution. 3D models are parsed and processed locally with zero network delays.
              </div>
            </div>

            <div className="reference-number-col">
              <div className="reference-big-stat">60+</div>
              <div className="reference-dashed-divider" />
              <div className="reference-stat-title">Target Viewport FPS</div>
              <div className="reference-stat-desc">
                Optimized Three.js rendering pipeline with frustum culling, efficient draw calls, and smooth kinematic physics ticks.
              </div>
            </div>

            <div className="reference-number-col">
              <div className="reference-big-stat">100%</div>
              <div className="reference-dashed-divider" />
              <div className="reference-stat-title">Local & Private</div>
              <div className="reference-stat-desc">
                Proprietary 3D assets, architectural blueprints, and engineering files never touch an external server or cloud bucket.
              </div>
            </div>

            <div className="reference-number-col">
              <div className="reference-big-stat">2.0</div>
              <div className="reference-dashed-divider" />
              <div className="reference-stat-title">Standard Compliance</div>
              <div className="reference-stat-desc">
                Native support for Khronos glTF 2.0 and GLB binary containers, with Draco mesh compression and RGBE 32-bit Radiance HDR.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          Section 7: Core Capabilities Section (Light Editorial Aesthetic)
          =================================================================== */}
      <section className="reference-capabilities-section" id="capabilities">
        <div className="reference-capabilities-inner">
          <div className="reference-tag-label" style={{ color: '#64748b' }}>
            <span className="tag-square-icon" />
            <span>CORE CAPABILITIES</span>
          </div>

          <div className="reference-services-head">
            <h2 className="reference-services-title">
              Our
              <div className="services-badge-icon">
                 <DrThreeDLogo size={96} showWordmark={false} />
              </div>
              Capabilities
            </h2>
            <p className="reference-services-desc">
              Everything you need to inspect, calibrate, and navigate complex 3D environments without launching Blender or desktop software.
            </p>
          </div>

          <div className="reference-capabilities-grid">
            <div className="reference-capability-card">
              <div className="capability-card-top">
                <span className="capability-card-tag">01 // HIERARCHY</span>
                <h3 className="capability-card-title">Scene Graph & Node Inventory</h3>
                <div className="capability-card-divider" />
                <p className="capability-card-desc">
                  Deeply inspect object hierarchies, bounding dimensions, vertex counts, and material properties across all scene groups.
                </p>
              </div>
              <div className="capability-card-bottom">
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Interactive Tree</span>
                <div className="service-plus-btn">+</div>
              </div>
            </div>

            <div className="reference-capability-card">
              <div className="capability-card-top">
                <span className="capability-card-tag">02 // PHYSICS</span>
                <h3 className="capability-card-title">Rapier 3D Kinematic Colliders</h3>
                <div className="capability-card-divider" />
                <p className="capability-card-desc">
                  Automatically construct exact bounding box or trimesh colliders with configurable safety buffers (+0.25m, +0.5m, +1.0m).
                </p>
              </div>
              <div className="capability-card-bottom">
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>WASM Simulation</span>
                <div className="service-plus-btn">+</div>
              </div>
            </div>

            <div className="reference-capability-card">
              <div className="capability-card-top">
                <span className="capability-card-tag">03 // NAVIGATION</span>
                <h3 className="capability-card-title">Dual-Mode Locomotion</h3>
                <div className="capability-card-divider" />
                <p className="capability-card-desc">
                  Switch instantly between orbital inspection, 6DOF free-flight, and first-person WASD traversal with 42° slope autostepping.
                </p>
              </div>
              <div className="capability-card-bottom">
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Orbit / Fly / FPS</span>
                <div className="service-plus-btn">+</div>
              </div>
            </div>

            <div className="reference-capability-card">
              <div className="capability-card-top">
                <span className="capability-card-tag">04 // LIGHTING</span>
                <h3 className="capability-card-title">Radiance HDRI Environment</h3>
                <div className="capability-card-divider" />
                <p className="capability-card-desc">
                  Configure 32-bit Radiance (.hdr) skyboxes, solar altitude, azimuth angles, and ambient exposure in real time.
                </p>
              </div>
              <div className="capability-card-bottom">
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>RGBE / PMREM</span>
                <div className="service-plus-btn">+</div>
              </div>
            </div>

            <div className="reference-capability-card">
              <div className="capability-card-top">
                <span className="capability-card-tag">05 // SPAWN POINT</span>
                <h3 className="capability-card-title">Safe Surface Ground Snapping</h3>
                <div className="capability-card-divider" />
                <p className="capability-card-desc">
                  Place spawn waypoints directly on any selected node or let physics raycasts automatically calculate safe landing elevation.
                </p>
              </div>
              <div className="capability-card-bottom">
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>3D Beacon Marker</span>
                <div className="service-plus-btn">+</div>
              </div>
            </div>

            <div className="reference-capability-card">
              <div className="capability-card-top">
                <span className="capability-card-tag">06 // COMFORT</span>
                <h3 className="capability-card-title">Accessibility & Comfort</h3>
                <div className="capability-card-divider" />
                <p className="capability-card-desc">
                  Velocity-driven head bobbing and idle breathing with unrolled stable horizon, plus instant Reduced Motion accessibility mode.
                </p>
              </div>
              <div className="capability-card-bottom">
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Customizable FOV</span>
                <div className="service-plus-btn">+</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          Section 8: Technical Requirements & Blender Workflow
          =================================================================== */}
      <section className="reference-blender-section" id="blender">
        <div className="reference-blender-inner">
          <div className="reference-tag-label" style={{ color: '#64748b' }}>
            <span className="tag-square-icon" />
            <span>BLENDER WORKFLOW MANUAL</span>
          </div>

          <h2 className="reference-intro-headline" style={{ marginTop: '16px' }}>
            Standardized conventions for zero-friction 3D export.{' '}
            <span className="highlight-muted">
              Ensure real-world scale, automatic object classification, and accurate coordinate alignment before exporting.
            </span>
          </h2>

          <div className="reference-blender-grid">
            <div className="reference-blender-card">
              <div className="blender-card-head">
                <Terminal size={20} color="#0284c7" />
                <h3 className="blender-card-title">Blender Export Recommendations</h3>
              </div>
              <div className="capability-card-divider" />
              <p className="blender-card-text">
                Follow these standard conventions in Blender for accurate real-world scale and collision fidelity:
              </p>
              <ul style={{ paddingLeft: '20px', color: '#64748b', fontSize: '13.5px', lineHeight: 1.85 }}>
                <li><strong>Unit Scale:</strong> Metric, Length = Meters (1 Blender Unit = 1.0 Meter).</li>
                <li><strong>Apply Transforms:</strong> Select objects and press <code style={{ color: '#0284c7', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Ctrl+A &gt; Apply All Transforms</code> so object scales are 1.0.</li>
                <li><strong>Naming Heuristics:</strong> Use prefixes like <code style={{ color: '#0284c7', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Terrain_</code>, <code style={{ color: '#0284c7', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Hab_</code>, <code style={{ color: '#0284c7', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Wall_</code>, <code style={{ color: '#0284c7', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Console_</code> for instant automatic categorization.</li>
                <li><strong>Format:</strong> In Blender: <em>File &gt; Export &gt; glTF 2.0 (.glb/.gltf)</em>, Format = <strong>glTF Binary (.glb)</strong>.</li>
              </ul>
            </div>

            <div className="reference-blender-card">
              <div className="blender-card-head">
                <FileCode size={20} color="#059669" />
                <h3 className="blender-card-title">Coordinate System Alignment</h3>
              </div>
              <div className="capability-card-divider" />
              <p className="blender-card-text">
                Three.js and Rapier 3D utilize a right-handed coordinate system with +Y pointing Upwards:
              </p>
              <div className="code-box-minimal-light">
                +Y : Elevation / Height (Upwards)<br />
                +X : East / Right<br />
                +Z : South / Backward (-Z is North / Forward)
              </div>
              <p className="blender-card-text">
                Standard Blender glTF export automatically transforms Blender's +Z Up into Three.js +Y Up. Single-file self-contained <strong>.glb</strong> is recommended for bundled textures and materials.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          Section 9: About Project Section (Light Editorial Aesthetic)
          =================================================================== */}
      <section className="reference-about-section" id="about">
        <div className="reference-about-inner">
          <div className="reference-tag-label" style={{ color: '#64748b' }}>
            <span className="tag-square-icon" />
            <span>ABOUT THE PROJECT</span>
          </div>

          <h2 className="reference-intro-headline" style={{ marginTop: '16px' }}>
            Engineered for browser-native 3D spatial computing.<DrThreeDLogo size={96} showWordmark={false} />
            <span className="highlight-muted">
              {ABOUT_CONTENT.projectMission}
            </span>
          </h2>

          <div className="reference-about-grid">
            <div className="reference-about-card">
              <h3 className="about-card-title">Client-Side Architecture & Privacy</h3>
              <div className="capability-card-divider" />
              <p className="about-card-text">
                DrThreeD processes, renders, and simulates 3D environments completely within your browser via WebGL 2.0 and WebAssembly.
                Your proprietary 3D models, architectural blueprints, and engineering files never touch an external server or cloud bucket.
              </p>
              <div className="about-badges-row">
                <span className="about-badge-item">● 100% Client-Side Private</span>
                <span className="about-badge-item">● Three.js r186 WebGL 2.0</span>
                <span className="about-badge-item">● Rapier 3D WASM</span>
                <span className="about-badge-item">● Khronos glTF 2.0 / GLB</span>
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* ===================================================================
          Section 10: Closing CTA
          =================================================================== */}
      <section className="reference-closing-section">
        <div className="reference-closing-inner">
          <div className="reference-tag-label" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span className="tag-square-icon" />
            <span>INTERACTIVE WORKSPACE</span>
          </div>

          <h2 className="reference-closing-title">
            Ready to inspect your 3D environment?
          </h2>

          <p className="reference-closing-desc">
            Bring your supported 3D models into an interactive workspace built for inspection, physics verification, and real-time environment traversal.
          </p>

          <Link to="/inspector" className="btn-pill-accent" style={{ padding: '14px 34px', fontSize: '15px' }}>
            <span>Open Inspector Workspace</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ===================================================================
          Section 11: Minimal Footer
          =================================================================== */}
      <footer className="reference-footer">
        <div className="reference-footer-inner">
          <Link to="/" style={{ textDecoration: 'none' }} onClick={(e) => scrollToSection(e, 'home')}>
            <DrThreeDLogo size={30} showWordmark={true} />
          </Link>

          <div className="reference-footer-links">
            <a href="#platform">Platform</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#blender">Blender Guide</a>
            <a href="#about">About</a>
            <Link to="/inspector" style={{ color: '#00f0ff', fontWeight: 600 }}>
              Launch Inspector ↗
            </Link>
          </div>

          <div style={{ color: '#64748b', fontSize: '12px' }}>
            Meet the Dev : <a href="https://osandahirushaka.tech" target="_blank" rel="noreferrer" style={{ color: '#00f0ff', fontWeight: 600 }}>
              Osanda Hirushaka
            </a>  
          </div>
        </div>
      </footer>
    </div>
  );
};
