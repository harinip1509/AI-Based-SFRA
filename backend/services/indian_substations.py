"""
Indian National Power Grid & Substation Asset Inventory
======================================================
Covers high-voltage transmission & generation transformer assets across:
  - POWERGRID Corporation of India Limited (PGCIL)
  - Maharashtra State Electricity Transmission Co. Ltd. (MSETCL / Mahatransco)
  - Tata Power Transmission & Distribution
  - Gujarat Energy Transmission Corporation (GETCO)
  - Delhi Transco Limited (DTL)
  - Karnataka Power Transmission Corporation (KPTCL)
  - Transmission Corporation of Telangana (TSTRANSCO)
"""
import math
from typing import Any, Dict, List, Optional


INDIAN_SUBSTATIONS: List[Dict[str, Any]] = [
    {
        "substation_id": "SUB-MH-KLW-400",
        "substation_name": "Kalwa 400/220/33 kV Substation",
        "utility": "MSETCL (Maharashtra State Electricity Transmission Co.)",
        "region": "Western Region (WR-I), Mumbai Metropolitan Region",
        "city": "Thane / Mumbai, Maharashtra",
        "latitude": 19.1983,
        "longitude": 72.9989,
        "voltage_class": "400 kV / 220 kV / 33 kV",
        "total_capacity_mva": 1890,
        "transformers": [
            {
                "asset_id": "TR-400KV-315MVA-BHEL-01",
                "bay": "Bay 401 (ICT-1)",
                "rating": "315 MVA, 400/220/33 kV, 3-Phase Auto-Transformer",
                "make": "Bharat Heavy Electricals Limited (BHEL), Bhopal",
                "commissioning_year": 2017,
                "cooling": "ONAN / ONAF / OFAF",
                "vector_group": "YNautod11",
                "health_index": 94,
                "status": "NORMAL / OPERATIONAL",
                "last_sfra_date": "14-Aug-2024",
                "dga_condition": "Condition 1 (Nominal, C2H2 = 0.0 ppm)",
                "oil_capacity_liters": 68500,
            },
            {
                "asset_id": "TR-400KV-315MVA-BHEL-02",
                "bay": "Bay 402 (ICT-2)",
                "rating": "315 MVA, 400/220/33 kV, 3-Phase Auto-Transformer",
                "make": "Bharat Heavy Electricals Limited (BHEL), Bhopal",
                "commissioning_year": 2019,
                "cooling": "ONAN / ONAF / OFAF",
                "vector_group": "YNautod11",
                "health_index": 91,
                "status": "NORMAL / OPERATIONAL",
                "last_sfra_date": "22-Jan-2025",
                "dga_condition": "Condition 1 (Nominal, C2H2 = 0.0 ppm)",
                "oil_capacity_liters": 68500,
            },
            {
                "asset_id": "TR-220KV-100MVA-CG-03",
                "bay": "Bay 203 (Step-Down)",
                "rating": "100 MVA, 220/33 kV Power Transformer",
                "make": "CG Power and Industrial Solutions, Kanjurmarg",
                "commissioning_year": 2014,
                "cooling": "ONAN / ONAF",
                "vector_group": "YNd11",
                "health_index": 78,
                "status": "INVESTIGATE (Mid-band SFRA Deviation)",
                "last_sfra_date": "08-Oct-2024",
                "dga_condition": "Condition 2 (Elevated Ethylene C2H4 = 42 ppm)",
                "oil_capacity_liters": 38200,
            },
        ],
    },
    {
        "substation_id": "SUB-MH-PDG-765",
        "substation_name": "Padgha 765/400/220 kV GIS Substation & HVDC Terminal",
        "utility": "POWERGRID Corporation of India Limited (PGCIL)",
        "region": "Western Region (WR-I)",
        "city": "Padgha / Bhiwandi, Maharashtra",
        "latitude": 19.3482,
        "longitude": 73.1611,
        "voltage_class": "765 kV / 400 kV / ±500 kV HVDC",
        "total_capacity_mva": 3000,
        "transformers": [
            {
                "asset_id": "PGCIL-WR1-PDG-ICT-01",
                "bay": "Bay 701 (Inter-Connecting Transformer 1)",
                "rating": "1000 MVA (3x333 MVA Bank), 765/400/33 kV Auto-Transformer",
                "make": "Hitachi Energy India (ABB), Vadodara",
                "commissioning_year": 2020,
                "cooling": "ODAF",
                "vector_group": "YNautod11",
                "health_index": 98,
                "status": "NORMAL / EXCELLENT",
                "last_sfra_date": "10-Nov-2024",
                "dga_condition": "Condition 1 (Pristine)",
                "oil_capacity_liters": 94000,
            },
            {
                "asset_id": "PGCIL-WR1-PDG-ICT-02",
                "bay": "Bay 702 (Inter-Connecting Transformer 2)",
                "rating": "1000 MVA (3x333 MVA Bank), 765/400/33 kV Auto-Transformer",
                "make": "Hitachi Energy India (ABB), Vadodara",
                "commissioning_year": 2021,
                "cooling": "ODAF",
                "vector_group": "YNautod11",
                "health_index": 96,
                "status": "NORMAL / EXCELLENT",
                "last_sfra_date": "10-Nov-2024",
                "dga_condition": "Condition 1 (Pristine)",
                "oil_capacity_liters": 94000,
            },
        ],
    },
    {
        "substation_id": "SUB-MH-TRM-220",
        "substation_name": "Trombay 220/110/33 kV Thermal Generating Station",
        "utility": "Tata Power Company (Transmission Division)",
        "region": "Mumbai Island Grid",
        "city": "Chembur / Trombay, Mumbai, Maharashtra",
        "latitude": 19.0144,
        "longitude": 72.8988,
        "voltage_class": "220 kV / 110 kV / 15.75 kV",
        "total_capacity_mva": 1250,
        "transformers": [
            {
                "asset_id": "TPC-TRM-UNIT8-GSU",
                "bay": "Unit 8 Generator Step-Up (GSU)",
                "rating": "300 MVA, 220/15.75 kV Generator Step-Up Transformer",
                "make": "Siemens Energy India, Kalwa Works",
                "commissioning_year": 2012,
                "cooling": "OFAF",
                "vector_group": "Nd11",
                "health_index": 82,
                "status": "INVESTIGATE (Thermal Hotspot Monitoring)",
                "last_sfra_date": "04-Sep-2024",
                "dga_condition": "Condition 2 (Elevated Methane & Ethane)",
                "oil_capacity_liters": 54000,
            },
            {
                "asset_id": "TPC-TRM-ST-02",
                "bay": "Station Service Bay 22",
                "rating": "100 MVA, 220/33 kV Station Transformer",
                "make": "BHEL, Bhopal",
                "commissioning_year": 2015,
                "cooling": "ONAN / ONAF",
                "vector_group": "YNd11",
                "health_index": 89,
                "status": "NORMAL / OPERATIONAL",
                "last_sfra_date": "18-Dec-2024",
                "dga_condition": "Condition 1 (Nominal)",
                "oil_capacity_liters": 39000,
            },
        ],
    },
    {
        "substation_id": "SUB-MH-KHG-400",
        "substation_name": "Kharghar 400/220/33 kV Substation",
        "utility": "MSETCL (Navi Mumbai Circle)",
        "region": "Western Region (WR-I)",
        "city": "Kharghar / Navi Mumbai, Maharashtra",
        "latitude": 19.0435,
        "longitude": 73.0645,
        "voltage_class": "400 kV / 220 kV / 33 kV",
        "total_capacity_mva": 1260,
        "transformers": [
            {
                "asset_id": "MH-MSETCL-KHG-TR-01",
                "bay": "Bay 403 (Kharghar ICT-1)",
                "rating": "315 MVA, 400/220/33 kV Auto-Transformer",
                "make": "CG Power and Industrial Solutions",
                "commissioning_year": 2018,
                "cooling": "ONAF / OFAF",
                "vector_group": "YNautod11",
                "health_index": 92,
                "status": "NORMAL / OPERATIONAL",
                "last_sfra_date": "05-Jan-2025",
                "dga_condition": "Condition 1 (Nominal)",
                "oil_capacity_liters": 67000,
            },
            {
                "asset_id": "MH-MSETCL-KHG-TR-02",
                "bay": "Bay 404 (Kharghar ICT-2)",
                "rating": "315 MVA, 400/220/33 kV Auto-Transformer",
                "make": "Schneider Electric / Transformers & Rectifiers India (TRIL)",
                "commissioning_year": 2021,
                "cooling": "ONAF / OFAF",
                "vector_group": "YNautod11",
                "health_index": 95,
                "status": "NORMAL / OPERATIONAL",
                "last_sfra_date": "05-Jan-2025",
                "dga_condition": "Condition 1 (Nominal)",
                "oil_capacity_liters": 66500,
            },
        ],
    },
    {
        "substation_id": "SUB-MH-PUN-400",
        "substation_name": "Chakan 400/220 kV Substation (Auto-Cluster Hub)",
        "utility": "MSETCL / POWERGRID",
        "region": "Pune Industrial Grid",
        "city": "Chakan / Pune, Maharashtra",
        "latitude": 18.7610,
        "longitude": 73.8550,
        "voltage_class": "400 kV / 220 kV",
        "total_capacity_mva": 1500,
        "transformers": [
            {
                "asset_id": "MH-MSETCL-CHK-ICT-01",
                "bay": "Bay 401 (Auto Feeder 1)",
                "rating": "500 MVA, 400/220 kV Auto-Transformer",
                "make": "BHEL, Bhopal",
                "commissioning_year": 2019,
                "cooling": "OFAF",
                "vector_group": "YNautod11",
                "health_index": 93,
                "status": "NORMAL / OPERATIONAL",
                "last_sfra_date": "15-Dec-2024",
                "dga_condition": "Condition 1",
                "oil_capacity_liters": 78000,
            },
        ],
    },
    {
        "substation_id": "SUB-DL-MND-400",
        "substation_name": "Mandola 400/220 kV Substation (Northern Grid Gate)",
        "utility": "POWERGRID Corporation of India Limited (NR-I)",
        "region": "Northern Region (NR-I)",
        "city": "Delhi / Ghaziabad NCR",
        "latitude": 28.7900,
        "longitude": 77.2900,
        "voltage_class": "400 kV / 220 kV",
        "total_capacity_mva": 1890,
        "transformers": [
            {
                "asset_id": "PGCIL-NR1-MND-ICT-01",
                "bay": "Bay 401 (Delhi Ring ICT-1)",
                "rating": "315 MVA, 400/220/33 kV Auto-Transformer",
                "make": "Siemens Energy India",
                "commissioning_year": 2016,
                "cooling": "ONAF / OFAF",
                "vector_group": "YNautod11",
                "health_index": 90,
                "status": "NORMAL / OPERATIONAL",
                "last_sfra_date": "19-Feb-2025",
                "dga_condition": "Condition 1",
                "oil_capacity_liters": 68000,
            },
        ],
    },
    {
        "substation_id": "SUB-KA-HOD-400",
        "substation_name": "Hoodi 400/220 kV Substation (IT Corridor Grid)",
        "utility": "KPTCL / POWERGRID (SR-II)",
        "region": "Southern Region (SR-II)",
        "city": "Bengaluru, Karnataka",
        "latitude": 12.9915,
        "longitude": 77.7165,
        "voltage_class": "400 kV / 220 kV / 66 kV",
        "total_capacity_mva": 1500,
        "transformers": [
            {
                "asset_id": "KPTCL-HOD-TR-01",
                "bay": "Bay 402 (Whitefield Feeder)",
                "rating": "500 MVA, 400/220 kV Auto-Transformer",
                "make": "Hitachi Energy India (ABB)",
                "commissioning_year": 2020,
                "cooling": "OFAF",
                "vector_group": "YNautod11",
                "health_index": 96,
                "status": "NORMAL / OPERATIONAL",
                "last_sfra_date": "11-Jan-2025",
                "dga_condition": "Condition 1",
                "oil_capacity_liters": 79500,
            },
        ],
    },
    {
        "substation_id": "SUB-TS-MLK-400",
        "substation_name": "Malkaram 400/220 kV Substation",
        "utility": "TSTRANSCO / POWERGRID (SR-I)",
        "region": "Southern Region (SR-I)",
        "city": "Hyderabad, Telangana",
        "latitude": 17.3100,
        "longitude": 78.5800,
        "voltage_class": "400 kV / 220 kV",
        "total_capacity_mva": 1500,
        "transformers": [
            {
                "asset_id": "TST-MLK-ICT-01",
                "bay": "Bay 401 (Hyderabad Outer Ring)",
                "rating": "315 MVA, 400/220 kV Auto-Transformer",
                "make": "BHEL, Bhopal",
                "commissioning_year": 2018,
                "cooling": "OFAF",
                "vector_group": "YNautod11",
                "health_index": 92,
                "status": "NORMAL / OPERATIONAL",
                "last_sfra_date": "29-Nov-2024",
                "dga_condition": "Condition 1",
                "oil_capacity_liters": 68000,
            },
        ],
    },
]


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance between two latitude/longitude points in kilometers."""
    radius_km = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(radius_km * c, 1)


def find_nearby_substations(user_lat: float, user_lon: float, limit: int = 5) -> List[Dict[str, Any]]:
    """Returns Indian substations and transformer assets sorted by geographic proximity."""
    augmented = []
    for sub in INDIAN_SUBSTATIONS:
        dist = haversine_distance_km(user_lat, user_lon, sub["latitude"], sub["longitude"])
        sub_copy = dict(sub)
        sub_copy["distance_km"] = dist
        augmented.append(sub_copy)

    augmented.sort(key=lambda s: s["distance_km"])
    return augmented[:limit]
