/**
 * TerraFlow - "Check Before You Dig" Subsurface Conflict & Permit Advisory Engine
 * 
 * Protects hill town infrastructure from excavation strikes (pipe bursting, electrical accidents, road collapses).
 * Conducts 3D spatial collision checking between planned excavation corridor and mapped subsurface utilities.
 * Generates utility clearance checklists, required department contacts, and non-destructive excavation protocols.
 * 
 * DISCLAIMER: TerraFlow provides advisory conflict detection based on available and synthetic records.
 * TerraFlow does NOT issue legal permits or certify site safety. Official sign-off must be obtained from PWD & utility owners.
 */

class TerraFlowDigSafetyEngine {
  constructor(riskEngine) {
    this.riskEngine = riskEngine;
  }

  /**
   * Evaluates excavation site safety
   * @param {Object} excavationParams - { centerLat, centerLng, radiusM, targetDepthM, projectTitle, contractorName, notes }
   * @param {Array} townPipes - Array of pipe objects
   * @param {Object} riskResults - Precomputed risk results from TerraFlowRiskEngine
   * @param {Array} emergencyContacts - Official utility contacts
   */
  evaluateExcavationSite(excavationParams, townPipes, riskResults, emergencyContacts = []) {
    const {
      centerLat,
      centerLng,
      radiusM = 40,
      targetDepthM = 1.8,
      projectTitle = 'Road Resurfacing & Drainage Works',
      contractorName = 'Himachal Infrastructure Ltd'
    } = excavationParams;

    const intersectingUtilities = [];
    let highestRiskScore = 0;
    let criticalDangerFound = false;
    let unverifiedUtilityFound = false;

    townPipes.forEach(pipe => {
      const minDistanceM = this.riskEngine.getMinDistanceToPipe(centerLat, centerLng, pipe.coords);
      
      // If within buffer zone
      if (minDistanceM <= radiusM) {
        const riskData = riskResults.byPipeId[pipe.id] || { totalScore: 30, tier: 'low' };
        if (riskData.totalScore > highestRiskScore) {
          highestRiskScore = riskData.totalScore;
        }

        const depthDeltaM = Number((pipe.depth_m - targetDepthM).toFixed(2));
        const depthConflict = targetDepthM >= pipe.depth_m || Math.abs(pipe.depth_m - targetDepthM) < 0.5;

        const isUnverified = pipe.verification_status.includes('Unverified') || pipe.verification_status.includes('Estimated');
        if (isUnverified) unverifiedUtilityFound = true;

        if (pipe.utilityType === 'electric_11kv' || riskData.tier === 'high') {
          criticalDangerFound = true;
        }

        intersectingUtilities.push({
          pipeId: pipe.id,
          name: pipe.name,
          utilityType: pipe.utilityType,
          material: pipe.material,
          depthM: pipe.depth_m,
          depthConflict,
          depthDeltaM, // negative means digging deeper than pipe!
          distanceFromCenterM: Math.round(minDistanceM),
          verificationStatus: pipe.verification_status,
          dataSource: pipe.data_source,
          confidencePct: pipe.confidence_pct,
          riskScore: riskData.totalScore,
          riskTier: riskData.tier,
          operatingPressureBar: pipe.operating_pressure_bar,
          authority: this.getAuthorityForUtility(pipe.utilityType)
        });
      }
    });

    // Sort by depth conflict and risk
    intersectingUtilities.sort((a, b) => b.riskScore - a.riskScore);

    // Formulate Clearance Recommendation & Protocol
    let protocolStatus = 'STANDARD_CAUTION';
    let summaryHeadline = '';
    let permitRecommendation = '';

    if (intersectingUtilities.length === 0) {
      protocolStatus = 'CLEAR';
      summaryHeadline = 'No underground utilities detected within selected excavation perimeter';
      permitRecommendation = 'Proceed with standard PWD excavation guidelines. Maintain vigilant observation for unrecorded lateral service connections.';
    } else if (criticalDangerFound || unverifiedUtilityFound || highestRiskScore >= 70) {
      protocolStatus = 'HIGH_RISK_VERIFY_FIRST';
      summaryHeadline = `CRITICAL WARNING: ${intersectingUtilities.length} subsurface conduits detected in trench zone with High Risk / Unverified lines!`;
      permitRecommendation = 'MANDATORY PRE-DIG VERIFICATION: Do NOT use mechanical excavators (JCB/backhoe) without manual potholing. Prior written NOC required from Jal Shakti Vibhag and HPSEBL.';
    } else {
      protocolStatus = 'MODERATE_CAUTION';
      summaryHeadline = `CAUTION: ${intersectingUtilities.length} active subsurface utilities present within excavation corridor.`;
      permitRecommendation = 'Perform hand exploration within 1.0m of marked coordinates. Notify utility watch officers 24 hours prior to commencement.';
    }

    // Required Departmental NOCs (No Objection Certificates)
    const requiredNOCs = [];
    const authoritiesPresent = new Set(intersectingUtilities.map(u => u.authority));

    authoritiesPresent.forEach(auth => {
      const contactMatch = emergencyContacts.find(c => c.role.includes(auth.split(' ')[0])) || {
        name: auth,
        phone: 'Check Municipal Directory',
        role: auth
      };
      requiredNOCs.push({
        department: auth,
        contact: contactMatch.phone,
        contactPerson: contactMatch.name,
        status: 'Action Required Before Digging',
        requiredAction: `Verify alignment of buried lines within ${radiusM}m corridor`
      });
    });

    // Generate Step-by-Step Dig Safe Checklist
    const safetyChecklist = [
      {
        step: 1,
        title: 'Surface Ground Truthing & Paint Marking',
        desc: 'Mark physical ground surface with APWA color-coded spray paint for all detected conduits.',
        done: false
      },
      {
        step: 2,
        title: 'Utility Owner Verification & Site Briefing',
        desc: `Contact representatives from: ${Array.from(authoritiesPresent).join(', ') || 'PWD Division'}. Request field inspector presence.`,
        done: false
      },
      {
        step: 3,
        title: 'Non-Destructive Vacuum / Hand Potholing',
        desc: 'Excavate manual inspection pits by hand shovel or air vacuum to expose exact pipe depth before using hydraulic backhoe.',
        done: false
      },
      {
        step: 4,
        title: 'Maintain 0.5m Machine Exclusion Buffer',
        desc: 'Mechanical excavator buckets must maintain a minimum 500mm safety clearance from all pressurized water and 11kV cables.',
        done: false
      },
      {
        step: 5,
        title: 'Emergency Response Contingency Standby',
        desc: `Keep isolation valve keys and contact ${emergencyContacts[0] ? emergencyContacts[0].phone : '112'} on speed dial during operations.`,
        done: false
      }
    ];

    return {
      protocolStatus,
      summaryHeadline,
      permitRecommendation,
      projectTitle,
      contractorName,
      targetDepthM,
      excavationRadiusM: radiusM,
      intersectingUtilities,
      requiredNOCs,
      safetyChecklist,
      criticalDangerFound,
      unverifiedUtilityFound,
      highestRiskScore,
      assessedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
  }

  getAuthorityForUtility(type) {
    if (type.startsWith('water')) return 'Jal Shakti Vibhag (IPH)';
    if (type.startsWith('sewer')) return 'Municipal Sanitation / PWD';
    if (type.startsWith('electric')) return 'HPSEBL Electricity Board';
    if (type.startsWith('telecom')) return 'Telecom Utility (BSNL/Private OFC)';
    return 'HP PWD Division';
  }
}
