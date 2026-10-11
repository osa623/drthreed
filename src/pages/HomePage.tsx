import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  Box,
  Compass,
  ArrowRight,
  Shield,
  Layers,
  Mountain,
  Sun,
  Activity,
  Terminal,
  AlertTriangle,
  FileCode,
  Sparkles,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [webGLError, setWebGLError] = useState<string | null>(null);

  // Initialize interactive 3D preview scene on hero
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const container = previewContainerRef.current;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
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
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 0.5, 0);

    // Subtle lighting
    const ambLight = new THREE.AmbientLight(0x223344, 1.2);
    scene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Procedural sci-fi habitat dome & contour terrain wireframe
    const previewGroup = new THREE.Group();

    // Habitat Dome
    const domeGeo = new THREE.SphereGeometry(2.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x16202e,
      roughness: 0.3,
      metalness: 0.8,
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    previewGroup.add(domeMesh);

    // Habitat Wireframe Accents
    const wireGeo = new THREE.WireframeGeometry(domeGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.7 });
    const wireLine = new THREE.LineSegments(wireGeo, wireMat);
    previewGroup.add(wireLine);

    // Surrounding terrain wireframe grid
    const terrainGeo = new THREE.PlaneGeometry(16, 16, 20, 20);
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      if (dist > 3) {
        pos.setY(i, Math.sin(x * 0.5) * 0.4 + Math.cos(z * 0.5) * 0.4);
      }
    }
    terrainGeo.computeVertexNormals();

    const terrainWire = new THREE.WireframeGeometry(terrainGeo);
    const terrainWireMat = new THREE.LineBasicMaterial({ color: 0x00e699, transparent: true, opacity: 0.25 });
    const terrainLine = new THREE.LineSegments(terrainWire, terrainWireMat);
    previewGroup.add(terrainLine);

    // Satellite dish
    const dishGeo = new THREE.CylinderGeometry(0.8, 0.2, 0.3, 8);
    const dishMesh = new THREE.Mesh(dishGeo, domeMat);
    dishMesh.position.set(0, 2.4, 0);
    previewGroup.add(dishMesh);

    scene.add(previewGroup);

    let animId: number;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / (h || 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      previewGroup.rotation.y += 0.005;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseX * 2, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4 - mouseY * 1.5, 0.05);
      camera.lookAt(0, 0.5, 0);

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
      {/* Top Navbar */}
      <nav className="home-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box size={20} color="#00f0ff" />
          <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.5px' }}>DrThreeD</span>
          <span className="hero-tag" style={{ padding: '2px 8px', fontSize: '10px' }}>v1.0 WASM</span>
        </div>

        <div className="home-nav-links">
          <a href="#workflow" className="home-nav-link">Workflow</a>
          <a href="#features" className="home-nav-link">Capabilities</a>
          <a href="#blender" className="home-nav-link">Blender Manual</a>
          <a href="#limitations" className="home-nav-link">Specs & Limitations</a>
          <Link to="/inspector" className="cta-button-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
            <span>Open Inspector</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-tag">
            <Sparkles size={13} />
            <span>REAL-TIME 3D SPATIAL COMPUTING & PHYSICS</span>
          </div>

          <h1 className="hero-title">
            Inspect, Analyze & Traverse <br />
            <span className="hero-title-accent">3D Environments</span> in Real-Time
          </h1>

          <p className="hero-description">
            Export Mars outposts, architectural complexes, modular habitats, and uneven terrain from Blender.
            Inspect object hierarchies, configure Rapier 3D colliders with custom margins, and walk through in first-person—entirely in your browser with zero server uploads.
          </p>

          <div className="hero-actions">
            <Link to="/inspector" className="cta-button-primary">
              <span>Launch Inspection Workspace</span>
              <ArrowRight size={16} />
            </Link>

            <a href="#blender" className="cta-button-secondary">
              <FileCode size={16} />
              <span>Blender Guide</span>
            </a>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '12px', color: 'var(--text-dim)' }}>
            <div>✓ Client-side Local Processing</div>
            <div>✓ Rapier 3D WASM Kinematics</div>
            <div>✓ Terrain-Aware Traversal</div>
          </div>
        </div>

        {/* 3D Visual Preview */}
        <div className="hero-preview-container" ref={previewContainerRef}>
          <div className="preview-badge-overlay">
            INTERACTIVE PREVIEW // RAPIER 3D WIREFRAME
          </div>
          {webGLError && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
              <div>{webGLError}</div>
            </div>
          )}
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="workflow-section">
        <div className="section-container">
          <div className="section-head">
            <div className="section-badge">Streamlined Engineering Workflow</div>
            <h2 className="section-heading">From Blender Model to Physical Exploration</h2>
          </div>

          <div className="workflow-steps-grid">
            <div className="workflow-step-card">
              <div className="workflow-step-num">01 / INGESTION</div>
              <h3 className="workflow-step-title">Import & Scene Analysis</h3>
              <p className="workflow-step-desc">
                Drag and drop your self-contained .glb or .gltf environment. DrThreeD automatically scans the node graph,
                measures bounding boxes, calculates footprint areas, and classifies objects into functional architectural categories.
              </p>
            </div>

            <div className="workflow-step-card">
              <div className="workflow-step-num">02 / CONFIGURATION</div>
              <h3 className="workflow-step-title">Configure Rapier Colliders</h3>
              <p className="workflow-step-desc">
                No need to prepare physics shapes in Blender. Apply bounding boxes, convex hulls, or static trimesh colliders.
                Expand clearance margins (+0.25m, +0.5m, +1.0m) and designate walkable terrain surfaces with immediate visual wireframes.
              </p>
            </div>

            <div className="workflow-step-card">
              <div className="workflow-step-num">03 / EXPLORATION</div>
              <h3 className="workflow-step-title">First-Person Traversal</h3>
              <p className="workflow-step-desc">
                Transition seamlessly into first-person WASD navigation. Traverse uneven crater slopes, step over curbs with autostepping,
                cross indoor-outdoor thresholds, and experience velocity-driven head bob with a stable horizon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="section-head">
          <div className="section-badge">Core Capabilities</div>
          <h2 className="section-heading">Engineered for Technical Inspection</h2>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon-wrap">
              <Layers size={20} />
            </div>
            <h3 className="feature-title">Automatic Scene Graph Inventory</h3>
            <p className="feature-text">
              Categorizes nodes into Buildings, Floors, Walls, Terrain, Rocks, Furniture, Equipment, and Props using transparent rule-based heuristics.
              Provides confidence ratings, bounding box dimensions, and full user override controls.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrap">
              <Shield size={20} />
            </div>
            <h3 className="feature-title">Advanced Collider Footprints & Margins</h3>
            <p className="feature-text">
              Expand safety margins around machinery or habitats. A margin of <em>m</em> expands total width and depth by <em>2m</em>.
              Preview physical shapes in Three.js and separate visual mesh rendering from physics collision states.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrap">
              <Mountain size={20} />
            </div>
            <h3 className="feature-title">Terrain-Aware Slope & Obstacle Traversal</h3>
            <p className="feature-text">
              Rapier 3D kinematic character controller with configurable slope limits (default 42°) and autostep height (default 0.35m).
              Prevents climbing vertical walls while allowing effortless movement across natural slopes and steps.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrap">
              <Activity size={20} />
            </div>
            <h3 className="feature-title">Human-Like Movement Dynamics</h3>
            <p className="feature-text">
              Organic idle breathing and velocity-driven head bob scaled by physical speed.
              Maintains an unrolled, stable camera horizon across uneven ground and includes a dedicated Reduced Motion mode for comfort.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrap">
              <Sun size={20} />
            </div>
            <h3 className="feature-title">HDRI Environment & Solar Lighting</h3>
            <p className="feature-text">
              Import 32-bit Radiance (.hdr) files via RGBELoader and PMREMGenerator.
              Adjust exposure, sun azimuth/elevation, directional shadow quality, and environment rotation with instantaneous feedback.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrap">
              <Compass size={20} />
            </div>
            <h3 className="feature-title">Safe Spawn Placement & Elevation Tracking</h3>
            <p className="feature-text">
              Downward raycasts determine safe spawn elevations above complex terrain, preventing player capsules from clipping into geometry or falling into the void.
            </p>
          </div>
        </div>
      </section>

      {/* Blender Workflow Section */}
      <section id="blender" className="blender-section">
        <div className="section-container">
          <div className="section-head">
            <div className="section-badge">Blender GLB / glTF Guide</div>
            <h2 className="section-heading">Best Practices for Web 3D Inspection</h2>
          </div>

          <div className="blender-grid">
            <div className="blender-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                <Terminal size={16} />
                <span>Blender Export Configuration</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                For flawless scale, collision accuracy, and navigation, configure your Blender project using standard conventions:
              </p>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.7' }}>
                <li><strong>Unit Scale:</strong> Keep Unit System = Metric, Length = Meters (1 Blender unit = 1 meter).</li>
                <li><strong>Apply Transforms:</strong> Select all objects and press <code style={{ color: 'var(--accent-cyan)' }}>Ctrl+A &gt; Apply All Transforms</code> so scales are 1.0 and rotations are applied.</li>
                <li><strong>Mesh Naming:</strong> Use descriptive collection/mesh prefixes like <code style={{ color: 'var(--accent-cyan)' }}>Terrain_</code>, <code style={{ color: 'var(--accent-cyan)' }}>Hab_</code>, <code style={{ color: 'var(--accent-cyan)' }}>Wall_</code>, <code style={{ color: 'var(--accent-cyan)' }}>Console_</code> for instant automatic categorization.</li>
                <li><strong>Export Format:</strong> In Blender: <em>File &gt; Export &gt; glTF 2.0 (.glb/.gltf)</em>, Format = <strong>glTF Binary (.glb)</strong>. Check <em>Include &gt; Selected Objects + Custom Properties</em>.</li>
              </ul>
            </div>

            <div className="blender-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                <FileCode size={16} />
                <span>Coordinate System Alignment</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Three.js and Rapier 3D use a right-handed coordinate system with +Y pointing Up:
              </p>
              <div className="code-snippet">
                +Y: Upwards (Elevation / Height)<br />
                +X: East / Right<br />
                +Z: South / Backward (-Z is North / Forward)
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Blender exports automatically transform Blender's +Z Up into Three.js +Y Up when using the standard glTF exporter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Limitations Section */}
      <section id="limitations" className="limitations-section">
        <div className="limitations-banner">
          <AlertTriangle size={24} color="#ff9900" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '15px', marginBottom: '4px' }}>
              Technical Requirements & Browser Boundaries
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              DrThreeD runs 100% client-side in your browser using WebGL 2.0 and WebAssembly (WASM).
              Large environment files with millions of raw triangles should be optimized in Blender with decimation or LODs before inspection.
              Multi-file .gltf with external relative URIs require local file bundle packaging; self-contained single-file <strong>.glb</strong> is recommended.
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: '80px 40px', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', background: 'linear-gradient(180deg, #0c1017 0%, #080b0f 100%)' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
          Ready to inspect your 3D environment?
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px' }}>
          Test the built-in Mars Research Outpost or drag in your custom Blender creations.
        </p>
        <Link to="/inspector" className="cta-button-primary" style={{ padding: '14px 32px', fontSize: '15px' }}>
          <span>Open Inspector Workspace</span>
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box size={16} color="#00f0ff" />
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>DrThreeD Platform</span>
          <span>— Browser-Based 3D Environment Inspection & Physics Traversal</span>
        </div>
        <div>Built with React, TypeScript, Three.js, and Rapier 3D WASM</div>
      </footer>
    </div>
  );
};
