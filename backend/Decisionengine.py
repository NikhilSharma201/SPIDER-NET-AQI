"""
SpiderNet Decision Engine — Air Quality Risk Assessment
-------------------------------------------------------
Rule-based model that calculates activity-specific risk scores
from pollutant concentrations and returns prescriptive recommendations.

Adapted from: Kiwi-520's Decision Engine
Project: SpiderNet AQI — Pan-India Environmental Grid
"""

from typing import Dict, Tuple

WHO_GUIDELINES = {
    'pm2_5': 25.0,
    'pm10':  50.0,
    'o3':    100.0,
    'no2':   40.0,
    'co':    10000.0,
}

ACTIVITY_WEIGHTS = {
    "Strenuous Exercise":      {"pm2_5": 0.50, "pm10": 0.20, "o3": 0.20, "no2": 0.05, "co": 0.05},
    "Moderate Activity":       {"pm2_5": 0.40, "pm10": 0.20, "o3": 0.25, "no2": 0.10, "co": 0.05},
    "Relaxing Outdoors":       {"pm2_5": 0.25, "pm10": 0.15, "o3": 0.40, "no2": 0.15, "co": 0.05},
    "Outdoor Event":           {"pm2_5": 0.30, "pm10": 0.20, "o3": 0.30, "no2": 0.15, "co": 0.05},
    "Children's Outdoor Play": {"pm2_5": 0.55, "pm10": 0.25, "o3": 0.15, "no2": 0.03, "co": 0.02},
    "Commuting (Walk/Bike)":   {"pm2_5": 0.35, "pm10": 0.20, "o3": 0.15, "no2": 0.20, "co": 0.10},
}


def normalize_pollutant(value: float, pollutant: str) -> float:
    if not value or value <= 0:
        return 0.0
    return value / WHO_GUIDELINES.get(pollutant, 1.0)


def calculate_activity_risk(activity: str, pollutant_data: Dict[str, float]) -> Tuple[float, Dict, Dict]:
    weights = ACTIVITY_WEIGHTS[activity]
    normalized = {p: normalize_pollutant(pollutant_data.get(p, 0.0), p) for p in weights}
    contributions = {p: normalized[p] * weights[p] for p in weights}
    return sum(contributions.values()), contributions, normalized


def get_decision(risk_score: float, activity: str) -> dict:
    if risk_score < 0.8:
        return {
            "decision": "GO", "level": "LOW RISK", "color": "#00E400",
            "short_advice": "Conditions are favorable — enjoy!",
            "detail": f"Air quality is favorable for {activity.lower()}. Risk score {risk_score:.2f} is within safe limits.",
            "actions": [], "risk_level_numeric": 1,
        }
    elif risk_score < 1.5:
        return {
            "decision": "CAUTION", "level": "MODERATE RISK", "color": "#FF7E00",
            "short_advice": "Proceed with reduced intensity",
            "detail": f"Air quality presents moderate risk for {activity.lower()}. Risk score is {risk_score:.2f}.",
            "actions": [
                "Reduce intensity or duration of activity",
                "Sensitive groups (elderly, children, asthma) should reconsider",
                "Monitor for coughing or shortness of breath",
                "Move indoors if symptoms develop",
            ],
            "risk_level_numeric": 2,
        }
    else:
        return {
            "decision": "STOP", "level": "HIGH RISK", "color": "#FF003C",
            "short_advice": "Postpone or move indoors",
            "detail": f"Air quality presents high risk for {activity.lower()}. Risk score is {risk_score:.2f} — above safe threshold.",
            "actions": [
                "Postpone outdoor activity to another time",
                "Move activity indoors if possible",
                "If unavoidable, wear an N95/N99 mask",
                "Limit outdoor duration to the absolute minimum",
                "Vulnerable populations must avoid outdoor exposure entirely",
            ],
            "risk_level_numeric": 3,
        }


def run_decision_engine(aqi: int, pollutant_data: Dict[str, float]) -> dict:
    results = {}
    for activity in ACTIVITY_WEIGHTS:
        risk_score, contributions, normalized = calculate_activity_risk(activity, pollutant_data)
        decision = get_decision(risk_score, activity)
        top_drivers = sorted(contributions.items(), key=lambda x: x[1], reverse=True)[:2]
        results[activity] = {
            "risk_score": round(risk_score, 3),
            "decision": decision["decision"],
            "level": decision["level"],
            "color": decision["color"],
            "short_advice": decision["short_advice"],
            "detail": decision["detail"],
            "actions": decision["actions"],
            "risk_level_numeric": decision["risk_level_numeric"],
            "contributions": {k: round(v, 4) for k, v in contributions.items()},
            "normalized": {k: round(v, 4) for k, v in normalized.items()},
            "top_drivers": [
                {"pollutant": p.upper().replace("_", "."), "contribution": round(c, 4)}
                for p, c in top_drivers
            ],
        }

    who_table = []
    for pollutant, value in pollutant_data.items():
        if pollutant in WHO_GUIDELINES and value is not None:
            guideline = WHO_GUIDELINES[pollutant]
            ratio = value / guideline
            who_table.append({
                "pollutant": pollutant.upper().replace("_", "."),
                "current": round(value, 1),
                "guideline": guideline,
                "percent_of_guideline": round(ratio * 100, 0),
                "status": "safe" if ratio < 0.5 else "elevated" if ratio < 1.0 else "exceeds",
            })

    return {
        "aqi": aqi,
        "activities": results,
        "who_table": who_table,
        "activity_list": list(ACTIVITY_WEIGHTS.keys()),
    }