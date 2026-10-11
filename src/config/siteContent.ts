/**
 * DrThreeD Centralized Site Content & Brand Configuration
 * 
 * You can easily update your project details, developer information,
 * documentation links, and social links here without altering core application logic.
 */

export interface SiteBrandConfig {
  name: string;
  wordmark: string;
  tagline: string;
  version: string;
  releaseTag: string;
  githubUrl?: string;
  docsUrl?: string;
}

export interface AboutPlaceholderConfig {
  projectTitle: string;
  projectSubtitle: string;
  projectMission: string;
  developerName: string; // Placeholder for the user's name
  developerTitle: string; // Placeholder for developer title
  developerBio: string; // Placeholder for bio
  contactEmailPlaceholder: string;
  githubRepoUrl: string;
}

export const SITE_BRAND: SiteBrandConfig = {
  name: 'DrThreeD',
  wordmark: 'DrThreeD',
  tagline: 'Browser-Based 3D Environment Inspection & Physics Traversal Platform',
  version: '1.0.0',
  releaseTag: 'v1.0 WASM',
  githubUrl: 'https://github.com',
  docsUrl: '#blender',
};

export const ABOUT_CONTENT: AboutPlaceholderConfig = {
  projectTitle: 'Engineered for Web 3D Inspection',
  projectSubtitle: 'Bridging 3D Modeling Workflows & Browser-Native Exploration',
  projectMission:
    'DrThreeD was created to solve a persistent friction point in 3D development: the necessity of opening massive desktop digital content creation suites just to inspect node structures, test collision bounds, verify scale, or explore an architectural layout in first person. By utilizing Three.js and Rapier 3D WebAssembly, everything runs 100% locally in your browser with zero latency and complete file privacy.',
  developerName: '[Developer / Project Owner Name]',
  developerTitle: '[Role / Specialization — e.g. 3D Systems & Graphics Engineer]',
  developerBio:
    '[Placeholder: Add your bio, studio information, research focus, or personal background here. This section is centrally managed in src/config/siteContent.ts for effortless customization.]',
  contactEmailPlaceholder: '[contact@example.com]',
  githubRepoUrl: 'https://github.com',
};

export const SHOWCASE_ENVIRONMENTS = [
  {
    id: 'terrain-exploration',
    category: 'Terrain Exploration',
    tag: 'Topography & Slopes',
    title: 'Martian Crater Basin & Mountain Ridge',
    description:
      'Inspect stepped elevation changes, calculate slope gradient angles (up to 42°), and verify collision mesh contacts across uneven natural ground.',
    accentColor: '#00e699',
    badge: 'RAP-TRI-01',
    stats: 'Max Slope: 42° · Dynamic Autostep',
  },
  {
    id: 'architectural-inspection',
    category: 'Architectural Inspection',
    tag: 'BIM & Structures',
    title: 'Modular Habitation Dome & Airlock Complex',
    description:
      'Analyze spatial volumes, doorway thresholds, ceiling clearances, and verify interior room footprints without desktop software.',
    accentColor: '#00f0ff',
    badge: 'ARCH-GLB-02',
    stats: 'Floor Area: 412 m² · Double-Skin Shell',
  },
  {
    id: 'sample-3d-model',
    category: 'Inspection Environment',
    tag: 'Built-in Preset',
    title: 'Sample 3D Model Environment',
    description:
      'Complete modular 3D environment including communications arrays, laboratory consoles, airlocks, and spatial assets.',
    accentColor: '#ff9900',
    badge: 'SAMPLE-3D-03',
    stats: 'Built-in Preset · Rapier Trimesh Colliders',
  },
  {
    id: 'scene-hierarchy',
    category: 'Scene Hierarchy Analysis',
    tag: 'Node Graphs',
    title: 'Automatic Object Discovery & Metadata',
    description:
      'Heuristic classification categorizes nodes into Buildings, Walls, Floors, Furniture, Equipment, and Props with confidence ratings.',
    accentColor: '#a78bfa',
    badge: 'GRAPH-TREE-04',
    stats: 'Instant Inventory · User Override Support',
  },
  {
    id: 'lighting-hdri',
    category: 'Environment & Solar Lighting',
    tag: 'Radiance HDR',
    title: 'Radiance HDRI Image-Based Illumination',
    description:
      'Test materials under real-world sun azimuths, elevations, and 32-bit HDR radiance maps generated via RGBELoader and PMREM.',
    accentColor: '#38bdf8',
    badge: 'LIGHT-HDR-05',
    stats: '32-Bit Floating Point · Sun Azimuth Gizmo',
  },
  {
    id: 'physics-traversal',
    category: 'Physical Traversal',
    tag: 'WASM Kinematics',
    title: 'First-Person & Free-Fly Navigation',
    description:
      'Switch seamlessly between Orbit inspection, 6DOF free-flight, and physics-driven first-person movement with unrolled horizon stabilization.',
    accentColor: '#f43f5e',
    badge: 'WASM-PHYS-06',
    stats: 'Rapier 3D WASM · Autostep 0.35m',
  },
];
