/**
 * TerraFlow - Google Maps Subsurface GIS Engine
 * Powered by Google Maps JavaScript API (Satellite Hybrid, Topo Terrain, Dark Vector)
 * Integrated with Google Places Autocomplete to connect TerraFlow to ANY location globally.
 */

class TerraFlowGoogleMapsEngine {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.polylines = new Map(); // pipeId -> google.maps.Polyline
    this.markers = [];          // google.maps.Marker
    this.excavationCircle = null;
    this.excavationMarker = null;
    this.activeInfoWindow = null;
    this.currentTown = null;
    this.riskResults = null;
    this.colorMode = 'utility';
    this.layerFilterState = {
      water_main: true,
      water_distribution: true,
      sewer_gravity: true,
      electric_11kv: true,
      telecom_fiber: true,
      stormwater_nullah: true
    };

    this.onPipeSelect = options.onPipeSelect || (() => {});
    this.onExcavationSitePicked = options.onExcavationSitePicked || (() => {});
    this.onMapClickForReport = options.onMapClickForReport || null;
    this.isPickReportMode = false;
    this.isExcavationToolActive = false;
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) return false;
    if (typeof google === 'undefined' || !google.maps) {
      console.warn('Google Maps API not yet loaded.');
      return false;
    }

    // Custom Nocturnal Himalayan Dark Map Style for Google Maps
    const darkMapStyle = [
      { elementType: "geometry", stylers: [{ color: "#0b1528" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#0b1528" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#38bdf8" }]
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#64748b" }]
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#06282d" }]
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#1e293b" }]
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#334155" }]
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#cbd5e1" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#334155" }]
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#1e293b" }]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#071a35" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#0284c7" }]
      }
    ];

    // Initialize Google Map
    this.map = new google.maps.Map(container, {
      center: { lat: 32.2396, lng: 77.1887 }, // Manali
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.HYBRID, // Default to stunning Google Satellite Hybrid view
      styles: [], // default for hybrid/satellite
      disableDefaultUI: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      },
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: [
          google.maps.MapTypeId.HYBRID,
          google.maps.MapTypeId.TERRAIN,
          google.maps.MapTypeId.ROADMAP,
          google.maps.MapTypeId.SATELLITE,
          'dark_terraflow'
        ]
      },
      streetViewControl: false,
      fullscreenControl: true
    });

    // Register Dark Style Map Type
    const styledMapType = new google.maps.StyledMapType(darkMapStyle, { name: 'Dark Blueprint' });
    this.map.mapTypes.set('dark_terraflow', styledMapType);

    this.activeInfoWindow = new google.maps.InfoWindow();

    // Map Click Listener
    this.map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (this.isPickReportMode && this.onMapClickForReport) {
        this.onMapClickForReport({ lat, lng });
      } else if (this.isExcavationToolActive) {
        this.setExcavationMarker(lat, lng);
        this.onExcavationSitePicked(lat, lng);
      }
    });

    return true;
  }

  setMapType(type) {
    if (!this.map) return;
    if (type === 'dark') {
      this.map.setMapTypeId('dark_terraflow');
    } else if (type === 'satellite') {
      this.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
    } else if (type === 'hybrid') {
      this.map.setMapTypeId(google.maps.MapTypeId.HYBRID);
    } else if (type === 'topo' || type === 'terrain') {
      this.map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
    } else {
      this.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
    }
  }

  loadTown(townData, riskResults) {
    if (!this.map) {
      const ok = this.init();
      if (!ok) return;
    }

    this.currentTown = townData;
    this.riskResults = riskResults;

    // Clear previous elements
    this.clearMapElements();

    // Pan & Zoom to location
    const centerLatLng = { lat: townData.center[0], lng: townData.center[1] };
    this.map.setCenter(centerLatLng);
    this.map.setZoom(16);

    // Render Subsurface Pipelines as Google Maps Polylines
    this.renderPipes(townData.pipes, riskResults);

    // Render Manholes
    this.renderManholes(townData.manholes);

    // Render Citizen Reports
    this.renderCommunityReports(townData.community_reports);
  }

  renderPipes(pipes, riskResults) {
    if (!pipes || !this.map) return;

    pipes.forEach(pipe => {
      if (!pipe.coords || pipe.coords.length < 2) return;
      if (!this.layerFilterState[pipe.utilityType]) return;

      const path = pipe.coords.map(c => ({ lat: c[0], lng: c[1] }));
      const riskData = riskResults && riskResults.byPipeId[pipe.id] ? riskResults.byPipeId[pipe.id] : { totalScore: 30, tier: 'low' };

      const color = this.getPipeColor(pipe, riskData);
      const isHighRisk = riskData.tier === 'high';
      const weight = Math.max(3.5, Math.min(8, (pipe.diameter_mm || 150) / 45));

      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: isHighRisk ? 1.0 : 0.85,
        strokeWeight: weight,
        map: this.map,
        zIndex: isHighRisk ? 100 : 50
      });

      // Hover and Click events
      polyline.addListener('mouseover', (e) => {
        polyline.setOptions({ strokeWeight: weight + 3, strokeOpacity: 1.0 });
        this.activeInfoWindow.setContent(`
          <div style="font-family:system-ui; font-size:12px; color:#0f172a; padding:4px;">
            <strong style="color:${color}; font-size:13px;">${pipe.name}</strong><br>
            <span>Type: ${UTILITY_METADATA[pipe.utilityType].label}</span><br>
            <span>Depth: <strong>${pipe.depth_m}m</strong> | Diameter: <strong>${pipe.diameter_mm}mm</strong></span><br>
            <span>AI Risk Score: <strong style="color:${isHighRisk?'#ef4444':'#10b981'};">${riskData.totalScore}/100</strong> (${riskData.tier.toUpperCase()})</span>
          </div>
        `);
        this.activeInfoWindow.setPosition(e.latLng);
        this.activeInfoWindow.open(this.map);
      });

      polyline.addListener('mouseout', () => {
        if (this.selectedPipeId !== pipe.id) {
          polyline.setOptions({ strokeWeight: weight, strokeOpacity: isHighRisk ? 1.0 : 0.85 });
        }
        this.activeInfoWindow.close();
      });

      polyline.addListener('click', () => {
        this.selectPipe(pipe.id);
        this.onPipeSelect(pipe);
      });

      this.polylines.set(pipe.id, { polyline, pipe, originalColor: color, originalWeight: weight });
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
    if (!manholes || !this.map) return;

    manholes.forEach(mh => {
      const marker = new google.maps.Marker({
        position: { lat: mh.lat, lng: mh.lng },
        map: this.map,
        title: mh.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#0ea5e9',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      marker.addListener('click', () => {
        this.activeInfoWindow.setContent(`
          <div style="font-family:system-ui; font-size:12px; color:#0f172a; padding:4px;">
            <strong>${mh.name}</strong><br>
            <span>Utility: ${mh.utilityType}</span><br>
            <span>Burial Depth: ${mh.depth_m}m</span><br>
            <span>Chamber Status: <em>${mh.status}</em></span>
          </div>
        `);
        this.activeInfoWindow.open(this.map, marker);
      });

      this.markers.push(marker);
    });
  }

  renderCommunityReports(reports) {
    if (!reports || !this.map) return;

    reports.forEach(rep => {
      let iconColor = '#06b6d4';
      if (rep.type === 'road_subsidence') iconColor = '#ef4444';
      else if (rep.type === 'low_pressure') iconColor = '#f59e0b';
      else if (rep.type === 'exposed_conduit') iconColor = '#e11d48';

      const marker = new google.maps.Marker({
        position: { lat: rep.lat, lng: rep.lng },
        map: this.map,
        title: rep.title,
        icon: {
          path: 'M 0,-18 C -9,-18 -16,-11 -16,-2 C -16,8 0,20 0,20 C 0,20 16,8 16,-2 C 16,-11 9,-18 0,-18 Z',
          scale: 1.2,
          fillColor: iconColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      marker.addListener('click', () => {
        this.activeInfoWindow.setContent(`
          <div style="font-family:system-ui; font-size:12px; max-width:240px; color:#0f172a; padding:4px;">
            <h4 style="margin:0 0 4px 0; color:#0284c7; font-size:13px;">${rep.title}</h4>
            <p style="margin:0 0 4px 0; font-size:11px; color:#64748b;">${rep.hindi_title || ''}</p>
            <div style="font-size:11px; margin-bottom:4px;">
              <strong>Severity:</strong> <span style="color:${rep.severity==='critical'?'#ef4444':'#f59e0b'}; font-weight:bold; text-transform:uppercase;">${rep.severity}</span><br>
              <strong>Date:</strong> ${rep.date}
            </div>
            <p style="margin:4px 0; font-size:11px; background:#f1f5f9; padding:4px 6px; border-radius:4px;">
              "${rep.description}"
            </p>
            <div style="font-size:10px; color:#475569; margin-top:4px;">
              Action: <em>${rep.action_required}</em>
            </div>
          </div>
        `);
        this.activeInfoWindow.open(this.map, marker);
      });

      this.markers.push(marker);
    });
  }

  selectPipe(pipeId) {
    this.selectedPipeId = pipeId;
    this.polylines.forEach((entry, id) => {
      if (id === pipeId) {
        entry.polyline.setOptions({ strokeColor: '#ffffff', strokeWeight: entry.originalWeight + 3, strokeOpacity: 1.0, zIndex: 999 });
        // Center view on pipe
        const path = entry.polyline.getPath();
        if (path && path.getLength() > 0) {
          this.map.panTo(path.getAt(0));
        }
      } else {
        entry.polyline.setOptions({ strokeColor: entry.originalColor, strokeWeight: entry.originalWeight, strokeOpacity: 0.7, zIndex: 50 });
      }
    });
  }

  setColorMode(mode) {
    this.colorMode = mode;
    if (this.currentTown) {
      this.clearMapElements();
      this.renderPipes(this.currentTown.pipes, this.riskResults);
      this.renderManholes(this.currentTown.manholes);
      this.renderCommunityReports(this.currentTown.community_reports);
    }
  }

  setLayerFilter(type, enabled) {
    this.layerFilterState[type] = enabled;
    if (this.currentTown) {
      this.clearMapElements();
      this.renderPipes(this.currentTown.pipes, this.riskResults);
      this.renderManholes(this.currentTown.manholes);
      this.renderCommunityReports(this.currentTown.community_reports);
    }
  }

  setExcavationMarker(lat, lng, radiusM = 40) {
    if (this.excavationCircle) this.excavationCircle.setMap(null);
    if (this.excavationMarker) this.excavationMarker.setMap(null);

    const pos = { lat, lng };

    this.excavationCircle = new google.maps.Circle({
      strokeColor: '#f43f5e',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: '#f43f5e',
      fillOpacity: 0.25,
      map: this.map,
      center: pos,
      radius: radiusM
    });

    this.excavationMarker = new google.maps.Marker({
      position: pos,
      map: this.map,
      title: 'Target Excavation Site',
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 7,
        fillColor: '#f43f5e',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });

    this.map.panTo(pos);
  }

  clearExcavationZone() {
    if (this.excavationCircle) {
      this.excavationCircle.setMap(null);
      this.excavationCircle = null;
    }
    if (this.excavationMarker) {
      this.excavationMarker.setMap(null);
      this.excavationMarker = null;
    }
    this.isExcavationToolActive = false;
  }

  clearMapElements() {
    this.polylines.forEach(p => p.polyline.setMap(null));
    this.polylines.clear();
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];
    if (this.activeInfoWindow) this.activeInfoWindow.close();
  }

  invalidateSize() {
    if (this.map && typeof google !== 'undefined' && google.maps) {
      google.maps.event.trigger(this.map, 'resize');
    }
  }
}
