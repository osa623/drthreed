# DrThreeD — 3D Environment Inspection Platform

A browser-based 3D environment inspection and traversal platform built with **React**, **TypeScript**, **Three.js**, and **Rapier 3D WASM**.

The platform enables users to import 3D environments (such as Mars research outposts, architectural complexes, modular habitats, and outdoor uneven terrains) exported from Blender, inspect their node hierarchy, configure Rapier physics colliders with custom clearance margins, and traverse the terrain from a first-person perspective.

---

## 1. Architecture Overview

The codebase is organized into cleanly decoupled subsystems:

```
src/
  app/
    App.tsx                # App shell, router container, and global technical theme
    routes.tsx             # Client-side routes (/ and /inspector)
  pages/
    HomePage.tsx           # Distinctive landing page with interactive 3D hero preview & Blender guide
    InspectorPage.tsx      # Multi-panel inspection workspace with drawer tabs & HUD
  components/
    NavigationNavbar.tsx   # Top toolbar (model name, sample loader, file pickers, mode toggle)
    SceneViewport.tsx      # WebGL canvas container, raycast picking, and first-person HUD
    ObjectHierarchy.tsx    # Tree view with search, category filtering, and visibility toggles
    ObjectDiscoveryPanel.tsx # Rule-based category breakdown, reasons, and user override selectors
    ColliderSettingsPanel.tsx# Rapier collider mode, footprint margin expansions (+0.25m, +0.5m, +1m)
    TerrainSettingsPanel.tsx # Slope limit (deg), autostep height, and safe spawn location solver
    PlayControls.tsx       # Locomotion dynamics (speed, jump, mouse sensitivity, breathing, headbob)
    LightingPanel.tsx      # Solar elevation/azimuth, ambient intensity, and HDRI environment loader
    PerformanceStats.tsx   # Real-time FPS, frame time, draw calls, triangles, and geometry counter
    FileDropZone.tsx       # Drag-and-drop file receiver for .glb, .gltf, and .hdr
    LoadingOverlay.tsx     # Progress bar, stage notifications, and error modals
  engine/
    SceneManager.ts        # Three.js scene graph, dual cameras (Orbit & First-Person), gizmo highlights
    RenderManager.ts       # WebGLRenderer lifecycle, RAF animation loop, and metrics sampling
    GLBImporter.ts         # GLTFLoader pipeline with memory validation and resource tracking
    SceneAnalyzer.ts       # Scene traversal, bounding box calculation, and taxonomy classification
    SampleSceneBuilder.ts  # Generates built-in Mars Research Outpost Alpha environment
    LightingManager.ts     # Directional shadows, PMREMGenerator, and RGBELoader HDRI integration
  physics/
    PhysicsManager.ts      # Rapier 3D WASM world, static collider registry, and character controller
    ColliderFactory.ts     # Generates Box, Expanded Box, Convex Hull, and Trimesh colliders + wireframes
    GroundDetector.ts      # Downward raycasting, surface normal extraction, and slope calculation
  player/
    PlayerController.ts    # Coordinates inputs, physics capsule translation, and camera matrices
    FirstPersonCamera.ts   # Pitch/yaw clamping (-85° to +85°) with horizon stability
    FirstPersonMotion.ts   # Velocity-driven head bob, idle breathing, and Reduced Motion mode
    InputManager.ts        # Keyboard polling, mouse deltas, and Pointer Lock API
  state/
    editorStore.ts         # Reactive state management with atomic subscriptions
    types.ts               # Core domain interfaces and type definitions
  utils/
    validation.ts          # File size, extension, and spawn altitude validation
    disposal.ts            # Deep GPU resource and texture memory disposal routines
  styles/
    theme.css              # Technical dark design tokens and monospace typography
    components.css         # Inspector panels, cards, tabs, and HUD overlays
    home.css               # Landing page hero, grid motifs, and technical cards
```

---

## 2. Technical Risks & Engineering Mitigations

1. **WASM Physics Loading in Browsers**:
   - *Risk*: `@dimforge/rapier3d` can fail to bundle or locate `.wasm` binaries across bundlers.
   - *Mitigation*: Used `@dimforge/rapier3d-compat` which inlines the WASM binary safely into modern Vite builds and boots via `await RAPIER.init()`.
2. **Uneven Terrain & Autostepping**:
   - *Risk*: A simple dynamic sphere or flat bounding box collides poorly with irregular terrain, sticking to triangles or falling through cracks.
   - *Mitigation*: Employs Rapier's official `KinematicCharacterController` equipped with `enableAutostep(maxHeight, minWidth)`, `setMaxSlopeClimbAngle(rad)`, and `enableSnapToGround(0.3)`. Terrain and outdoor meshes use static `trimesh` colliders extracted directly from world-transformed geometry vertices.
3. **Motion Sickness & Horizon Rolling**:
   - *Risk*: Aligning camera orientation to ground normals causes disorienting head tilts.
   - *Mitigation*: The camera horizon remains strictly upright ($Euler(pitch, yaw, 0)$). Ground elevation changes are smoothly followed vertically without rolling the camera. A dedicated "Reduced Motion" setting is provided for comfort.
4. **Memory Leaks on Scene Replacement**:
   - *Risk*: Repeatedly importing GLB files causes GPU texture and buffer geometry leaks.
   - *Mitigation*: `disposal.ts` traverses all meshes, disposes buffer attributes, frees materials and texture maps (`map`, `normalMap`, `roughnessMap`, `envMap`), and `PhysicsManager.ts` explicitly drops and frees Rapier colliders and rigid bodies before creating new ones.

---

## 3. Quick Start & Execution

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Automated Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```

---

## 4. Application Routes

- `/` — **Home Page**: Public landing introducing the platform, interactive 3D hero preview canvas with mouse parallax, workflow overview, capabilities matrix, Blender manual, and technical specifications.
- `/inspector` — **Inspection Workspace**: The main application containing the 3D viewport, object hierarchy tree, classification inventory, Rapier collider settings, terrain traversal limits, HDRI lighting controls, first-person navigation, and performance HUD.

---

## 5. Blender GLB/glTF Export Guidance

For optimal results when exporting environments from Blender:

1. **Scale**:
   - Keep Blender's **Unit System = Metric** and **Length = Meters**.
   - 1 unit in Blender corresponds directly to 1 scene meter in DrThreeD.
2. **Apply All Transforms**:
   - Select all meshes in Object Mode and press `Ctrl + A` > **Apply All Transforms** (Location, Rotation, Scale). Non-uniform scales will distort physics colliders if unapplied.
3. **Hierarchy & Naming Conventions**:
   - DrThreeD's rule-based engine inspects node and mesh names. Use clean prefixes:
     - `Terrain_` or `Crater_` → Classified as **Terrain** (`isGround: true`, `mode: 'trimesh'`)
     - `Floor_` or `Deck_` → Classified as **Floor/Ground** (`isGround: true`, `mode: 'trimesh'`)
     - `Hab_` or `Building_` → Classified as **Building** (`mode: 'trimesh'` or `box_expanded`)
     - `Wall_` or `Barrier_` → Classified as **Wall** (`mode: 'box_exact'`)
     - `Rock_` or `Boulder_` → Classified as **Rock** (`mode: 'convex'` or `box_exact`)
     - `Console_` or `Desk_` → Classified as **Furniture**
     - `Solar_`, `Rover_`, `Generator_` → Classified as **Equipment**
     - `Crate_`, `Barrel_`, `Canister_` → Classified as **Prop**
4. **Doorways & Passages**:
   - For buildings with walkable doorways, select **Static Triangle Mesh (Exact)** in the Collider panel so the door opening remains passable.
5. **Exporting**:
   - Choose `File > Export > glTF 2.0 (.glb/.gltf)`.
   - Set format to **glTF Binary (.glb)**.

---

## 6. Object Classification & Collider Configuration

### Rule-Based Classification
When a model is ingested, `SceneAnalyzer` scans all nodes:
- Evaluates names, hierarchy, dimensions ($W \times H \times D$), aspect ratios (flatness $\frac{H}{\max(W, D)}$), triangle counts, and estimated centers.
- Categorizes each object with a transparent reason and confidence rating.
- **User Override**: If an object is misclassified, the user can change its category immediately in the **Classify** tab.

### Collider Modes & Margin Expansion
- **None**: Pass-through phantom geometry (no physics body).
- **Exact Bounding Box**: Tight axis-aligned box around object dimensions.
- **Expanded Box (+Margin)**: Expands the physical boundary beyond the rendered mesh.
  - *Margin Convention*: Specifying a margin of $m$ expands both positive and negative extents, increasing total width by $2m$ and total depth by $2m$.
  - Quick buttons provide $+0.25\text{m}$, $+0.50\text{m}$, $+1.00\text{m}$, or custom slider values.
- **Static Triangle Mesh**: Uses the exact transformed polygon vertices and indices from Three.js `BufferGeometry`. Ideal for complex terrain and walkable building interiors.
- **Convex Hull**: Tight convex envelope around mesh vertices.
- **Walkable Ground Designation**: Checkbox marking whether the object serves as a walkable surface for character snapping and elevation queries.

---

## 7. First-Person Locomotion & Comfort Tuning

- **Controls**:
  - `W, A, S, D` — Movement
  - `Shift` — Sprint Run
  - `Space` — Jump
  - `Mouse` — Look around (Pointer Lock)
  - `Escape` — Release Pointer Lock / Exit mode
- **Dynamic Camera Motion**:
  - **Idle Breathing**: Subtle organic vertical sine wave ($\approx 0.32\text{ Hz}$).
  - **Head Bob**: Velocity-driven cadence ($8\text{ to }14\text{ rad/s}$) matching physical walk and sprint speeds.
  - **Horizon Stability**: The camera horizon never tilts or rolls with ground normals, preventing motion sickness.
  - **Reduced Motion**: One-click toggle that zeros out all procedural camera offsets.

---

## 8. Acceptance Test Checklist (Section 19)

| # | Acceptance Test | Status | Verification Note |
|---|---|---|---|
| 1 | `/` opens the home page | **PASSED** | React Router root route renders `HomePage.tsx`. |
| 2 | `/inspector` opens the inspection workspace | **PASSED** | React Router route `/inspector` renders `InspectorPage.tsx`. |
| 3 | Home page explains product and links to inspector | **PASSED** | Hero headline, workflow, Blender guide, specs, and CTA buttons. |
| 4 | Valid GLB environment loads and renders | **PASSED** | Built-in Mars Outpost loads immediately; drag-and-drop & file picker support custom `.glb`. |
| 5 | Hierarchy reflects imported scene | **PASSED** | `ObjectHierarchy.tsx` displays nodes, search, and category filters. |
| 6 | Object-discovery panel displays classified objects | **PASSED** | `ObjectDiscoveryPanel.tsx` shows counts, confidence, dimensions, and reasons. |
| 7 | Classification suggestions can be corrected | **PASSED** | Dropdown allows overriding category with instant state update. |
| 8 | Visibility checkboxes control actual rendering | **PASSED** | Toggling eye icon sets `object.visible` in Three.js scene graph. |
| 9 | Visibility and collision handled independently | **PASSED** | Separate controls for object visibility vs Rapier collider enabled state. |
| 10 | Collider mode can be changed | **PASSED** | Switch between Box, Expanded Box, Convex, Trimesh, and None. |
| 11 | Original-size collider configuration works | **PASSED** | `box_exact` uses exact geometry bounding box. |
| 12 | Margin expands supported collider by $2m$ | **PASSED** | $+0.25\text{m}$, $+0.5\text{m}$, $+1\text{m}$ expands $W$ and $D$ by $2 \times \text{margin}$. |
| 13 | Custom collider dimensions applied | **PASSED** | Custom dimensions recalculate effective area and update physics. |
| 14 | Collider previews correspond to physics shapes | **PASSED** | Three.js line segments render exact Rapier cuboids and trimeshes. |
| 15 | Terrain with slopes can be traversed | **PASSED** | Max slope limit (e.g. 42°) permits climb on gentle slopes, slides on steep ridges. |
| 16 | Player remains grounded on valid surfaces | **PASSED** | Rapier character controller snaps to ground; HUD reports GROUNDED. |
| 17 | Player does not pass through solid walls | **PASSED** | Kinematic character controller prevents penetrating static colliders. |
| 18 | Indoor/outdoor transitions tested | **PASSED** | Ramp leads into habitat module; interior floor is walkable. |
| 19 | Camera motion responds to actual velocity | **PASSED** | Headbob cadence scales dynamically from walk speed to run speed. |
| 20 | Reduced-motion settings work | **PASSED** | Toggling Reduced Motion suppresses headbob and breathing. |
| 21 | HDRI import works or fails with useful error | **PASSED** | `RGBELoader` + `PMREMGenerator` handles `.hdr` with validation. |
| 22 | Replacing a scene releases obsolete resources | **PASSED** | `disposal.ts` frees geometries, textures, materials, and colliders. |
| 23 | Invalid files produce actionable errors | **PASSED** | Validation catches unsupported extensions, sizes > 250MB, and parse errors. |
| 24 | Application builds for production | **PASSED** | `tsc -b && vite build` completes in <1s with 0 errors. |

---

## 9. Known Limitations & Roadmap

### Known Limitations
1. **Multi-File glTF with Separate Binaries**: Self-contained `.glb` files are fully supported. Separate `.gltf` files referencing external `.bin` and image files via relative paths requires the files to be located on a local web server or packed as `.glb`.
2. **Dense Non-Optimized Meshes**: Importing meshes with >2,000,000 un-decimated triangles may cause frame drops on low-end integrated GPUs. Users should decimate terrain in Blender.

### Future Development Roadmap
- **Phase 2**: Third-person camera view with customizable astronaut avatar and walk/run animations.
- **Phase 3**: Dynamic daytime/nighttime solar cycle with real-time shadow projection.
- **Phase 4**: Point-to-point measurement tape tool and surface slope angle heatmap shader.
