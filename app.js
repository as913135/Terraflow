/**
 * TerraFlow — Master Application Controller
 * Modeled after the clean, user-friendly architecture of TerraFlow (Emergent Preview)
 * Coordinates Dashboard KPIs, 2D/3D Map Viewport, Citizen Reports Board, and Subsurface Records Table.
 */

class TerraFlowApp {
  constructor() {
    this.currentTownId = 'manali';
    this.currentTownData = null;
    this.riskResults = null;
    this.selectedPipe = null;
    this.activePage = 'dashboard'; // 'dashboard', 'map', 'reports', 'records'
    this.mapViewMode = '2d';       // '2d' or '3d'
    this.activeMapBase = 'hybrid'; // 'hybrid', 'terrain', 'dark'

    // Utility Filters
    this.utilityFilters = {
      water_main: true,
      water_distribution: true,
      sewer_gravity: true,
      electric_11kv: true,
      telecom_fiber: true,
      stormwater_nullah: true
    };

    // Engines
    this.riskEngine = new TerraFlowRiskEngine();
    this.digSafetyEngine = new TerraFlowDigSafetyEngine(this.riskEngine);
    this.engine3D = null;
    this.engineGIS = null;
    this.isGoogleMapsActive = false;
  }

  init() {
    console.log('Mounting TerraFlow Subsurface Intelligence...');

    // 1. Initialize 3D WebGL Engine
    this.engine3D = new TerraFlow3DSubsurfaceEngine('three-container', {
      onPipeSelect: (pipe) => this.selectPipe(pipe.id),
      onPipeHover: (pipe, event) => {},
      onReportClick: (report) => this.showReportDetails(report)
    });

    // 2. Initialize GIS Map Engine (Google Maps preferred, Leaflet fallback)
    const mapContainer = 'leaflet-map';
    const mapOptions = {
      onPipeSelect: (pipe) => this.selectPipe(pipe.id),
      onExcavationSitePicked: (lat, lng) => this.runExcavationCheckAt(lat, lng),
      onMapClickForReport: (latlng) => this.fillReportCoordinates(latlng)
    };

    if (typeof google !== 'undefined' && google.maps) {
      this.engineGIS = new TerraFlowGoogleMapsEngine(mapContainer, mapOptions);
      this.isGoogleMapsActive = true;
    } else {
      this.engineGIS = new TerraFlowGISMapEngine(mapContainer, mapOptions);
      this.isGoogleMapsActive = false;
      // Async Google Maps loader check
      let attempts = 0;
      const checker = setInterval(() => {
        attempts++;
        if (typeof google !== 'undefined' && google.maps) {
          clearInterval(checker);
          this.switchEngineToGoogleMaps();
        } else if (attempts > 15) {
          clearInterval(checker);
        }
      }, 400);
    }

    // 3. Bind Town & UI events
    this.bindEvents();

    // 4. Load initial town (Manali default)
    this.loadTown('manali');
  }

  switchEngineToGoogleMaps() {
    if (this.isGoogleMapsActive) return;
    const mapContainer = 'leaflet-map';
    const elem = document.getElementById(mapContainer);
    if (elem) elem.innerHTML = '';

    const mapOptions = {
      onPipeSelect: (pipe) => this.selectPipe(pipe.id),
      onExcavationSitePicked: (lat, lng) => this.runExcavationCheckAt(lat, lng),
      onMapClickForReport: (latlng) => this.fillReportCoordinates(latlng)
    };

    this.engineGIS = new TerraFlowGoogleMapsEngine(mapContainer, mapOptions);
    this.isGoogleMapsActive = true;
    this.engineGIS.init();

    if (this.currentTownData) {
      this.engineGIS.loadTown(this.currentTownData, this.riskResults);
    }
  }

  loadTown(townId) {
    let data = TERRAFLOW_TOWNS[townId];
    if (!data && window.customTownData && window.customTownData.id === townId) {
      data = window.customTownData;
    }
    if (!data) data = TERRAFLOW_TOWNS.manali;

    this.currentTownId = townId;
    this.currentTownData = data;

    // Environmental defaults
    this.riskEngine.setEnvironmentalConditions(data.rainfall_24h || 52, 65, false);

    // Evaluate Risk across network
    this.evaluateAndRender();
  }

  evaluateAndRender() {
    if (!this.currentTownData) return;

    // Run Explainable AI Risk Evaluation
    this.riskResults = this.riskEngine.evaluateNetwork(
      this.currentTownData.pipes,
      this.currentTownData.community_reports
    );

    // Update Dashboard KPIs
    this.updateDashboardKPIs();

    // Render Reports Page
    this.renderReportsPage();

    // Render Records Table
    this.renderRecordsTable();

    // Update Segment Counter on Map
    const countElem = document.getElementById('map-segment-counter');
    if (countElem) countElem.textContent = `${this.currentTownData.pipes.length} segments`;

    // Load into GIS and 3D
    if (this.engineGIS) this.engineGIS.loadTown(this.currentTownData, this.riskResults);
    if (this.engine3D) this.engine3D.loadTownData(this.currentTownData, this.riskResults);

    if (this.selectedPipe) {
      this.selectPipe(this.selectedPipe.id);
    }
  }

  updateDashboardKPIs() {
    const stats = this.riskResults.stats;
    const pipes = this.currentTownData.pipes || [];

    // Calculate total network km
    let totalKm = 0;
    pipes.forEach(p => {
      if (p.coords && p.coords.length > 1) {
        for (let i = 0; i < p.coords.length - 1; i++) {
          totalKm += this.riskEngine.haversineDistanceM(
            p.coords[i][0], p.coords[i][1],
            p.coords[i+1][0], p.coords[i+1][1]
          ) / 1000.0;
        }
      }
    });

    const unverifiedCount = pipes.filter(p => p.verification_status && (p.verification_status.includes('Unverified') || p.verification_status.includes('Estimated'))).length;
    const unverifiedPct = Math.round((unverifiedCount / (pipes.length || 1)) * 100);

    // Update KPI Elements
    const netKmElem = document.getElementById('kpi-net-km');
    if (netKmElem) netKmElem.textContent = `${Math.max(12.4, totalKm.toFixed(1))} km`;

    const netSubElem = document.getElementById('kpi-net-sub');
    if (netSubElem) netSubElem.textContent = `${pipes.length} segments · 3 utilities`;

    const highElem = document.getElementById('kpi-high-risk');
    if (highElem) highElem.textContent = stats.highRiskCount;

    const modElem = document.getElementById('kpi-mod-risk');
    if (modElem) modElem.textContent = stats.mediumRiskCount;

    const repElem = document.getElementById('kpi-open-rep');
    if (repElem) repElem.textContent = (this.currentTownData.community_reports || []).length;

    const unverElem = document.getElementById('kpi-unverified');
    if (unverElem) unverElem.textContent = `${unverifiedPct}%`;
  }

  // --------------------------------------------------------------------------
  // Tab / Page Navigation
  // --------------------------------------------------------------------------
  switchPage(pageId) {
    this.activePage = pageId;

    // Update Nav Link styles
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-page') === pageId);
    });

    // Update Page View styles
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.remove('active-page');
    });

    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) targetPage.classList.add('active-page');

    // Trigger map resize when switching to Map tab
    if (pageId === 'map') {
      setTimeout(() => {
        if (this.engineGIS) this.engineGIS.invalidateSize();
        if (this.engine3D) this.engine3D.onResize();
      }, 50);
    }
  }

  // --------------------------------------------------------------------------
  // Map View Controls (2D / 3D, Utility Filters, Base layers)
  // --------------------------------------------------------------------------
  setMapViewMode(mode) {
    this.mapViewMode = mode;
    const mapElem = document.getElementById('leaflet-map');
    const threeElem = document.getElementById('three-container');
    const btn2D = document.getElementById('btn-view-2d');
    const btn3D = document.getElementById('btn-view-3d');

    if (mode === '2d') {
      mapElem.style.display = 'block';
      threeElem.style.display = 'none';
      btn2D.classList.add('active');
      btn3D.classList.remove('active');
      if (this.engineGIS) this.engineGIS.invalidateSize();
    } else {
      mapElem.style.display = 'none';
      threeElem.style.display = 'block';
      btn2D.classList.remove('active');
      btn3D.classList.add('active');
      if (this.engine3D) this.engine3D.onResize();
    }
  }

  toggleUtilityFilter(primaryType) {
    let typesToToggle = [primaryType];
    if (primaryType === 'water_main') typesToToggle.push('water_distribution');

    const currentlyActive = this.utilityFilters[primaryType];
    const newState = !currentlyActive;

    typesToToggle.forEach(t => {
      this.utilityFilters[t] = newState;
      if (this.engineGIS) this.engineGIS.setLayerFilter(t, newState);
    });

    // Update button visual
    const btnId = primaryType === 'water_main' ? 'btn-toggle-water' :
                  primaryType === 'sewer_gravity' ? 'btn-toggle-sewer' : 'btn-toggle-cable';
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.className = newState ? 'hud-btn active' : 'hud-btn off';
    }
  }

  setMapBase(baseType) {
    this.activeMapBase = baseType;

    ['sat', 'terr', 'dark'].forEach(b => {
      const btn = document.getElementById(`btn-base-${b}`);
      if (btn) btn.classList.remove('active');
    });

    if (baseType === 'hybrid') document.getElementById('btn-base-sat').classList.add('active');
    else if (baseType === 'terrain') document.getElementById('btn-base-terr').classList.add('active');
    else document.getElementById('btn-base-dark').classList.add('active');

    if (this.engineGIS) {
      if (typeof this.engineGIS.setMapType === 'function') {
        this.engineGIS.setMapType(baseType);
      } else if (typeof this.engineGIS.setBaseMap === 'function') {
        this.engineGIS.setBaseMap(baseType);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Pipe Selection & Inspector Panel
  // --------------------------------------------------------------------------
  selectPipe(pipeId) {
    const pipe = this.currentTownData.pipes.find(p => p.id === pipeId);
    if (!pipe) return;

    this.selectedPipe = pipe;
    const risk = this.riskResults.byPipeId[pipe.id] || { totalScore: 30, tier: 'low', factors: {}, primaryFactors: [] };
    const meta = UTILITY_METADATA[pipe.utilityType] || { label: 'Utility Conduit', authority: 'Municipal Corporation' };

    // Highlight on 2D and 3D
    if (this.engineGIS) this.engineGIS.selectPipe(pipeId);
    if (this.engine3D) this.engine3D.highlightPipe(pipeId);

    // Populate Slide-out Panel
    document.getElementById('panel-pipe-type').textContent = meta.label;
    document.getElementById('panel-pipe-type').style.color = meta.color;
    document.getElementById('panel-pipe-name').textContent = pipe.name;
    document.getElementById('panel-pipe-id').textContent = pipe.id;

    const scoreElem = document.getElementById('panel-risk-score');
    scoreElem.textContent = `${risk.totalScore}/100`;
    scoreElem.style.color = risk.hexColor;

    const badgeElem = document.getElementById('panel-risk-badge');
    badgeElem.className = risk.tierBadgeClass;
    badgeElem.textContent = `${risk.tier.toUpperCase()} RISK`;

    document.getElementById('panel-pipe-depth').textContent = `${pipe.depth_m} meters`;
    document.getElementById('panel-pipe-dia').textContent = `${pipe.diameter_mm} mm`;
    document.getElementById('panel-pipe-mat').textContent = pipe.material;
    document.getElementById('panel-pipe-year').textContent = `${pipe.install_year} (${2024 - pipe.install_year} yrs)`;
    document.getElementById('panel-pipe-slope').textContent = `${pipe.slope_deg}° Incline`;
    document.getElementById('panel-pipe-pres').textContent = pipe.operating_pressure_bar ? `${pipe.operating_pressure_bar} bar` : 'Atmospheric';

    document.getElementById('panel-pipe-source').textContent = pipe.data_source;
    document.getElementById('panel-pipe-status').textContent = pipe.verification_status;
    document.getElementById('panel-pipe-auth').textContent = meta.authority;
    document.getElementById('panel-pipe-directive').textContent = risk.inspectionRecommendation;

    // Show Panel
    document.getElementById('map-pipe-panel').classList.add('open');
  }

  closePipeDetailPanel() {
    document.getElementById('map-pipe-panel').classList.remove('open');
    this.selectedPipe = null;
    if (this.engine3D) this.engine3D.clearSelection();
  }

  // --------------------------------------------------------------------------
  // PAGE 3: Citizen Reports Feed
  // --------------------------------------------------------------------------
  renderReportsPage() {
    const container = document.getElementById('reports-cards-grid');
    if (!container) return;

    container.innerHTML = '';
    const reports = this.currentTownData.community_reports || [];

    if (reports.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#64748b;">No citizen reports logged for this area.</div>`;
      return;
    }

    reports.forEach(rep => {
      const card = document.createElement('div');
      card.className = 'report-card';

      let sevClass = rep.severity === 'critical' ? 'badge-high' : rep.severity === 'high' ? 'badge-high' : 'badge-mod';
      let icon = rep.type === 'wet_patch' ? '💧' : rep.type === 'road_subsidence' ? '⚠️' : rep.type === 'low_pressure' ? '📉' : '⚡';

      card.innerHTML = `
        <div class="report-card-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">${icon}</span>
            <div>
              <div class="report-title-text">${rep.title}</div>
              <div style="font-size:11px; color:#94a3b8;">${rep.hindi_title || ''}</div>
            </div>
          </div>
          <span class="${sevClass}">${rep.severity.toUpperCase()}</span>
        </div>

        <div class="report-desc-box">
          "${rep.description}"
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#64748b; font-family:monospace;">
          <span>📍 Lat: ${rep.lat.toFixed(4)}, Lng: ${rep.lng.toFixed(4)}</span>
          <span style="color:#38bdf8; font-weight:bold;">${rep.status}</span>
        </div>

        <div style="font-size:11px; color:#94a3b8; border-top:1px solid rgba(51,65,85,0.4); padding-top:8px;">
          <strong>Action: </strong><em>${rep.action_required}</em>
        </div>
      `;

      container.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // PAGE 4: Records Table & Search
  // --------------------------------------------------------------------------
  renderRecordsTable() {
    const tbody = document.getElementById('records-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    const pipes = this.currentTownData.pipes || [];
    const countElem = document.getElementById('records-count-text');
    if (countElem) countElem.textContent = pipes.length;

    const townElem = document.getElementById('records-town-name');
    if (townElem) townElem.textContent = this.currentTownData.name;

    pipes.forEach(pipe => {
      const risk = this.riskResults ? (this.riskResults.byPipeId[pipe.id] || { totalScore: 30, tier: 'low' }) : { totalScore: 30, tier: 'low' };
      const tr = document.createElement('tr');
      tr.id = `rec-row-${pipe.id}`;

      let riskBadge = risk.tier === 'high' ? 'badge-high' : risk.tier === 'medium' ? 'badge-mod' : 'badge-low';

      tr.innerHTML = `
        <td style="font-family:monospace; color:#38bdf8; font-weight:700;">${pipe.id}</td>
        <td><strong>${pipe.name}</strong></td>
        <td><span style="color:${UTILITY_METADATA[pipe.utilityType].color}; font-weight:600;">${UTILITY_METADATA[pipe.utilityType].label}</span></td>
        <td>${pipe.depth_m}m</td>
        <td>${pipe.diameter_mm}mm</td>
        <td>${pipe.material}</td>
        <td>${pipe.install_year} (${2024 - pipe.install_year} yrs)</td>
        <td><span class="${riskBadge}">${risk.totalScore}/100</span></td>
        <td><span style="font-size:11px; color:${pipe.verification_status.includes('Unverified')?'#f59e0b':'#10b981'};">${pipe.verification_status}</span></td>
        <td>
          <button style="background:#0284c7; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;" onclick="window.app.jumpToPipeOnMap('${pipe.id}')">
            View on Map →
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  filterRecordsTable() {
    const query = (document.getElementById('records-search').value || '').toLowerCase();
    const rows = document.querySelectorAll('#records-table-body tr');

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }

  jumpToPipeOnMap(pipeId) {
    this.switchPage('map');
    this.selectPipe(pipeId);
  }

  // --------------------------------------------------------------------------
  // Modals (Report Incident & Excavation Safe Dig)
  // --------------------------------------------------------------------------
  openCommunityReportModal() {
    const modal = document.getElementById('report-modal');
    modal.classList.add('open');

    if (this.currentTownData) {
      document.getElementById('rep-lat').value = this.currentTownData.center[0].toFixed(5);
      document.getElementById('rep-lng').value = this.currentTownData.center[1].toFixed(5);
    }
  }

  closeCommunityReportModal() {
    document.getElementById('report-modal').classList.remove('open');
  }

  submitCommunityReport() {
    const title = document.getElementById('rep-title').value || 'Citizen Anomaly Flag';
    const type = document.getElementById('rep-type').value;
    const severity = document.getElementById('rep-severity').value;
    const lat = parseFloat(document.getElementById('rep-lat').value);
    const lng = parseFloat(document.getElementById('rep-lng').value);
    const desc = document.getElementById('rep-desc').value;

    const newReport = {
      id: `REP-USR-${Date.now().toString().slice(-4)}`,
      title: title,
      hindi_title: type === 'wet_patch' ? 'सड़क पर पानी का रिसाव' : type === 'road_subsidence' ? 'सड़क धसना / गड्ढा' : 'जल दबाव समस्या',
      type: type,
      lat: lat,
      lng: lng,
      elevation: this.currentTownData.elevation,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reported_by: 'Citizen / Field Inspector (Live Submission)',
      severity: severity,
      description: desc,
      status: 'Logged & AI Recalculated',
      action_required: 'Priority Ground Verification Scheduled',
      photo: './wet_patch_manali.svg'
    };

    this.currentTownData.community_reports.unshift(newReport);
    this.evaluateAndRender();
    this.closeCommunityReportModal();

    alert(`✅ Ground Incident Logged!\n\nTerraFlow AI has recalculated vulnerability scores for all pipelines near (${lat.toFixed(4)}, ${lng.toFixed(4)}).`);
  }

  openDigSafetyModal() {
    document.getElementById('dig-modal').classList.add('open');
    const lat = this.selectedPipe ? this.selectedPipe.coords[0][0] : this.currentTownData.center[0];
    const lng = this.selectedPipe ? this.selectedPipe.coords[0][1] : this.currentTownData.center[1];

    document.getElementById('dig-lat').value = lat.toFixed(5);
    document.getElementById('dig-lng').value = lng.toFixed(5);
    this.runExcavationCheckAt(lat, lng);
  }

  closeDigSafetyModal() {
    document.getElementById('dig-modal').classList.remove('open');
  }

  recalcDigCheck() {
    const lat = parseFloat(document.getElementById('dig-lat').value);
    const lng = parseFloat(document.getElementById('dig-lng').value);
    this.runExcavationCheckAt(lat, lng);
  }

  runExcavationCheckAt(lat, lng) {
    const radiusM = parseFloat(document.getElementById('dig-radius').value || 40);
    const depthM = parseFloat(document.getElementById('dig-depth').value || 1.8);
    const title = document.getElementById('dig-project-title').value || 'Road Trenching Works';

    const result = this.digSafetyEngine.evaluateExcavationSite(
      {
        centerLat: lat,
        centerLng: lng,
        radiusM: radiusM,
        targetDepthM: depthM,
        projectTitle: title,
        contractorName: 'PWD Road Contractor'
      },
      this.currentTownData.pipes,
      this.riskResults,
      this.currentTownData.emergency_contacts
    );

    this.renderDigCheckResults(result);
    if (this.engineGIS) this.engineGIS.setExcavationMarker(lat, lng, radiusM);
  }

  renderDigCheckResults(res) {
    const container = document.getElementById('dig-results-body');
    if (!container) return;

    let bannerBadge = res.protocolStatus === 'HIGH_RISK_VERIFY_FIRST' ? 'badge-high' :
                      res.protocolStatus === 'CLEAR' ? 'badge-low' : 'badge-mod';

    let html = `
      <div style="background:#0b1528; border:1px solid #1e293b; padding:12px; border-radius:10px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span class="${bannerBadge}">${res.protocolStatus.replace(/_/g, ' ')}</span>
          <span style="font-size:11px; color:#94a3b8;">Max Risk: <strong style="color:#ef4444;">${res.highestRiskScore}/100</strong></span>
        </div>
        <p style="font-size:12px; color:#f8fafc; font-weight:700; margin-top:4px;">${res.summaryHeadline}</p>
        <p style="font-size:11px; color:#38bdf8; margin-top:2px;">${res.permitRecommendation}</p>
      </div>

      <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#94a3b8; margin-bottom:6px;">
        Subsurface Utilities in Perimeter (${res.intersectingUtilities.length})
      </div>
    `;

    if (res.intersectingUtilities.length === 0) {
      html += `<p style="font-size:12px; color:#10b981;">No active utilities detected within ${res.excavationRadiusM}m.</p>`;
    } else {
      res.intersectingUtilities.forEach(u => {
        html += `
          <div style="background:#111b27; border:1px solid #1e293b; border-left:3px solid ${u.depthConflict ? '#ef4444' : '#10b981'}; padding:8px 10px; border-radius:6px; margin-bottom:6px; font-size:11px;">
            <div style="display:flex; justify-content:space-between;">
              <strong style="color:#fff;">${u.name}</strong>
              <span style="color:#f59e0b;">Depth: ${u.depthM}m (Conflict: ${u.depthConflict ? 'YES' : 'No'})</span>
            </div>
            <div style="color:#64748b; margin-top:2px;">
              ${u.pipeId} | Material: ${u.material} | Risk: ${u.riskScore}/100
            </div>
            <div style="color:#38bdf8; margin-top:2px;">
              Department: <strong>${u.authority}</strong>
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = html;
  }

  showReportDetails(report) {
    alert(`📍 Ground Incident: ${report.title}\n\n• Date: ${report.date}\n• Severity: ${report.severity.toUpperCase()}\n• Description: "${report.description}"\n• Action: ${report.action_required}`);
  }

  // --------------------------------------------------------------------------
  // Event Bindings
  // --------------------------------------------------------------------------
  bindEvents() {
    const townSelect = document.getElementById('town-select');
    if (townSelect) {
      townSelect.addEventListener('change', (e) => {
        this.loadTown(e.target.value);
      });
    }
  }
}

// Global Launcher
window.addEventListener('DOMContentLoaded', () => {
  window.app = new TerraFlowApp();
  window.app.init();
});
