/**
 * TerraFlow - 2D Tactical GIS Map Engine
 * Powered by Leaflet with multi-layer base maps (Satellite, Topo, Dark Matter),
 * subterranean utility polylines, AI risk heatmap overlays, citizen report pins,
 * and excavation buffer zone conflict tools.
 */

class TerraFlowGISMapEngine {
  constructor(mapContainerId, options = {}) {
    this.containerId = mapContainerId;
    this.options = options;
    this.map = null;
    this.pipeLayersGroup = null;
    this.manholeLayersGroup = null;
    this.reportLayersGroup = null;
    this.excavationLayerGroup = null;
    this.layerFilterState = {
      water_main: true,
      water_distribution: true,
      sewer_gravity: true,
      electric_11kv: true,
      telecom_fiber: true,
      stormwater_nullah: true
    };
    this.colorMode = 'utility'; // 'utility' or 'risk'
    this.selectedPipeId = null;
    this.pipePolylineMap = new Map();

    // Callbacks
    this.onPipeSelect = options.onPipeSelect || (() => {});
    this.onExcavationSitePicked = options.onExcavationSitePicked || (() => {});
    this.onMapClickForReport = options.onMapClickForReport || null;
    this.isPickReportMode = false;
    this.isExcavationToolActive = false;
  }

  init() {
    if (typeof L === 'undefined') {
      console.warn('Leaflet GIS library not available.');
      return false;
    }

    // Initialize Map with dark themed default
    this.map = L.map(this.containerId, {
      center: [32.2396, 77.1887], // Manali
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // Custom top-right zoom control
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Base Tile Providers
    this.baseLayers = {
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }),
      topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17
      }),
      osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      })
    };

    // Default to dark theme
    this.baseLayers.dark.addTo(this.map);

    // Layer Groups
    this.pipeLayersGroup = L.layerGroup().addTo(this.map);
    this.manholeLayersGroup = L.layerGroup().addTo(this.map);
    this.reportLayersGroup = L.layerGroup().addTo(this.map);
    this.excavationLayerGroup = L.layerGroup().addTo(this.map);

    // Map Click Listener
    this.map.on('click', (e) => {
      if (this.isPickReportMode && this.onMapClickForReport) {
        this.onMapClickForReport(e.latlng);
      } else if (this.isExcavationToolActive) {
        this.setExcavationMarker(e.latlng.lat, e.latlng.lng);
        this.onExcavationSitePicked(e.latlng.lat, e.latlng.lng);
      }
    });

    return true;
  }

  setBaseMap(type) {
    if (!this.map || !this.baseLayers[type]) return;
    Object.values(this.baseLayers).forEach(layer => this.map.removeLayer(layer));
    this.baseLayers[type].addTo(this.map);
  }

  loadTown(townData, riskResults) {
    if (!this.map) this.init();
    this.currentTown = townData;
    this.riskResults = riskResults;
    this.pipePolylineMap.clear();

    this.pipeLayersGroup.clearLayers();
    this.manholeLayersGroup.clearLayers();
    this.reportLayersGroup.clearLayers();
    this.excavationLayerGroup.clearLayers();

    // Pan to town center
    this.map.setView(townData.center, 15);

    // Render Subsurface Pipelines
    this.renderPipes(townData.pipes, riskResults);

    // Render Manholes
    this.renderManholes(townData.manholes);

    // Render Community Reports
    this.renderCommunityReports(townData.community_reports);
  }

  renderPipes(pipes, riskResults) {
    if (!pipes) return;

    pipes.forEach(pipe => {
      if (!pipe.coords || pipe.coords.length < 2) return;
      if (!this.layerFilterState[pipe.utilityType]) return;

      const latlngs = pipe.coords.map(c => [c[0], c[1]]);
      const riskData = riskResults && riskResults.byPipeId[pipe.id] ? riskResults.byPipeId[pipe.id] : { totalScore: 30, tier: 'low' };

      // Determine Color
      const color = this.getPipeColor(pipe, riskData);
      const isHighRisk = riskData.tier === 'high';

      // Width scaled by diameter
      const weight = Math.max(3.5, Math.min(8, (pipe.diameter_mm || 150) / 45));

      const polyline = L.polyline(latlngs, {
        color: color,
        weight: weight,
        opacity: isHighRisk ? 0.95 : 0.8,
        dashArray: pipe.verification_status.includes('Unverified') ? '6, 6' : null,
        className: isHighRisk ? 'pipe-pulse-animation' : 'pipe-standard'
      });

      // Tooltip on hover
      polyline.bindTooltip(`
        <div style="font-family:system-ui; font-size:12px;">
          <strong style="color:${color};">${pipe.name}</strong><br>
          <span>${UTILITY_METADATA[pipe.utilityType].label}</span><br>
          <span style="color:#f8fafc;">Depth: <strong>${pipe.depth_m}m</strong> | Risk: <strong>${riskData.totalScore}/100</strong></span>
        </div>
      `, { sticky: true, opacity: 0.95, className: 'leaflet-custom-tooltip' });

      // Click event
      polyline.on('click', () => {
        this.selectPipe(pipe.id);
        this.onPipeSelect(pipe);
      });

      this.pipeLayersGroup.addLayer(polyline);
      this.pipePolylineMap.set(pipe.id, { polyline, pipe, originalColor: color, originalWeight: weight });
    });
  }

  getPipeColor(pipe, riskData) {
    if (this.colorMode === 'risk') {
      if (riskData.tier === 'high') return '#ef4444'; // Red
      if (riskData.tier === 'medium') return '#f59e0b'; // Amber
      return '#10b981'; // Green
    }
    const meta = UTILITY_METADATA[pipe.utilityType];
    return meta ? meta.color : '#06b6d4';
  }

  renderManholes(manholes) {
    if (!manholes) return;

    manholes.forEach(mh => {
      const marker = L.circleMarker([mh.lat, mh.lng], {
        radius: 5,
        fillColor: '#0ea5e9',
        color: '#f8fafc',
        weight: 1.5,
        fillOpacity: 0.9
      });

      marker.bindPopup(`
        <div style="font-family:system-ui; font-size:12px; color:#1e293b;">
          <strong>${mh.name}</strong><br>
          Type: ${mh.utilityType}<br>
          Depth: ${mh.depth_m}m<br>
          Status: <em>${mh.status}</em>
        </div>
      `);

      this.manholeLayersGroup.addLayer(marker);
    });
  }

  renderCommunityReports(reports) {
    if (!reports) return;

    reports.forEach(rep => {
      let iconColor = '#06b6d4';
      let iconChar = '💧';
      if (rep.type === 'road_subsidence') {
        iconColor = '#ef4444';
        iconChar = '⚠️';
      } else if (rep.type === 'low_pressure') {
        iconColor = '#f59e0b';
        iconChar = '📉';
      } else if (rep.type === 'exposed_conduit') {
        iconColor = '#e11d48';
        iconChar = '⚡';
      }

      const customIcon = L.divIcon({
        className: 'citizen-report-pin',
        html: `
          <div style="background:${iconColor}; color:#fff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px ${iconColor}; border:2px solid #fff; font-size:14px; cursor:pointer;">
            ${iconChar}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([rep.lat, rep.lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family:system-ui; font-size:12px; min-width:200px; color:#0f172a;">
          <h4 style="margin:0 0 4px 0; color:#0284c7; font-size:13px;">${rep.title}</h4>
          <p style="margin:0 0 4px 0; font-size:11px; color:#475569;">${rep.hindi_title || ''}</p>
          <div style="font-size:11px; margin-bottom:4px;">
            <strong>Severity:</strong> <span style="text-transform:uppercase; color:${rep.severity==='critical'?'#ef4444':'#f59e0b'}; font-weight:bold;">${rep.severity}</span><br>
            <strong>Date:</strong> ${rep.date}<br>
            <strong>Status:</strong> ${rep.status}
          </div>
          <p style="margin:4px 0; font-size:11px; background:#f1f5f9; padding:4px 6px; border-radius:4px;">
            "${rep.description}"
          </p>
          <div style="font-size:10px; color:#64748b; margin-top:4px;">
            Action: <em>${rep.action_required}</em>
          </div>
        </div>
      `);

      this.reportLayersGroup.addLayer(marker);
    });
  }

  selectPipe(pipeId) {
    this.selectedPipeId = pipeId;
    this.pipePolylineMap.forEach((entry, id) => {
      if (id === pipeId) {
        entry.polyline.setStyle({ color: '#ffffff', weight: entry.originalWeight + 3, opacity: 1.0 });
        entry.polyline.bringToFront();
      } else {
        entry.polyline.setStyle({ color: entry.originalColor, weight: entry.originalWeight, opacity: 0.65 });
      }
    });
  }

  setColorMode(mode) {
    this.colorMode = mode;
    if (this.currentTown) {
      this.renderPipes(this.currentTown.pipes, this.riskResults);
    }
  }

  setLayerFilter(type, enabled) {
    this.layerFilterState[type] = enabled;
    if (this.currentTown) {
      this.renderPipes(this.currentTown.pipes, this.riskResults);
    }
  }

  setExcavationMarker(lat, lng, radiusM = 40) {
    this.excavationLayerGroup.clearLayers();

    // Buffer Circle
    const circle = L.circle([lat, lng], {
      radius: radiusM,
      color: '#f43f5e',
      fillColor: '#f43f5e',
      fillOpacity: 0.22,
      weight: 2,
      dashArray: '5, 5'
    });

    // Excavator pin
    const excavatorIcon = L.divIcon({
      className: 'excavator-pin',
      html: `
        <div style="background:#f43f5e; color:#fff; width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px rgba(244,63,94,0.7); border:2px solid #fff; font-size:18px;">
          🚜
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([lat, lng], { icon: excavatorIcon });
    marker.bindPopup(`<strong>Target Excavation Trench</strong><br>Radius: ${radiusM}m corridor`).openPopup();

    this.excavationLayerGroup.addLayer(circle);
    this.excavationLayerGroup.addLayer(marker);
  }

  clearExcavationZone() {
    this.excavationLayerGroup.clearLayers();
    this.isExcavationToolActive = false;
  }
}
