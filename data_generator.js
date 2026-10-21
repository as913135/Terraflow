/**
 * TerraFlow - Universal Area / Custom Map Subsurface Data Generator
 * Allows TerraFlow to connect to ANY mountain town or custom map coordinates
 * Automatically synthesizes realistic 3D subsurface infrastructure networks along terrain gradients.
 */

class UniversalHillDataGenerator {
  /**
   * Generates a realistic subterranean utility network for any target coordinates
   * @param {string} townName - Name of the hill town
   * @param {number} centerLat - Latitude
   * @param {number} centerLng - Longitude
   * @param {number} baseElevation - Base elevation AMSL in meters (default 2000m)
   * @param {number} radiusKm - Coverage radius (default 1.2km)
   * @param {number} pipeCount - Desired number of pipe segments (default 24)
   */
  static generateForLocation(townName, centerLat, centerLng, baseElevation = 2050, radiusKm = 1.0, pipeCount = 20) {
    const utilityTypes = [
      'water_main', 'water_distribution', 'sewer_gravity', 
      'electric_11kv', 'telecom_fiber', 'stormwater_nullah'
    ];
    
    const materials = {
      water_main: ['Cast Iron', 'Ductile Iron (K9)', 'HDPE (PN16)', 'Galvanized Iron'],
      water_distribution: ['HDPE (PN10)', 'Galvanized Iron', 'PVC'],
      sewer_gravity: ['Reinforced Concrete (RCC)', 'Rigid PVC (SN8)', 'Corrugated HDPE'],
      electric_11kv: ['XLPE Armoured Copper', 'High Voltage Armoured Aluminium'],
      telecom_fiber: ['Multi-Duct HDPE Optical Fiber', 'Direct Buried Armoured OFC'],
      stormwater_nullah: ['Dressed Stone Masonry', 'Concrete Box Culvert']
    };

    const sources = [
      'State Jal Shakti Vibhag (IPH) Blueprint',
      'PWD Municipal Road Division Records (1988)',
      'Contractor As-Built Utility Survey (2019)',
      'Smart City Subsurface GPR / LiDAR Scan',
      'Legacy Hand-Drawn Field Diary (Unverified)'
    ];

    const verificationStatuses = [
      'Verified (High Confidence)',
      'Partially Verified (Field Potholed)',
      'Unverified (Legacy Records)',
      'Estimated (Hydraulic Model)'
    ];

    // Generate corridors radiating and curving across hill slopes
    const pipes = [];
    const corridors = [
      { angle: 30, length: 0.007, name: 'North Ridge Trunk' },
      { angle: 75, length: 0.006, name: 'Eastern Valley Feeder' },
      { angle: 135, length: 0.008, name: 'South Hillside Arterial' },
      { angle: 210, length: 0.007, name: 'Southwest Market Conduit' },
      { angle: 285, length: 0.009, name: 'Upper Forest Access Line' },
      { angle: 340, length: 0.006, name: 'Temple Incline Branch' }
    ];

    let pipeIdCounter = 1;

    corridors.forEach((corridor, cIdx) => {
      // Create multi-segment path
      const segCount = 4;
      const angleRad = (corridor.angle * Math.PI) / 180;
      
      const pts = [];
      let curLat = centerLat;
      let curLng = centerLng;
      let curElev = baseElevation;

      for (let s = 0; s <= segCount; s++) {
        const step = (corridor.length / segCount);
        // Add mountain curve jitter
        const curveJitterLat = (Math.sin(s * 1.5) * 0.0006);
        const curveJitterLng = (Math.cos(s * 1.5) * 0.0006);
        
        const ptLat = centerLat + Math.cos(angleRad) * (step * s) + curveJitterLat;
        const ptLng = centerLng + Math.sin(angleRad) * (step * s) + curveJitterLng;
        // Hill altitude drops down slopes or rises up ridge
        const elevChange = Math.cos(angleRad) > 0 ? (s * 22) : -(s * 28);
        pts.push([ptLat, ptLng, Math.round(baseElevation + elevChange)]);
      }

      // Along this corridor, add water, sewer, power and fiber at varied depths!
      const utilsForCorridor = [
        { type: 'water_main', depth: 1.3, dia: 250 },
        { type: 'sewer_gravity', depth: 2.6, dia: 350 },
        { type: 'electric_11kv', depth: 0.8, dia: 80 },
        { type: 'telecom_fiber', depth: 0.6, dia: 50 }
      ];

      utilsForCorridor.forEach(u => {
        const matList = materials[u.type] || ['Ductile Iron'];
        const chosenMat = matList[Math.floor(Math.random() * matList.length)];
        const installYear = 1978 + Math.floor(Math.random() * 45); // 1978 - 2023
        const slopeDeg = 15 + Math.floor(Math.random() * 22); // 15 - 37 deg
        const pastRepairs = Math.max(0, Math.floor((2024 - installYear) / 8 + (Math.random() * 3 - 1)));
        const vStatus = verificationStatuses[Math.floor(Math.random() * verificationStatuses.length)];
        const confPct = vStatus.startsWith('Verified') ? (85 + Math.floor(Math.random() * 12)) :
                        vStatus.startsWith('Partially') ? (60 + Math.floor(Math.random() * 20)) :
                        (30 + Math.floor(Math.random() * 25));

        // Offset utility slightly parallel to road corridor
        const latOffset = (Math.random() - 0.5) * 0.0002;
        const lngOffset = (Math.random() - 0.5) * 0.0002;

        const offsetCoords = pts.map(p => [
          p[0] + latOffset,
          p[1] + lngOffset,
          p[2]
        ]);

        const prefix = u.type === 'water_main' ? 'WTR' :
                       u.type === 'sewer_gravity' ? 'SWR' :
                       u.type === 'electric_11kv' ? 'PWR' : 'TEL';

        pipes.push({
          id: `GEN-${prefix}-${String(pipeIdCounter++).padStart(3, '0')}`,
          name: `${corridor.name} - ${u.type.replace('_', ' ').toUpperCase()}`,
          zone: corridor.name,
          utilityType: u.type,
          diameter_mm: u.dia,
          depth_m: u.depth,
          material: chosenMat,
          install_year: installYear,
          slope_deg: slopeDeg,
          soil_type: slopeDeg > 28 ? 'Steep Fractured Colluvium Scree' : 'Weathered Mica Silt & Fill',
          past_repairs_count: pastRepairs,
          last_repair_date: pastRepairs > 0 ? `202${Math.floor(Math.random()*4)}-0${1+Math.floor(Math.random()*9)}-15` : 'None',
          operating_pressure_bar: u.type.startsWith('water') ? +(3.5 + (slopeDeg / 6)).toFixed(1) : 0,
          data_source: sources[Math.floor(Math.random() * sources.length)],
          verification_status: vStatus,
          confidence_pct: confPct,
          connected_consumers: 40 + Math.floor(Math.random() * 220),
          traffic_load: corridor.angle < 90 ? 'High' : 'Moderate',
          coords: offsetCoords
        });
      });
    });

    // Generate Manholes
    const manholes = [];
    pipes.filter(p => p.utilityType === 'sewer_gravity' || p.utilityType === 'water_main').slice(0, 6).forEach((p, idx) => {
      const midPt = p.coords[Math.floor(p.coords.length / 2)];
      manholes.push({
        id: `GEN-MH-${100 + idx}`,
        name: `${p.name} Access Chamber`,
        utilityType: p.utilityType,
        lat: midPt[0],
        lng: midPt[1],
        depth_m: p.depth_m,
        status: idx % 2 === 0 ? 'Clear / Operational' : 'Scheduled Silt Flushing'
      });
    });

    // Sample Community Report
    const sampleReport = {
      id: `REP-GEN-001`,
      title: `Surface Water Seepage reported near ${corridors[0].name}`,
      hindi_title: `सड़क पर पानी का रिसाव व नमी देखी गई`,
      type: 'wet_patch',
      lat: centerLat + 0.0012,
      lng: centerLng + 0.0015,
      elevation: baseElevation - 10,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reported_by: 'Local Taxi Union & Residents',
      severity: 'high',
      description: 'Persistent water flow observed trickling over road edge on steep incline.',
      status: 'Auto-Flagged by TerraFlow AI',
      action_required: 'Ground Verification & Inspection required before excavation',
      photo: './wet_patch_manali.svg',
      nearest_pipe_id: pipes[0].id
    };

    return {
      id: townName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: townName,
      state: 'Mountain Terrain (Custom Area)',
      center: [centerLat, centerLng],
      elevation: baseElevation,
      avgSlope: 25.0,
      rainfall_24h: 40,
      soil_risk: 'High (Mountain Slope / Colluvium)',
      jurisdiction: 'Municipal Council & State Jal Shakti Vibhag',
      emergency_contacts: [
        { name: 'Water & Sewerage Hotline', phone: '1916 / 1800-180', role: 'Municipal Water Works' },
        { name: 'State Electricity Disaster Call', phone: '1912', role: 'Underground Cable Clearance' },
        { name: 'Local Public Works (PWD)', phone: '0177-100000', role: 'Road Opening Permits' }
      ],
      zones: corridors.map(c => ({ id: c.name.toLowerCase().replace(/ /g, '_'), name: c.name, critical: true, desc: 'Active corridor' })),
      pipes: pipes,
      manholes: manholes,
      community_reports: [sampleReport]
    };
  }
}
