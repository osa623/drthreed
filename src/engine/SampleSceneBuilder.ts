import * as THREE from 'three';

export class SampleSceneBuilder {
  /**
   * Builds an inspection-ready Mars Research Outpost environment.
   * Includes uneven crater terrain, slopes, research habitat, interior lab fixtures,
   * access ramps, stepped platforms, and communication arrays.
   */
  public static buildMarsOutpostScene(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'Mars_Research_Outpost_Alpha';

    // Materials
    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x9e472a, // Martian rust soil
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
    });

    const habWallMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddfec, // Composite habitat panels
      roughness: 0.35,
      metalness: 0.25,
    });

    const habInteriorFloorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748, // Non-slip technical deck
      roughness: 0.5,
      metalness: 0.6,
    });

    const metalFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.3,
      metalness: 0.8,
    });

    const consoleMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.2,
      metalness: 0.5,
    });

    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x6e3820,
      roughness: 0.95,
      metalness: 0.0,
      flatShading: true,
    });

    const solarMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f2b46,
      roughness: 0.15,
      metalness: 0.9,
    });

    // 1. UNEVEN CRATER TERRAIN
    const terrainGroup = new THREE.Group();
    terrainGroup.name = 'Terrain_Crater_Basin';

    const terrainWidth = 60;
    const terrainDepth = 60;
    const segmentsX = 40;
    const segmentsZ = 40;
    const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainDepth, segmentsX, segmentsZ);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Create elevation: a gentle crater depression with surrounding ridges and slope variations
      const distFromCenter = Math.sqrt(x * x + z * z);
      
      // Keep central area (where habitat is placed) relatively level
      let elevation = 0;
      if (distFromCenter < 12) {
        elevation = Math.sin(x * 0.15) * 0.2 + Math.cos(z * 0.15) * 0.2;
      } else {
        // Outer terrain rises into gentle and steep ridges
        elevation =
          Math.sin(x * 0.12) * 1.5 +
          Math.cos(z * 0.1) * 1.8 +
          Math.sin(distFromCenter * 0.25) * 1.2 +
          ((distFromCenter - 12) / 20) * 2.0;
        
        // Add a steep impassable ridge on the east side (>48 degree slope)
        if (x > 18) {
          elevation += Math.pow((x - 18) / 8, 2) * 4.0;
        }
      }

      pos.setY(i, elevation);
    }
    terrainGeo.computeVertexNormals();

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMaterial);
    terrainMesh.name = 'Terrain_Mesh';
    terrainMesh.receiveShadow = true;
    terrainGroup.add(terrainMesh);
    root.add(terrainGroup);

    // 2. MODULAR RESEARCH HABITAT
    const habGroup = new THREE.Group();
    habGroup.name = 'Habitat_Main_Module';
    habGroup.position.set(0, 0.4, 0);

    // Interior Floor Deck (Walkable, designated floor)
    const floorGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.2, 32);
    const floorMesh = new THREE.Mesh(floorGeo, habInteriorFloorMaterial);
    floorMesh.name = 'Floor_Deck_Interior';
    floorMesh.position.set(0, 0.1, 0);
    floorMesh.receiveShadow = true;
    habGroup.add(floorMesh);

    // Cylindrical Perimeter Wall with an open doorway entrance (+Z direction)
    // We construct the wall using 7 modular segments, leaving the front segment open for entrance
    const wallSegmentCount = 8;
    const habRadius = 5.0;
    const wallHeight = 3.2;

    for (let i = 0; i < wallSegmentCount; i++) {
      // Skip index 0 (front entrance doorway)
      if (i === 0) continue;

      const angle = (i / wallSegmentCount) * Math.PI * 2;
      const nextAngle = ((i + 1) / wallSegmentCount) * Math.PI * 2;
      const midAngle = (angle + nextAngle) / 2;

      const segmentWidth = 2 * habRadius * Math.sin(Math.PI / wallSegmentCount);
      const segmentGeo = new THREE.BoxGeometry(segmentWidth, wallHeight, 0.25);
      const segmentMesh = new THREE.Mesh(segmentGeo, habWallMaterial);
      segmentMesh.name = `Wall_Segment_0${i}`;
      segmentMesh.position.set(
        Math.sin(midAngle) * habRadius,
        wallHeight / 2 + 0.2,
        Math.cos(midAngle) * habRadius
      );
      segmentMesh.rotation.y = midAngle;
      segmentMesh.castShadow = true;
      segmentMesh.receiveShadow = true;
      habGroup.add(segmentMesh);
    }

    // Dome Roof
    const roofGeo = new THREE.SphereGeometry(5.1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.3);
    const roofMesh = new THREE.Mesh(roofGeo, habWallMaterial);
    roofMesh.name = 'Habitat_Dome_Roof';
    roofMesh.position.set(0, wallHeight + 0.1, 0);
    roofMesh.castShadow = true;
    habGroup.add(roofMesh);

    // 3. INTERIOR LABORATORY FIXTURES
    const labGroup = new THREE.Group();
    labGroup.name = 'Interior_Lab_Equipment';

    // Central Analysis Console
    const consoleGeo = new THREE.BoxGeometry(2.4, 0.9, 1.2);
    const consoleMesh = new THREE.Mesh(consoleGeo, consoleMaterial);
    consoleMesh.name = 'Console_Central_Analysis';
    consoleMesh.position.set(0, 0.65, -0.5);
    consoleMesh.castShadow = true;
    consoleMesh.receiveShadow = true;
    labGroup.add(consoleMesh);

    // Display Screen above console
    const screenGeo = new THREE.BoxGeometry(1.6, 0.6, 0.08);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00a0b0,
      emissiveIntensity: 0.8,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.name = 'Equipment_Screen_Display';
    screenMesh.position.set(0, 1.4, -0.5);
    labGroup.add(screenMesh);

    // Equipment Storage Racks
    const rackGeo = new THREE.BoxGeometry(1.8, 2.2, 0.6);
    const rackMesh = new THREE.Mesh(rackGeo, metalFrameMaterial);
    rackMesh.name = 'Equipment_Rack_East';
    rackMesh.position.set(3.2, 1.3, -1.0);
    rackMesh.castShadow = true;
    rackMesh.receiveShadow = true;
    labGroup.add(rackMesh);

    const deskGeo = new THREE.BoxGeometry(1.8, 0.85, 0.8);
    const deskMesh = new THREE.Mesh(deskGeo, consoleMaterial);
    deskMesh.name = 'Desk_Workstation_West';
    deskMesh.position.set(-3.2, 0.62, -0.5);
    deskMesh.castShadow = true;
    labGroup.add(deskMesh);

    habGroup.add(labGroup);
    root.add(habGroup);

    // 4. ACCESS RAMPS & STEPPED PLATFORMS (Connecting outdoor to indoor)
    const accessGroup = new THREE.Group();
    accessGroup.name = 'Access_Structures';

    // Smooth Incline Ramp leading to habitat front doorway (Z = 5.0 to Z = 9.0)
    const rampGeo = new THREE.BoxGeometry(2.2, 0.15, 4.0);
    const rampMesh = new THREE.Mesh(rampGeo, metalFrameMaterial);
    rampMesh.name = 'Ramp_Entrance_Incline';
    rampMesh.position.set(0, 0.28, 6.8);
    rampMesh.rotation.x = 0.09; // ~5 degree gentle walkable slope
    rampMesh.receiveShadow = true;
    rampMesh.castShadow = true;
    accessGroup.add(rampMesh);

    // 3-Step Entrance Platform on the West side (Tests automatic step climbing!)
    const stepsGroup = new THREE.Group();
    stepsGroup.name = 'Steps_Platform_Observation';
    const stepWidth = 2.0;
    const stepDepth = 0.8;
    const stepHeight = 0.15; // 15cm riser per step (within max step height of 35cm)

    for (let s = 0; s < 3; s++) {
      const stepGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
      const stepMesh = new THREE.Mesh(stepGeo, metalFrameMaterial);
      stepMesh.name = `Step_Riser_0${s + 1}`;
      stepMesh.position.set(-6.5, (s + 0.5) * stepHeight, 3.0 + s * stepDepth);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      stepsGroup.add(stepMesh);
    }

    // Elevated Observation Deck at top of steps
    const deckGeo = new THREE.BoxGeometry(3.0, stepHeight, 3.0);
    const deckMesh = new THREE.Mesh(deckGeo, habInteriorFloorMaterial);
    deckMesh.name = 'Floor_Platform_Observation_Deck';
    deckMesh.position.set(-6.5, 3 * stepHeight + stepHeight / 2, 5.8);
    deckMesh.receiveShadow = true;
    deckMesh.castShadow = true;
    stepsGroup.add(deckMesh);

    accessGroup.add(stepsGroup);
    root.add(accessGroup);

    // 5. EXTERIOR SOLAR ARRAYS & PROPS
    const propsGroup = new THREE.Group();
    propsGroup.name = 'Exterior_Outpost_Props';

    // Solar Panel Unit 1
    const solarPanelGeo = new THREE.BoxGeometry(4.0, 0.1, 2.5);
    const solarMesh1 = new THREE.Mesh(solarPanelGeo, solarMaterial);
    solarMesh1.name = 'SolarArray_North_01';
    solarMesh1.position.set(8.5, 1.8, -7.0);
    solarMesh1.rotation.x = 0.45; // angled toward sun
    solarMesh1.castShadow = true;
    propsGroup.add(solarMesh1);

    // Boulder Rock Formations
    const rockGeo1 = new THREE.DodecahedronGeometry(1.6, 1);
    const rockMesh1 = new THREE.Mesh(rockGeo1, rockMaterial);
    rockMesh1.name = 'Rock_Boulder_Crater_01';
    rockMesh1.position.set(-11.0, 1.2, -6.5);
    rockMesh1.scale.set(1.4, 0.9, 1.2);
    rockMesh1.castShadow = true;
    rockMesh1.receiveShadow = true;
    propsGroup.add(rockMesh1);

    const rockGeo2 = new THREE.DodecahedronGeometry(1.1, 1);
    const rockMesh2 = new THREE.Mesh(rockGeo2, rockMaterial);
    rockMesh2.name = 'Rock_Boulder_Crater_02';
    rockMesh2.position.set(12.0, 0.9, 8.5);
    rockMesh2.scale.set(1.1, 1.3, 0.8);
    rockMesh2.castShadow = true;
    rockMesh2.receiveShadow = true;
    propsGroup.add(rockMesh2);

    // Supply Crates
    const crateGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const crateMesh = new THREE.Mesh(crateGeo, metalFrameMaterial);
    crateMesh.name = 'Prop_Crate_Cargo_01';
    crateMesh.position.set(3.8, 0.5, 7.5);
    crateMesh.castShadow = true;
    propsGroup.add(crateMesh);

    root.add(propsGroup);

    return root;
  }
}
