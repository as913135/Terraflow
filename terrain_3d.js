/**
 * TerraFlow - 3D Subsurface Digital Twin Engine
 * WebGL-powered 3D visualization of mountain terrain, transparent ground cutaway,
 * multi-tier underground pipelines, manholes, depth slicing, and AI risk highlights.
 */

class TerraFlow3DSubsurfaceEngine {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = null;
    this.mouse = null;
    
    // Meshes and groups
    this.terrainGroup = null;
    this.pipesGroup = null;
    this.manholesGroup = null;
    this.markersGroup = null;
    this.depthPlaneGroup = null;
    this.pipeMeshMap = new Map(); // pipeId -> mesh
    
    // View state
    this.colorMode = 'utility'; // 'utility' or 'risk'
    this.groundOpacity = 0.35;
    this.depthSliceCutoffM = 5.0; // show all up to 5m depth
    this.selectedPipeId = null;
    this.hoveredPipeId = null;
    this.isInitialized = false;

    // Callbacks
    this.onPipeSelect = options.onPipeSelect || (() => {});
    this.onPipeHover = options.onPipeHover || (() => {});
  }

  init() {
    if (!this.container) return false;
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded yet, fallback mode active.');
      this.initFallback2DCanvas();
      return false;
    }

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 550;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070d19); // Deep nocturnal Himalayan slate
    this.scene.fog = new THREE.FogExp2(0x070d19, 0.0035);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    this.camera.position.set(90, 80, 110);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.15; // allow looking slightly from below ground!
      this.controls.minDistance = 15;
      this.controls.maxDistance = 450;
      this.controls.target.set(0, 0, 0);
    }

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.1);
    dirLight.position.set(120, 150, 90);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const blueSubLight = new THREE.PointLight(0x0284c7, 0.8, 250);
    blueSubLight.position.set(0, -25, 0);
    this.scene.add(blueSubLight);

    // 6. Groups
    this.terrainGroup = new THREE.Group();
    this.pipesGroup = new THREE.Group();
    this.manholesGroup = new THREE.Group();
    this.markersGroup = new THREE.Group();
    this.depthPlaneGroup = new THREE.Group();

    this.scene.add(this.terrainGroup);
    this.scene.add(this.pipesGroup);
    this.scene.add(this.manholesGroup);
    this.scene.add(this.markersGroup);
    this.scene.add(this.depthPlaneGroup);

    // 7. Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.renderer.domElement.addEventListener('click', (e) => this.onPointerClick(e));
    window.addEventListener('resize', () => this.onResize());

    this.isInitialized = true;
    this.animate();
    return true;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.controls) this.controls.update();
    
    // Floating marker pulse animation
    if (this.markersGroup && this.markersGroup.children.length > 0) {
      const time = Date.now() * 0.003;
      this.markersGroup.children.forEach(marker => {
        if (marker.userData.isCitizenMarker) {
          marker.position.y = marker.userData.baseY + Math.sin(time + marker.userData.offset) * 0.8;
          marker.rotation.y += 0.015;
        }
      });
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Loads hill town dataset and constructs 3D digital twin
   */
  loadTownData(townData, riskResults = null) {
    if (!this.isInitialized) {
      const ok = this.init();
      if (!ok) return;
    }

    this.currentTown = townData;
    this.riskResults = riskResults;
    this.pipeMeshMap.clear();

    // Clear previous
    this.clearGroup(this.terrainGroup);
    this.clearGroup(this.pipesGroup);
    this.clearGroup(this.manholesGroup);
    this.clearGroup(this.markersGroup);
    this.clearGroup(this.depthPlaneGroup);

    // Determine coordinate normalization bounds
    const centerLat = townData.center[0];
    const centerLng = townData.center[1];
    const baseElev = townData.elevation || 2000;
    const scaleFactor = 12000; // coordinate to 3D world scale

    this.coordTo3D = (lat, lng, elev = baseElev) => {
      const x = (lng - centerLng) * scaleFactor;
      const z = -(lat - centerLat) * scaleFactor;
      // Exaggerate hill slope slightly for clear 3D depth comprehension
      const y = ((elev - baseElev) * 0.45);
      return new THREE.Vector3(x, y, z);
    };

    // 1. Build Mountain Terrain & Cutaway Surface
    this.buildTerrain(townData);

    // 2. Build 3D Depth Reference Plane & Strata
    this.buildDepthSlicingGrid();

    // 3. Build 3D Pipelines
    this.buildPipelines(townData.pipes, riskResults);

    // 4. Build 3D Manholes / Inspection Chambers
    this.buildManholes(townData.manholes);

    // 5. Build 3D Citizen Anomaly Markers
    this.buildCommunityMarkers(townData.community_reports);

    // Reset camera target
    if (this.controls) {
      this.controls.target.set(0, 0, 0);
    }
  }

  /**
   * Builds realistic Mountain Terrain with transparent ground cutaway
   */
  buildTerrain(townData) {
    const size = 160;
    const segments = 45;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const avgSlope = (townData.avgSlope || 25) * (Math.PI / 180);

    // Sculpt mountain slope with ridge and valley contours
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      // Mountain slope: drops from North-West to South-East
      let vy = (vz * Math.sin(avgSlope) * 0.45) - (vx * 0.2);
      // Gentle mountain ridges and gully folds
      vy += Math.sin(vx * 0.08) * 3.5 + Math.cos(vz * 0.06) * 4.0;

      pos.setY(i, vy);
    }
    geometry.computeVertexNormals();

    // Semi-transparent surface material
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.1,
      transparent: true,
      opacity: this.groundOpacity,
      wireframe: false,
      side: THREE.DoubleSide
    });

    const terrainMesh = new THREE.Mesh(geometry, surfaceMat);
    terrainMesh.receiveShadow = true;
    this.terrainMesh = terrainMesh;
    this.terrainGroup.add(terrainMesh);

    // Wireframe topographical contour grid overlay on surface
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireMesh = new THREE.Mesh(geometry, wireMat);
    wireMesh.position.y += 0.1;
    this.terrainGroup.add(wireMesh);

    // Road corridor ribbon mesh on top
    this.buildRoadNetworkRibbon(townData.pipes);
  }

  buildRoadNetworkRibbon(pipes) {
    if (!pipes || pipes.length === 0) return;
    pipes.forEach(pipe => {
      if (pipe.coords.length < 2) return;
      const pts = pipe.coords.map(c => {
        const v = this.coordTo3D(c[0], c[1], c[2]);
        v.y += 0.25; // directly on asphalt surface
        return v;
      });

      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 30, 1.2, 4, false);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.9,
        transparent: true,
        opacity: Math.min(1.0, this.groundOpacity + 0.3)
      });
      const roadMesh = new THREE.Mesh(tubeGeo, roadMat);
      this.terrainGroup.add(roadMesh);
    });
  }

  /**
   * Builds depth grid strata: 0m Ground, -1m, -2m, -3m
   */
  buildDepthSlicingGrid() {
    const depthLevels = [
      { depth: -1.0, label: '0.8m - 1.2m Utility Zone (Telecom / Electric / Water Laterals)', color: 0x0284c7 },
      { depth: -2.5, label: '2.0m - 3.0m Deep Utility Zone (Gravity Sewers / Main Feeder Aqueducts)', color: 0x0f766e }
    ];

    depthLevels.forEach(lvl => {
      const grid = new THREE.GridHelper(160, 20, lvl.color, 0x1e293b);
      grid.position.y = lvl.depth * 3.5;
      grid.material.opacity = 0.2;
      grid.material.transparent = true;
      this.depthPlaneGroup.add(grid);
    });
  }

  /**
   * Builds 3D Pipe conduits with accurate burial depth, diameter, and glowing shaders
   */
  buildPipelines(pipes, riskResults) {
    if (!pipes) return;

    pipes.forEach(pipe => {
      if (!pipe.coords || pipe.coords.length < 2) return;

      // Pipe vertical burial depth scale: 1 meter depth = 3.5 3D world units
      const depthOffset = (pipe.depth_m || 1.2) * 3.5;

      const pts3D = pipe.coords.map(c => {
        const v = this.coordTo3D(c[0], c[1], c[2]);
        v.y -= depthOffset; // BURIED UNDERGROUND!
        return v;
      });

      const curve = new THREE.CatmullRomCurve3(pts3D);
      // Diameter scaling
      const radius = Math.max(0.35, (pipe.diameter_mm || 150) / 250);
      const tubeGeo = new THREE.TubeGeometry(curve, 35, radius, 10, false);

      // Determine Color: By Utility Type OR By AI Risk Score
      const hexColor = this.getPipeColor(pipe, riskResults);
      const riskTier = riskResults && riskResults.byPipeId[pipe.id] ? riskResults.byPipeId[pipe.id].tier : 'low';

      // Pipe Material with glowing emissive core
      const pipeMat = new THREE.MeshStandardMaterial({
        color: hexColor,
        roughness: 0.35,
        metalness: 0.45,
        emissive: hexColor,
        emissiveIntensity: riskTier === 'high' ? 0.75 : 0.35
      });

      const pipeMesh = new THREE.Mesh(tubeGeo, pipeMat);
      pipeMesh.castShadow = true;
      pipeMesh.userData = {
        isPipe: true,
        pipeId: pipe.id,
        pipeData: pipe,
        originalColor: hexColor,
        originalEmissive: pipeMat.emissive.getHex(),
        originalEmissiveIntensity: pipeMat.emissiveIntensity
      };

      this.pipesGroup.add(pipeMesh);
      this.pipeMeshMap.set(pipe.id, pipeMesh);

      // Add 3D joint couplings / flanges at vertices
      pts3D.forEach((pt, idx) => {
        if (idx > 0 && idx < pts3D.length - 1) {
          const jointGeo = new THREE.CylinderGeometry(radius * 1.4, radius * 1.4, 0.6, 8);
          const jointMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
          const jointMesh = new THREE.Mesh(jointGeo, jointMat);
          jointMesh.position.copy(pt);
          this.pipesGroup.add(jointMesh);
        }
      });
    });
  }

  getPipeColor(pipe, riskResults) {
    if (this.colorMode === 'risk' && riskResults && riskResults.byPipeId[pipe.id]) {
      const r = riskResults.byPipeId[pipe.id];
      if (r.tier === 'high') return 0xef4444; // Red
      if (r.tier === 'medium') return 0xf59e0b; // Amber
      return 0x10b981; // Green
    }

    // Default: Utility Type
    const meta = UTILITY_METADATA[pipe.utilityType];
    return meta ? meta.colorThree : 0x06b6d4;
  }

  /**
   * Builds vertical manhole shafts linking surface down to pipe invert
   */
  buildManholes(manholes) {
    if (!manholes) return;

    manholes.forEach(mh => {
      const surfacePos = this.coordTo3D(mh.lat, mh.lng);
      const shaftHeight = (mh.depth_m || 2.0) * 3.5;

      const shaftGeo = new THREE.CylinderGeometry(1.2, 1.2, shaftHeight, 12);
      const shaftMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.85,
        transparent: true,
        opacity: 0.65
      });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(surfacePos.x, surfacePos.y - (shaftHeight / 2), surfacePos.z);
      this.manholesGroup.add(shaft);

      // Manhole Cover Ring at surface
      const coverGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.3, 12);
      const coverMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.2 });
      const cover = new THREE.Mesh(coverGeo, coverMat);
      cover.position.set(surfacePos.x, surfacePos.y + 0.15, surfacePos.z);
      this.manholesGroup.add(cover);
    });
  }

  /**
   * Builds 3D Floating Citizen Report Anomaly Pins
   */
  buildCommunityMarkers(reports) {
    if (!reports) return;

    reports.forEach((rep, idx) => {
      const surf = this.coordTo3D(rep.lat, rep.lng, rep.elevation);
      
      const group = new THREE.Group();
      group.position.set(surf.x, surf.y + 2.5, surf.z);
      group.userData = {
        isCitizenMarker: true,
        baseY: surf.y + 2.5,
        offset: idx * 1.5,
        reportId: rep.id,
        reportData: rep
      };

      // Marker Cone / Diamond
      const coneGeo = new THREE.ConeGeometry(1.2, 2.8, 6);
      coneGeo.rotateX(Math.PI); // point down to ground

      const isCritical = rep.severity === 'critical';
      const col = isCritical ? 0xef4444 : rep.type === 'wet_patch' ? 0x06b6d4 : 0xf59e0b;

      const markerMat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.85,
        roughness: 0.2
      });

      const coneMesh = new THREE.Mesh(coneGeo, markerMat);
      group.add(coneMesh);

      // Pulsing Ring at surface
      const ringGeo = new THREE.RingGeometry(1.0, 1.8, 16);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.y = -2.3;
      group.add(ringMesh);

      this.markersGroup.add(group);
    });
  }

  /**
   * Update View Modes & Controls
   */
  setColorMode(mode) {
    this.colorMode = mode;
    if (this.currentTown) {
      this.pipesGroup.children.forEach(mesh => {
        if (mesh.userData && mesh.userData.isPipe) {
          const newCol = this.getPipeColor(mesh.userData.pipeData, this.riskResults);
          mesh.material.color.setHex(newCol);
          mesh.material.emissive.setHex(newCol);
          mesh.userData.originalColor = newCol;
          mesh.userData.originalEmissive = newCol;
        }
      });
    }
  }

  setGroundOpacity(val) {
    this.groundOpacity = Number(val);
    if (this.terrainMesh) {
      this.terrainMesh.material.opacity = this.groundOpacity;
      this.terrainMesh.material.needsUpdate = true;
    }
  }

  setCameraPreset(preset) {
    if (!this.camera || !this.controls) return;
    switch (preset) {
      case 'iso': // Isometric 3D Cutaway
        this.camera.position.set(90, 75, 110);
        this.controls.target.set(0, 0, 0);
        break;
      case 'cross_section': // Side-on cross section
        this.camera.position.set(0, 5, 140);
        this.controls.target.set(0, -10, 0);
        break;
      case 'top_down': // Ortho-like top view
        this.camera.position.set(0, 160, 0.1);
        this.controls.target.set(0, 0, 0);
        break;
      case 'underground': // Below ground peering up
        this.camera.position.set(50, -35, 60);
        this.controls.target.set(0, -5, 0);
        break;
    }
  }

  highlightPipe(pipeId) {
    this.selectedPipeId = pipeId;
    this.pipesGroup.children.forEach(mesh => {
      if (mesh.userData && mesh.userData.isPipe) {
        if (mesh.userData.pipeId === pipeId) {
          mesh.material.emissive.setHex(0xffffff);
          mesh.material.emissiveIntensity = 1.0;
          mesh.scale.set(1.4, 1.4, 1.4);
        } else {
          mesh.material.emissive.setHex(mesh.userData.originalEmissive);
          mesh.material.emissiveIntensity = 0.2;
          mesh.scale.set(1.0, 1.0, 1.0);
        }
      }
    });
  }

  clearSelection() {
    this.selectedPipeId = null;
    this.pipesGroup.children.forEach(mesh => {
      if (mesh.userData && mesh.userData.isPipe) {
        mesh.material.emissive.setHex(mesh.userData.originalEmissive);
        mesh.material.emissiveIntensity = mesh.userData.originalEmissiveIntensity;
        mesh.scale.set(1.0, 1.0, 1.0);
      }
    });
  }

  // Pointer interactions
  onPointerMove(event) {
    if (!this.raycaster || !this.camera) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pipesGroup.children);

    if (intersects.length > 0 && intersects[0].object.userData.isPipe) {
      const hitPipe = intersects[0].object.userData.pipeData;
      if (this.hoveredPipeId !== hitPipe.id) {
        this.hoveredPipeId = hitPipe.id;
        this.container.style.cursor = 'pointer';
        this.onPipeHover(hitPipe, event);
      }
    } else {
      if (this.hoveredPipeId) {
        this.hoveredPipeId = null;
        this.container.style.cursor = 'grab';
        this.onPipeHover(null, event);
      }
    }
  }

  onPointerClick(event) {
    if (!this.raycaster || !this.camera) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pipesGroup.children);

    if (intersects.length > 0 && intersects[0].object.userData.isPipe) {
      const hitPipe = intersects[0].object.userData.pipeData;
      this.highlightPipe(hitPipe.id);
      this.onPipeSelect(hitPipe);
    } else {
      // Check citizen marker clicks
      const markerHits = this.raycaster.intersectObjects(this.markersGroup.children, true);
      if (markerHits.length > 0) {
        let parentMarker = markerHits[0].object;
        while (parentMarker.parent && !parentMarker.userData.isCitizenMarker) {
          parentMarker = parentMarker.parent;
        }
        if (parentMarker.userData && parentMarker.userData.reportData) {
          if (this.options.onReportClick) {
            this.options.onReportClick(parentMarker.userData.reportData);
          }
        }
      }
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  clearGroup(group) {
    if (!group) return;
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
  }

  /**
   * Fallback 2D Isometric Subsurface Canvas if WebGL is unavailable
   */
  initFallback2DCanvas() {
    this.container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#94a3b8; background:#070d19; padding:20px; text-align:center;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        <h4 style="color:#f8fafc; margin-top:10px;">Three.js WebGL Initializing...</h4>
        <p style="font-size:13px; max-width:400px;">Loading 3D underground pipeline coordinate matrix. If Three.js CDN takes time, please check your network connection.</p>
      </div>
    `;
  }
}
