/**
 * TerraFlow - Subterranean Utility & Infrastructure Datasets
 * Realistically modelled for Himalayan Mountain Towns (Manali, Shimla, Dharamshala, Mussoorie)
 * Includes true elevation profiles, burial depths, materials, legacy records, and verification status.
 */

const TERRAFLOW_TOWNS = {
  manali: {
    id: 'manali',
    name: 'Manali, Himachal Pradesh',
    state: 'Himachal Pradesh',
    center: [32.2396, 77.1887],
    elevation: 2050, // meters AMSL
    avgSlope: 26.5,  // degrees
    rainfall_24h: 52, // mm (simulated current monsoon index)
    soil_risk: 'High (Debris Flow & Scree Slope)',
    jurisdiction: 'Jal Shakti Vibhag (Kullu/Manali Div) & HP PWD Sub-Div',
    emergency_contacts: [
      { name: 'Jal Shakti Vibhag Control Room', phone: '01902-252244', role: 'Water & Sewerage' },
      { name: 'HPSEBL Electrical Substation Manali', phone: '01902-252312', role: '11kV / 22kV Power Lines' },
      { name: 'HP PWD Road Division Manali', phone: '01902-252118', role: 'Road Excavation Permits' },
      { name: 'Disaster Emergency Operations (DEOC Kullu)', phone: '1077', role: 'Disaster & Flash Flood Ops' }
    ],
    zones: [
      { id: 'mall_road', name: 'Mall Road & Bus Stand Hub', critical: true, desc: 'High pedestrian density, commercial hotels' },
      { id: 'old_manali', name: 'Old Manali Heritage Zone', critical: false, desc: 'Steep cobblestone lanes, wooden houses, homestays' },
      { id: 'hadimba_road', name: 'Hadimba Temple Forest Corridor', critical: true, desc: 'Dense deodar forest slope, VIP transit route' },
      { id: 'aleo', name: 'Aleo Left Bank Link', critical: true, desc: 'Beas River flood-plain interface, heavy goods transport' },
      { id: 'circuit_house', name: 'Circuit House & Log Huts', critical: true, desc: 'Steep gradient, government institutional cluster' }
    ],
    pipes: [
      {
        id: 'MNL-WTR-001',
        name: 'Mall Road Potable Feeder Main',
        zone: 'mall_road',
        utilityType: 'water_main',
        diameter_mm: 300,
        depth_m: 1.4,
        material: 'Cast Iron',
        install_year: 1982,
        slope_deg: 14,
        soil_type: 'Glacial Till & Sandstone Fill',
        past_repairs_count: 5,
        last_repair_date: '2023-08-14',
        operating_pressure_bar: 6.8,
        data_source: 'Jal Shakti Vibhag (Kullu Div) 1984 As-Built Blueprint',
        verification_status: 'Unverified (Legacy Records)',
        confidence_pct: 48,
        connected_consumers: 145, // hotels + shops
        traffic_load: 'High',
        coords: [
          [32.2382, 77.1878, 2042],
          [32.2390, 77.1884, 2046],
          [32.2401, 77.1892, 2051],
          [32.2415, 77.1899, 2058]
        ]
      },
      {
        id: 'MNL-WTR-002',
        name: 'Old Manali High-Pressure Gravity Trunk',
        zone: 'old_manali',
        utilityType: 'water_main',
        diameter_mm: 200,
        depth_m: 1.1,
        material: 'Galvanized Iron',
        install_year: 1994,
        slope_deg: 32,
        soil_type: 'Fractured Granite Scree',
        past_repairs_count: 6,
        last_repair_date: '2024-02-18',
        operating_pressure_bar: 8.2,
        data_source: 'Municipal Hand Sketch & Field Ground Truthing',
        verification_status: 'Partially Verified (Field Potholed)',
        confidence_pct: 65,
        connected_consumers: 92,
        traffic_load: 'Moderate',
        coords: [
          [32.2455, 77.1840, 2095],
          [32.2468, 77.1825, 2125],
          [32.2480, 77.1808, 2155],
          [32.2492, 77.1795, 2182]
        ]
      },
      {
        id: 'MNL-WTR-003',
        name: 'Hadimba Forest Branch Feed',
        zone: 'hadimba_road',
        utilityType: 'water_distribution',
        diameter_mm: 150,
        depth_m: 1.2,
        material: 'HDPE (PN10)',
        install_year: 2017,
        slope_deg: 28,
        soil_type: 'Humus Organic Forest Loam on Granite',
        past_repairs_count: 1,
        last_repair_date: '2022-11-05',
        operating_pressure_bar: 4.5,
        data_source: 'Smart City Contractor As-Built GIS (2018)',
        verification_status: 'Verified (High Confidence)',
        confidence_pct: 94,
        connected_consumers: 64,
        traffic_load: 'Moderate',
        coords: [
          [32.2420, 77.1865, 2065],
          [32.2435, 77.1845, 2088],
          [32.2450, 77.1828, 2112],
          [32.2462, 77.1812, 2135]
        ]
      },
      {
        id: 'MNL-SWR-101',
        name: 'Mall Road Deep Gravity Interceptor Sewer',
        zone: 'mall_road',
        utilityType: 'sewer_gravity',
        diameter_mm: 400,
        depth_m: 2.8,
        material: 'Reinforced Concrete (RCC Class NP3)',
        install_year: 1989,
        slope_deg: 12,
        soil_type: 'Alluvial Riverbed Gravel',
        past_repairs_count: 4,
        last_repair_date: '2023-05-20',
        operating_pressure_bar: 1.1,
        data_source: 'PWD Sewerage Project Phase 1 Drawing (1990)',
        verification_status: 'Unverified (Legacy Records)',
        confidence_pct: 52,
        connected_consumers: 210,
        traffic_load: 'Heavy',
        coords: [
          [32.2375, 77.1872, 2038],
          [32.2388, 77.1881, 2043],
          [32.2405, 77.1890, 2050],
          [32.2422, 77.1901, 2060]
        ]
      },
      {
        id: 'MNL-SWR-102',
        name: 'Old Manali Village Stepped Collector Sewer',
        zone: 'old_manali',
        utilityType: 'sewer_gravity',
        diameter_mm: 250,
        depth_m: 2.1,
        material: 'PVC Rigid (SN8)',
        install_year: 2011,
        slope_deg: 35,
        soil_type: 'Steep Colluvium Clayey Boulder',
        past_repairs_count: 3,
        last_repair_date: '2023-09-02',
        operating_pressure_bar: 0.9,
        data_source: 'Municipal Council Manali Sanitation Cell',
        verification_status: 'Partially Verified (Field Potholed)',
        confidence_pct: 72,
        connected_consumers: 88,
        traffic_load: 'Light',
        coords: [
          [32.2460, 77.1835, 2102],
          [32.2472, 77.1818, 2135],
          [32.2485, 77.1802, 2165]
        ]
      },
      {
        id: 'MNL-PWR-201',
        name: 'Circuit House 11kV Armoured Feeder Cable',
        zone: 'circuit_house',
        utilityType: 'electric_11kv',
        diameter_mm: 90,
        depth_m: 0.8,
        material: 'XLPE Insulated Armoured High-Tension Cable',
        install_year: 2005,
        slope_deg: 24,
        soil_type: 'Compacted Road Sub-base',
        past_repairs_count: 2,
        last_repair_date: '2021-06-11',
        operating_pressure_bar: 0,
        data_source: 'HPSEBL Distribution Sub-Division Schematic',
        verification_status: 'Verified (High Confidence)',
        confidence_pct: 88,
        connected_consumers: 180,
        traffic_load: 'High',
        coords: [
          [32.2410, 77.1890, 2052],
          [32.2428, 77.1880, 2072],
          [32.2442, 77.1868, 2095],
          [32.2458, 77.1852, 2120]
        ]
      },
      {
        id: 'MNL-PWR-202',
        name: 'Mall Road Pedestrian Underground 415V LT Grid',
        zone: 'mall_road',
        utilityType: 'electric_11kv',
        diameter_mm: 75,
        depth_m: 0.65,
        material: 'PVC Conduit Armoured Copper',
        install_year: 2015,
        slope_deg: 10,
        soil_type: 'Paving Paver Sand Bed',
        past_repairs_count: 1,
        last_repair_date: '2022-03-14',
        operating_pressure_bar: 0,
        data_source: 'Mall Road Beautification Project Blueprint',
        verification_status: 'Verified (High Confidence)',
        confidence_pct: 91,
        connected_consumers: 120,
        traffic_load: 'Pedestrian Only',
        coords: [
          [32.2385, 77.1880, 2043],
          [32.2395, 77.1887, 2048],
          [32.2408, 77.1895, 2055]
        ]
      },
      {
        id: 'MNL-TEL-301',
        name: 'BSNL National Highway Backbone OFC',
        zone: 'mall_road',
        utilityType: 'telecom_fiber',
        diameter_mm: 50,
        depth_m: 0.75,
        material: 'Multi-Duct HDPE Optical Fiber Conduits (24-Core)',
        install_year: 2014,
        slope_deg: 12,
        soil_type: 'Road Shoulder Silt & Crushed Stone',
        past_repairs_count: 4,
        last_repair_date: '2023-10-12',
        operating_pressure_bar: 0,
        data_source: 'BSNL Telecom Corridor Route Marker Logs',
        verification_status: 'Partially Verified (Field Potholed)',
        confidence_pct: 78,
        connected_consumers: 4500, // Internet + Mobile towers
        traffic_load: 'Heavy',
        coords: [
          [32.2368, 77.1865, 2035],
          [32.2384, 77.1877, 2043],
          [32.2402, 77.1890, 2052],
          [32.2425, 77.1906, 2065]
        ]
      },
      {
        id: 'MNL-TEL-302',
        name: 'Private Telco 5G Fiber Lateral Conduit',
        zone: 'hadimba_road',
        utilityType: 'telecom_fiber',
        diameter_mm: 40,
        depth_m: 0.55,
        material: 'Direct Buried Microduct Fiber',
        install_year: 2021,
        slope_deg: 26,
        soil_type: 'Shallow Road Shoulder Earth',
        past_repairs_count: 0,
        last_repair_date: 'Never',
        operating_pressure_bar: 0,
        data_source: 'Contractor Horizontal Directional Drilling Log (2021)',
        verification_status: 'Verified (High Confidence)',
        confidence_pct: 92,
        connected_consumers: 1200,
        traffic_load: 'Moderate',
        coords: [
          [32.2418, 77.1862, 2063],
          [32.2432, 77.1843, 2085],
          [32.2446, 77.1824, 2108]
        ]
      },
      {
        id: 'MNL-DRN-401',
        name: 'Aleo Bridge Catchment Stormwater Box Culvert',
        zone: 'aleo',
        utilityType: 'stormwater_nullah',
        diameter_mm: 600,
        depth_m: 2.2,
        material: 'Dressed Stone Masonry with Concrete Invert',
        install_year: 1980,
        slope_deg: 22,
        soil_type: 'River Boulder & Glacial Scree Matrix',
        past_repairs_count: 5,
        last_repair_date: '2023-07-28',
        operating_pressure_bar: 0.5,
        data_source: 'PWD Drainage Survey 1982',
        verification_status: 'Unverified (Legacy Records)',
        confidence_pct: 45,
        connected_consumers: 0, // Catchment drainage
        traffic_load: 'Heavy (Truck Transit)',
        coords: [
          [32.2335, 77.1910, 2010],
          [32.2355, 77.1902, 2025],
          [32.2372, 77.1895, 2038],
          [32.2388, 77.1888, 2046]
        ]
      },
      {
        id: 'MNL-WTR-004',
        name: 'Aleo Left Bank Distribution Line',
        zone: 'aleo',
        utilityType: 'water_distribution',
        diameter_mm: 150,
        depth_m: 1.0,
        material: 'Galvanized Iron & Cast Iron Joints',
        install_year: 1988,
        slope_deg: 20,
        soil_type: 'Active Erosion Slope near Beas River',
        past_repairs_count: 7,
        last_repair_date: '2024-03-01',
        operating_pressure_bar: 7.4,
        data_source: 'Hand Drawn Site Diary Notes (1991)',
        verification_status: 'Estimated (Hydraulic Model)',
        confidence_pct: 35,
        connected_consumers: 110,
        traffic_load: 'Heavy',
        coords: [
          [32.2340, 77.1925, 2012],
          [32.2358, 77.1915, 2028],
          [32.2370, 77.1905, 2040]
        ]
      },
      {
        id: 'MNL-WTR-005',
        name: 'Vashisht Approach High-Slope Water Main',
        zone: 'circuit_house',
        utilityType: 'water_main',
        diameter_mm: 200,
        depth_m: 1.3,
        material: 'Ductile Iron (K9 with Zinc Coating)',
        install_year: 2016,
        slope_deg: 38,
        soil_type: 'Fractured Gneiss Rock with Thermal Soil',
        past_repairs_count: 1,
        last_repair_date: '2023-01-10',
        operating_pressure_bar: 8.9,
        data_source: 'Jal Shakti Vibhag World Bank Scheme Plan',
        verification_status: 'Verified (High Confidence)',
        confidence_pct: 95,
        connected_consumers: 160,
        traffic_load: 'Moderate',
        coords: [
          [32.2465, 77.1860, 2125],
          [32.2482, 77.1878, 2160],
          [32.2505, 77.1895, 2205]
        ]
      }
    ],
    manholes: [
      { id: 'MH-101', name: 'Mall Road Junction Chamber #1', utilityType: 'sewer_gravity', lat: 32.2388, lng: 77.1881, depth_m: 2.8, status: 'Clear' },
      { id: 'MH-102', name: 'Mall Road Central Manhole #2', utilityType: 'sewer_gravity', lat: 32.2405, lng: 77.1890, depth_m: 2.9, status: 'Minor Silt' },
      { id: 'VC-201', name: 'Mall Feeder Sluice Valve Chamber', utilityType: 'water_main', lat: 32.2390, lng: 77.1884, depth_m: 1.4, status: 'Accessible' },
      { id: 'VC-202', name: 'Old Manali Pressure Relief Valve', utilityType: 'water_main', lat: 32.2468, lng: 77.1825, depth_m: 1.1, status: 'Needs Grease' },
      { id: 'EB-301', name: 'Circuit House 11kV Joint Pit', utilityType: 'electric_11kv', lat: 32.2428, lng: 77.1880, depth_m: 0.8, status: 'Dry / Inspected' }
    ],
    community_reports: [
      {
        id: 'REP-MNL-001',
        title: 'Continuous Wet Patch near Mall Road Taxi Stand',
        hindi_title: 'टैक्सी स्टैंड के पास सड़क पर लगातार पानी का रिसाव',
        type: 'wet_patch',
        lat: 32.2386,
        lng: 77.1882,
        elevation: 2044,
        date: '2024-05-12 09:30',
        reported_by: 'Rohit Thakur (Local Taxi Union)',
        severity: 'high',
        description: 'Clear potable water bubbling between interlocking pavers since last 2 days. No rain recently, water pooling on road surface.',
        status: 'Assigned to Jal Shakti Vibhag',
        action_required: 'Immediate acoustic leak detection on MNL-WTR-001',
        photo: './wet_patch_manali.svg',
        nearest_pipe_id: 'MNL-WTR-001'
      },
      {
        id: 'REP-MNL-002',
        title: 'Road Subsidence (Dhasna) on Circuit House Bend',
        hindi_title: 'सर्किट हाउस मोड़ पर सड़क का धसना व दरार',
        type: 'road_subsidence',
        lat: 32.2435,
        lng: 77.1875,
        elevation: 2080,
        date: '2024-05-11 16:45',
        reported_by: 'Hotel SnowView Management',
        severity: 'critical',
        description: 'Road edge has sunk by 4 inches over 10 meters stretch. Ground feels hollow underneath asphalt. Risk to tourist buses.',
        status: 'Priority Inspection Ordered',
        action_required: 'Pavement core test + scan for leaking drainage/water conduit MNL-PWR-201 & MNL-DRN-401',
        photo: './road_depression_manali.svg',
        nearest_pipe_id: 'MNL-PWR-201'
      },
      {
        id: 'REP-MNL-003',
        title: 'Sudden Morning Low Water Pressure',
        hindi_title: 'सुबह के समय नलों में पानी का भारी दबाव कम होना',
        type: 'low_pressure',
        lat: 32.2475,
        lng: 77.1815,
        elevation: 2140,
        date: '2024-05-10 07:15',
        reported_by: 'Old Manali Homestay Association',
        severity: 'medium',
        description: 'Pressure dropped from usual 4 bar to trickle since 2 days. Water smells slightly earthy.',
        status: 'Investigating',
        action_required: 'Inspect upstream line MNL-WTR-002',
        photo: './low_pressure.svg',
        nearest_pipe_id: 'MNL-WTR-002'
      },
      {
        id: 'REP-MNL-004',
        title: 'Exposed High-Voltage Cable after Mudslide',
        hindi_title: 'मिट्टी खिसकने से 11kV की बिजली केबल बाहर निकली',
        type: 'exposed_conduit',
        lat: 32.2452,
        lng: 77.1855,
        elevation: 2110,
        date: '2024-05-09 18:20',
        reported_by: 'Panchayat Member Vashisht',
        severity: 'critical',
        description: 'Rain runoff washed away 40cm of topsoil on slope bank. Armored black cable is suspended in open air. Dangerous for pedestrians.',
        status: 'Work Crew Dispatched',
        action_required: 'HPSEBL emergency protective encasement & rerouting',
        photo: './exposed_cable.svg',
        nearest_pipe_id: 'MNL-PWR-201'
      }
    ]
  },

  shimla: {
    id: 'shimla',
    name: 'Shimla (The Ridge & Mall Road)',
    state: 'Himachal Pradesh',
    center: [31.1048, 77.1734],
    elevation: 2205,
    avgSlope: 31.0,
    rainfall_24h: 38,
    soil_risk: 'Extreme (Ridge Sinking Zone & British-Era Fractures)',
    jurisdiction: 'Shimla Jal Prabandhan Nigam Ltd (SJPNL) & HP PWD Div 1',
    emergency_contacts: [
      { name: 'SJPNL Control Room Shimla', phone: '0177-2802764', role: 'Municipal Water Distribution' },
      { name: 'HPSEBL Kasumpti / The Mall', phone: '0177-2624515', role: 'Power Infrastructure' },
      { name: 'HP PWD Shimla Central', phone: '0177-2658145', role: 'Excavation & Heritage Roadways' },
      { name: 'DDMA Shimla Emergency', phone: '1077', role: 'Disaster Cell' }
    ],
    zones: [
      { id: 'ridge', name: 'The Ridge & Lakkar Bazaar', critical: true, desc: 'Heritage sinking zone, large underground water reservoir' },
      { id: 'mall_road_shm', name: 'Lower Bazaar & Mall Road Corridor', critical: true, desc: 'Dense vertical shops, British-era cast iron pipes' },
      { id: 'sanjauli', name: 'Sanjauli High-Slope Incline', critical: false, desc: 'Extreme building density on 35° slope' }
    ],
    pipes: [
      {
        id: 'SHM-WTR-001',
        name: 'The Ridge Heritage Reservoir Gravity Feed',
        zone: 'ridge',
        utilityType: 'water_main',
        diameter_mm: 350,
        depth_m: 1.8,
        material: 'Cast Iron (British Colonial Era)',
        install_year: 1935,
        slope_deg: 24,
        soil_type: 'Fractured Phyllite Rock & Unconsolidated Fill',
        past_repairs_count: 8,
        last_repair_date: '2023-11-20',
        operating_pressure_bar: 7.5,
        data_source: 'Municipal Corporation Archives (1938 Blueprint)',
        verification_status: 'Unverified (Legacy Records)',
        confidence_pct: 42,
        connected_consumers: 340,
        traffic_load: 'Pedestrian Heavy',
        coords: [
          [31.1040, 77.1720, 2200],
          [31.1048, 77.1734, 2206],
          [31.1055, 77.1748, 2212],
          [31.1062, 77.1762, 2218]
        ]
      },
      {
        id: 'SHM-SWR-101',
        name: 'Lower Bazaar Steep Gravity Sewer',
        zone: 'mall_road_shm',
        utilityType: 'sewer_gravity',
        diameter_mm: 300,
        depth_m: 2.4,
        material: 'Glazed Stoneware & Concrete',
        install_year: 1974,
        slope_deg: 36,
        soil_type: 'Steep Fill over Weathered Schist',
        past_repairs_count: 7,
        last_repair_date: '2024-01-15',
        operating_pressure_bar: 0.8,
        data_source: 'Sanitation Dept Hand Survey (1976)',
        verification_status: 'Unverified (Legacy Records)',
        confidence_pct: 38,
        connected_consumers: 280,
        traffic_load: 'Foot Traffic / Porters',
        coords: [
          [31.1035, 77.1725, 2192],
          [31.1042, 77.1738, 2198],
          [31.1049, 77.1752, 2205]
        ]
      },
      {
        id: 'SHM-PWR-201',
        name: 'The Mall Heritage Underground Electric Ring',
        zone: 'ridge',
        utilityType: 'electric_11kv',
        diameter_mm: 85,
        depth_m: 0.9,
        material: 'Armoured Copper XLPE Conduit',
        install_year: 2012,
        slope_deg: 18,
        soil_type: 'Stone Paver Foundation Bed',
        past_repairs_count: 2,
        last_repair_date: '2022-08-19',
        operating_pressure_bar: 0,
        data_source: 'HPSEBL Modernization As-Built (2013)',
        verification_status: 'Verified (High Confidence)',
        confidence_pct: 92,
        connected_consumers: 410,
        traffic_load: 'Pedestrian Heavy',
        coords: [
          [31.1042, 77.1718, 2202],
          [31.1050, 77.1732, 2208],
          [31.1058, 77.1745, 2215]
        ]
      }
    ],
    manholes: [
      { id: 'SHM-MH-01', name: 'Ridge Tank Sluice Inspection Pit', utilityType: 'water_main', lat: 31.1048, lng: 77.1734, depth_m: 1.8, status: 'Clear' },
      { id: 'SHM-MH-02', name: 'Lower Bazaar Drop Manhole', utilityType: 'sewer_gravity', lat: 31.1042, lng: 77.1738, depth_m: 2.4, status: 'Checked' }
    ],
    community_reports: [
      {
        id: 'REP-SHM-001',
        title: 'Road Subsidence near Ridge Viewing Deck',
        hindi_title: 'द रिज व्यूइंग डेक के समीप जमीन का धसना',
        type: 'road_subsidence',
        lat: 31.1049,
        lng: 77.1735,
        elevation: 2207,
        date: '2024-05-12 11:20',
        reported_by: 'Ridge Citizens Forum',
        severity: 'critical',
        description: 'Crack widening along the main promenade. Leaking water sound heard beneath masonry bench.',
        status: 'Assigned to SJPNL',
        action_required: 'Immediate acoustic probe on SHM-WTR-001',
        photo: './wet_patch_manali.svg',
        nearest_pipe_id: 'SHM-WTR-001'
      }
    ]
  },

  dharamshala: {
    id: 'dharamshala',
    name: 'Dharamshala & McLeod Ganj',
    state: 'Himachal Pradesh',
    center: [32.2426, 76.3218],
    elevation: 1750,
    avgSlope: 29.5,
    rainfall_24h: 75, // Highest rainfall in HP
    soil_risk: 'High (Seismic Zone V & Active Thrust Fault)',
    jurisdiction: 'Dharamshala Smart City & Jal Shakti Vibhag Kangra',
    emergency_contacts: [
      { name: 'Jal Shakti Vibhag McLeod Ganj', phone: '01892-224855', role: 'Water Systems' },
      { name: 'Dharamshala Smart City Cell', phone: '01892-222380', role: 'GIS & Utility Network' }
    ],
    zones: [
      { id: 'mcleod_main', name: 'McLeod Ganj Temple Road', critical: true, desc: 'Dalai Lama Temple corridor, extreme tourist influx' },
      { id: 'bhagsu', name: 'Bhagsu Nag Incline', critical: false, desc: 'Cascade waterfall stream, loose boulder moraine' }
    ],
    pipes: [
      {
        id: 'DHM-WTR-001',
        name: 'Temple Road Smart Water Duct',
        zone: 'mcleod_main',
        utilityType: 'water_main',
        diameter_mm: 250,
        depth_m: 1.3,
        material: 'Ductile Iron Class K9',
        install_year: 2019,
        slope_deg: 27,
        soil_type: 'Granite Colluvium Scree',
        past_repairs_count: 1,
        last_repair_date: '2023-08-11',
        operating_pressure_bar: 6.2,
        data_source: 'Dharamshala Smart City GIS (2020)',
        verification_status: 'Verified (High Confidence)',
        confidence_pct: 96,
        connected_consumers: 195,
        traffic_load: 'Moderate',
        coords: [
          [32.2415, 76.3205, 1735],
          [32.2426, 76.3218, 1750],
          [32.2438, 76.3232, 1768]
        ]
      },
      {
        id: 'DHM-SWR-101',
        name: 'Bhagsu Nag Drainage & Sewer Interceptor',
        zone: 'bhagsu',
        utilityType: 'sewer_gravity',
        diameter_mm: 350,
        depth_m: 2.5,
        material: 'Corrugated HDPE Double Wall Pipe',
        install_year: 2014,
        slope_deg: 34,
        soil_type: 'Torrential Boulder Silt',
        past_repairs_count: 4,
        last_repair_date: '2023-09-08',
        operating_pressure_bar: 1.0,
        data_source: 'Municipal Contract As-Built (2015)',
        verification_status: 'Partially Verified (Field Potholed)',
        confidence_pct: 74,
        connected_consumers: 110,
        traffic_load: 'Pedestrian',
        coords: [
          [32.2450, 76.3245, 1780],
          [32.2462, 76.3260, 1805],
          [32.2475, 76.3278, 1835]
        ]
      }
    ],
    manholes: [],
    community_reports: []
  },

  mussoorie: {
    id: 'mussoorie',
    name: 'Mussoorie & Landour (Queen of the Hills)',
    state: 'Uttarakhand',
    center: [30.4598, 78.0644],
    elevation: 2005,
    avgSlope: 27.8,
    rainfall_24h: 44,
    soil_risk: 'High (Limestone Karst & Landslip Slopes)',
    jurisdiction: 'Uttarakhand Jal Sansthan & PWD Mussoorie',
    emergency_contacts: [
      { name: 'Uttarakhand Jal Sansthan Mussoorie', phone: '0135-2632233', role: 'Water Supply' },
      { name: 'Mussoorie Dehradun Dev Authority', phone: '0135-2630040', role: 'Municipal & Permits' }
    ],
    zones: [
      { id: 'mall_road_msr', name: 'The Mall & Library Chowk', critical: true, desc: 'Central ridge promenade' },
      { id: 'landour', name: 'Landour Heritage Ridge', critical: false, desc: 'Historic cantonment, narrow winding paths' }
    ],
    pipes: [
      {
        id: 'MSR-WTR-001',
        name: 'Library Chowk Gravity Main',
        zone: 'mall_road_msr',
        utilityType: 'water_main',
        diameter_mm: 250,
        depth_m: 1.2,
        material: 'Cast Iron',
        install_year: 1986,
        slope_deg: 19,
        soil_type: 'Limestone Solution Cavity Sub-base',
        past_repairs_count: 5,
        last_repair_date: '2023-04-10',
        operating_pressure_bar: 7.0,
        data_source: 'Jal Sansthan Records',
        verification_status: 'Unverified (Legacy Records)',
        confidence_pct: 48,
        connected_consumers: 180,
        traffic_load: 'Pedestrian Heavy',
        coords: [
          [30.4580, 78.0620, 1990],
          [30.4598, 78.0644, 2005],
          [30.4615, 78.0668, 2020]
        ]
      }
    ],
    manholes: [],
    community_reports: []
  }
};

// Utility color schemes & styling specs
const UTILITY_METADATA = {
  water_main: {
    label: 'Potable Water Main',
    hindi: 'पेयजल मुख्य पाइपलाइन',
    color: '#06b6d4',      // Cyan
    colorDark: '#0891b2',
    colorThree: 0x06b6d4,
    icon: 'droplets',
    standardDepth: '1.2m - 1.8m',
    criticality: 'High',
    authority: 'Jal Shakti Vibhag (IPH)'
  },
  water_distribution: {
    label: 'Water Distribution Lateral',
    hindi: 'वितरण पाइपलाइन (शाखा)',
    color: '#38bdf8',      // Sky Blue
    colorDark: '#0284c7',
    colorThree: 0x38bdf8,
    icon: 'droplet',
    standardDepth: '0.9m - 1.2m',
    criticality: 'Medium',
    authority: 'Jal Shakti Vibhag (IPH)'
  },
  sewer_gravity: {
    label: 'Sanitary Sewer (Gravity)',
    hindi: 'सीवरेज पाइपलाइन (ढलान/गुरुत्वाकर्षण)',
    color: '#10b981',      // Emerald Green
    colorDark: '#059669',
    colorThree: 0x10b981,
    icon: 'waves',
    standardDepth: '2.0m - 3.8m',
    criticality: 'High',
    authority: 'Municipal Sanitation Cell / PWD'
  },
  electric_11kv: {
    label: 'High Voltage Underground Cable (11kV)',
    hindi: 'भूमिगत बिजली केबल (11kV)',
    color: '#f59e0b',      // Amber
    colorDark: '#d97706',
    colorThree: 0xf59e0b,
    icon: 'zap',
    standardDepth: '0.8m - 1.2m',
    criticality: 'Extreme Danger',
    authority: 'HPSEBL / State Electricity Board'
  },
  telecom_fiber: {
    label: 'Optical Fiber Conduit (OFC)',
    hindi: 'ऑप्टिकल फाइबर केबल (इंटरनेट/दूरसंचार)',
    color: '#ec4899',      // Pink/Magenta
    colorDark: '#db2777',
    colorThree: 0xec4899,
    icon: 'network',
    standardDepth: '0.6m - 0.9m',
    criticality: 'High',
    authority: 'BSNL & Telecom Infrastructure Providers'
  },
  stormwater_nullah: {
    label: 'Mountain Stormwater Nullah / Culvert',
    hindi: 'पहाड़ी बरसाती नाला / पुलिया',
    color: '#6366f1',      // Indigo
    colorDark: '#4f46e5',
    colorThree: 0x6366f1,
    icon: 'cloud-rain',
    standardDepth: '1.5m - 3.0m',
    criticality: 'High (Flash Flood Buffer)',
    authority: 'HP PWD Division'
  }
};
