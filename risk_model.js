/**
 * TerraFlow - AI Subsurface Risk Prediction Engine
 * Predicts pipeline vulnerability and inspection priority scores (0 - 100) WITHOUT any IoT hardware or sensors!
 * 
 * Multi-Factor Explainable Algorithm:
 * 1. Material & Age degradation curve
 * 2. Terrain Slope / Hill gradient shear stress
 * 3. Monsoon precipitation / soil moisture saturation index
 * 4. Historical repair / freeze-thaw fatigue history
 * 5. Dynamic proximity to crowdsourced community reports (wet patches, pressure drops, subsidence)
 * 6. Legacy data verification confidence penalty
 * 
 * DISCLAIMER: Predicts inspection priority; does not confirm leaks or certify excavation safety.
 */

class TerraFlowRiskEngine {
  constructor() {
    // Environmental modifiers (can be updated via live UI sliders)
    this.currentRainfallMm = 52;     // 24-hr rainfall in mm
    this.soilSaturationPct = 65;     // 0 - 100%
    this.freezeThawActive = false;   // Winter freeze burst factor
    this.citizenProximityBufferM = 65; // meters radius around report
  }

  setEnvironmentalConditions(rainfallMm, soilSaturationPct, freezeThawActive = false) {
    this.currentRainfallMm = Number(rainfallMm);
    this.soilSaturationPct = Number(soilSaturationPct);
    this.freezeThawActive = Boolean(freezeThawActive);
  }

  /**
   * Calculates comprehensive AI Risk Score for a single pipe segment
   * @param {Object} pipe - Pipe object
   * @param {Array} communityReports - Active community reports for the town
   * @returns {Object} Full explainable risk assessment
   */
  assessPipeRisk(pipe, communityReports = []) {
    const currentYear = 2024;
    const age = Math.max(0, currentYear - (pipe.install_year || 2000));

    // 1. AGE & MATERIAL DEGRADATION SCORE (Max 25 pts)
    const materialVulnerability = {
      'Cast Iron': 0.95,
      'Cast Iron (British Colonial Era)': 1.0,
      'Galvanized Iron': 0.85,
      'Reinforced Concrete (RCC Class NP3)': 0.70,
      'Reinforced Concrete (RCC)': 0.70,
      'Glazed Stoneware & Concrete': 0.80,
      'PVC Rigid (SN8)': 0.50,
      'PVC': 0.50,
      'Corrugated HDPE Double Wall Pipe': 0.35,
      'HDPE (PN10)': 0.25,
      'HDPE (PN16)': 0.22,
      'Ductile Iron (K9 with Zinc Coating)': 0.20,
      'Ductile Iron Class K9': 0.20,
      'Ductile Iron': 0.20,
      'XLPE Insulated Armoured High-Tension Cable': 0.40,
      'PVC Conduit Armoured Copper': 0.45,
      'Armoured Copper XLPE Conduit': 0.35,
      'Multi-Duct HDPE Optical Fiber Conduits (24-Core)': 0.30,
      'Direct Buried Microduct Fiber': 0.35,
      'Dressed Stone Masonry with Concrete Invert': 0.65
    };

    const matFactor = materialVulnerability[pipe.material] !== undefined ? materialVulnerability[pipe.material] : 0.50;
    // Normalized age curve (40+ years reaches ceiling)
    const ageFactor = Math.min(1.0, age / 40.0);
    const scoreAgeMaterial = Number((25 * (matFactor * 0.6 + ageFactor * 0.4)).toFixed(1));

    // 2. SLOPE & TERRAIN SHEAR STRESS SCORE (Max 20 pts)
    // Mountain slopes > 20 deg experience soil creep and high joint tension
    const slopeDeg = pipe.slope_deg || 15;
    const slopeFactor = Math.min(1.0, slopeDeg / 38.0);
    const scoreSlope = Number((20 * slopeFactor).toFixed(1));

    // 3. MONSOON PRECIPITATION & SOIL SATURATION (Max 20 pts)
    // Heavy rain (0 - 100mm) creates pore pressure and slope liquefaction
    const rainFactor = Math.min(1.0, this.currentRainfallMm / 90.0);
    const satFactor = this.soilSaturationPct / 100.0;
    let scoreRainfall = (20 * (rainFactor * 0.65 + satFactor * 0.35));
    if (this.freezeThawActive) {
      scoreRainfall = Math.min(20, scoreRainfall * 1.25);
    }
    scoreRainfall = Number(scoreRainfall.toFixed(1));

    // 4. HISTORICAL REPAIR FATIGUE & OPERATING PRESSURE (Max 15 pts)
    const pastRepairs = pipe.past_repairs_count || 0;
    const repairScoreFactor = Math.min(1.0, pastRepairs / 5.0);
    const pressureScoreFactor = pipe.operating_pressure_bar ? Math.min(1.0, pipe.operating_pressure_bar / 8.0) : 0.2;
    const scoreRepairs = Number((15 * (repairScoreFactor * 0.7 + pressureScoreFactor * 0.3)).toFixed(1));

    // 5. NEARBY COMMUNITY REPORTS IMPACT (Max 15 pts)
    let scoreCommunity = 0;
    const matchingReports = [];

    if (communityReports && communityReports.length > 0 && pipe.coords && pipe.coords.length > 0) {
      communityReports.forEach(rep => {
        // Compute minimum distance from report to any vertex in pipe coords
        const minDistM = this.getMinDistanceToPipe(rep.lat, rep.lng, pipe.coords);
        if (minDistM <= this.citizenProximityBufferM) {
          matchingReports.push({
            reportId: rep.id,
            title: rep.title,
            type: rep.type,
            distanceM: Math.round(minDistM),
            severity: rep.severity
          });

          let weight = 8;
          if (rep.type === 'wet_patch') weight = 13;
          else if (rep.type === 'road_subsidence') weight = 15;
          else if (rep.type === 'low_pressure') weight = 10;
          else if (rep.type === 'exposed_conduit') weight = 14;

          // Severity multiplier
          const sevMult = rep.severity === 'critical' ? 1.0 : rep.severity === 'high' ? 0.85 : 0.65;
          const distDecay = Math.max(0.2, 1 - (minDistM / this.citizenProximityBufferM));
          const added = weight * sevMult * distDecay;
          scoreCommunity = Math.max(scoreCommunity, added);
        }
      });
    }
    scoreCommunity = Number(Math.min(15, scoreCommunity).toFixed(1));

    // 6. LEGACY RECORD VERIFICATION UNCERTAINTY PENALTY (Max 5 pts)
    let scoreUncertainty = 0;
    if (pipe.verification_status && pipe.verification_status.includes('Unverified')) {
      scoreUncertainty = 5;
    } else if (pipe.verification_status && pipe.verification_status.includes('Estimated')) {
      scoreUncertainty = 4;
    } else if (pipe.verification_status && pipe.verification_status.includes('Partially')) {
      scoreUncertainty = 2;
    } else {
      scoreUncertainty = 0;
    }

    // TOTAL COMPOSITE RISK SCORE (0 - 100)
    const rawTotal = scoreAgeMaterial + scoreSlope + scoreRainfall + scoreRepairs + scoreCommunity + scoreUncertainty;
    const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

    // Categorization
    let tier = 'low';
    let tierLabel = 'Low Risk (Standard Monitoring)';
    let tierBadgeClass = 'badge-risk-low';
    let hexColor = '#10b981'; // Green

    if (totalScore >= 70) {
      tier = 'high';
      tierLabel = 'High Risk (Pre-Dig Verification Required)';
      tierBadgeClass = 'badge-risk-high';
      hexColor = '#ef4444'; // Red
    } else if (totalScore >= 40) {
      tier = 'medium';
      tierLabel = 'Moderate Risk (Scheduled Inspection Priority)';
      tierBadgeClass = 'badge-risk-medium';
      hexColor = '#f59e0b'; // Amber
    }

    // Generate Natural Language Factors & Inspection Recommendation
    const primaryFactors = [];
    if (age > 25) primaryFactors.push(`Aging Material (${age} yrs old, ${pipe.material})`);
    if (slopeDeg >= 25) primaryFactors.push(`Steep Mountain Incline (${slopeDeg}°) causing joint shear`);
    if (this.currentRainfallMm >= 50) primaryFactors.push(`Monsoon Ground Saturation (${this.currentRainfallMm}mm/24h)`);
    if (pastRepairs >= 3) primaryFactors.push(`Historical Repair Fatigue (${pastRepairs} past bursts)`);
    if (matchingReports.length > 0) {
      const topRep = matchingReports[0];
      primaryFactors.push(`Active Citizen Flag: ${topRep.type.replace('_', ' ')} within ${topRep.distanceM}m`);
    }
    if (scoreUncertainty >= 4) primaryFactors.push('Unverified Legacy Blueprint Record');

    // Tailored Inspection Recommendation
    let inspectionRecommendation = '';
    if (tier === 'high') {
      inspectionRecommendation = pipe.utilityType.startsWith('water')
        ? 'MANDATORY ACTION: Deploy Ground Acoustic Correlator probe before any road excavation. Pothole manually (hand dig) within 1.5m buffer.'
        : pipe.utilityType === 'electric_11kv'
        ? 'DANGER: High-voltage cable in unstable ground. Notify HPSEBL line engineer for test pit clearance before digging.'
        : 'CRITICAL: High failure probability. CCTV camera inspection recommended before monsoon escalation.';
    } else if (tier === 'medium') {
      inspectionRecommendation = 'PRIORITY: Schedule pressure log test or visual inspection chamber walk-through within 14 calendar days.';
    } else {
      inspectionRecommendation = 'ROUTINE: Normal integrity. Follow standard PWD pre-excavation clearance protocol.';
    }

    return {
      pipeId: pipe.id,
      pipeName: pipe.name,
      totalScore,
      tier,
      tierLabel,
      tierBadgeClass,
      hexColor,
      factors: {
        ageMaterial: scoreAgeMaterial,
        slope: scoreSlope,
        rainfall: scoreRainfall,
        repairs: scoreRepairs,
        community: scoreCommunity,
        uncertainty: scoreUncertainty
      },
      ageYears: age,
      slopeDeg,
      primaryFactors,
      matchingReports,
      inspectionRecommendation,
      confidencePct: pipe.confidence_pct || 60,
      disclaimer: 'Inspection prioritization score derived from terrain, environmental and historical indices. Not a guarantee of leak presence or excavation safety certification.'
    };
  }

  /**
   * Helper: Calculates approximate distance from point to polyline in meters
   */
  getMinDistanceToPipe(lat, lng, coords) {
    let minDist = Infinity;
    coords.forEach(pt => {
      const d = this.haversineDistanceM(lat, lng, pt[0], pt[1]);
      if (d < minDist) minDist = d;
    });
    return minDist;
  }

  /**
   * Haversine formula for distance in meters
   */
  haversineDistanceM(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Batch scores all pipes in a town
   */
  evaluateNetwork(pipes, communityReports = []) {
    const results = {};
    const rankedQueue = [];

    pipes.forEach(pipe => {
      const assessment = this.assessPipeRisk(pipe, communityReports);
      results[pipe.id] = assessment;
      rankedQueue.push(assessment);
    });

    // Sort queue by descending risk score
    rankedQueue.sort((a, b) => b.totalScore - a.totalScore);

    const stats = {
      total: rankedQueue.length,
      highRiskCount: rankedQueue.filter(r => r.tier === 'high').length,
      mediumRiskCount: rankedQueue.filter(r => r.tier === 'medium').length,
      lowRiskCount: rankedQueue.filter(r => r.tier === 'low').length,
      avgScore: Math.round(rankedQueue.reduce((acc, curr) => acc + curr.totalScore, 0) / (rankedQueue.length || 1)),
      criticalInspectionIds: rankedQueue.filter(r => r.tier === 'high').map(r => r.pipeId)
    };

    return {
      byPipeId: results,
      inspectionQueue: rankedQueue,
      stats
    };
  }
}
