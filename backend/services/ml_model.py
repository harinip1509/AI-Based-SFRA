import json
from pathlib import Path
from typing import Dict, List

import numpy as np

from services.fra_model import analyze_fra

LABELS = ["Normal", "Minor Deviation", "Moderate Fault", "High Fault Risk"]
_MODELS = {
    "ready": False,
    "failed": False,
    "cnn": None,
    "autoencoder": None,
    "meta": None,
    "torch": None,
}


def _load_models() -> bool:
    if _MODELS["ready"]:
        return True
    if _MODELS["failed"]:
        return False

    try:
        import torch
        import torch.nn as nn
    except Exception:
        _MODELS["failed"] = True
        return False

    model_dir = Path(__file__).resolve().parents[1] / "models"
    cnn_path = model_dir / "cnn_model.pth"
    ae_path = model_dir / "autoencoder.pth"
    meta_path = model_dir / "ml_meta.json"
    if not (cnn_path.exists() and ae_path.exists() and meta_path.exists()):
        _MODELS["failed"] = True
        return False

    class FRA1DCNN(nn.Module):
        def __init__(self):
            super().__init__()
            self.features = nn.Sequential(
                nn.Conv1d(1, 16, kernel_size=7, padding=3),
                nn.ReLU(),
                nn.MaxPool1d(2),
                nn.Conv1d(16, 32, kernel_size=5, padding=2),
                nn.ReLU(),
                nn.MaxPool1d(2),
                nn.Conv1d(32, 64, kernel_size=3, padding=1),
                nn.ReLU(),
                nn.AdaptiveAvgPool1d(16),
            )
            self.classifier = nn.Sequential(
                nn.Flatten(),
                nn.Linear(64 * 16, 128),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(128, 4),
            )

        def forward(self, x):
            return self.classifier(self.features(x))

    class FRAAutoencoder(nn.Module):
        def __init__(self):
            super().__init__()
            self.encoder = nn.Sequential(
                nn.Linear(500, 256),
                nn.ReLU(),
                nn.Linear(256, 96),
                nn.ReLU(),
                nn.Linear(96, 32),
            )
            self.decoder = nn.Sequential(
                nn.Linear(32, 96),
                nn.ReLU(),
                nn.Linear(96, 256),
                nn.ReLU(),
                nn.Linear(256, 500),
            )

        def forward(self, x):
            z = self.encoder(x)
            return self.decoder(z)

    try:
        with meta_path.open("r", encoding="utf-8") as f:
            meta = json.load(f)
        cnn = FRA1DCNN()
        autoencoder = FRAAutoencoder()
        cnn.load_state_dict(torch.load(cnn_path, map_location="cpu"))
        autoencoder.load_state_dict(torch.load(ae_path, map_location="cpu"))
        cnn.eval()
        autoencoder.eval()
    except Exception:
        _MODELS["failed"] = True
        return False

    _MODELS["torch"] = torch
    _MODELS["cnn"] = cnn
    _MODELS["autoencoder"] = autoencoder
    _MODELS["meta"] = meta
    _MODELS["ready"] = True
    return True


def _format_probabilities(prob_values: List[float]) -> Dict[str, float]:
    return {label: float(prob_values[i]) for i, label in enumerate(LABELS)}


def _fallback(values: List[float]) -> Dict[str, object]:
    analysis = analyze_fra(values)
    classification = analysis["classification"]
    probs = {k: 0.05 for k in LABELS}
    probs[classification] = 0.85
    explanation = "Unusual frequency behavior detected" if analysis.get("signals", {}).get("spectral_flag") else "Stable FRA pattern detected"
    if classification in {"Moderate Fault", "High Fault Risk"}:
        explanation = "Significant FRA deviation detected"
    return {
        "classification": classification,
        "confidence": float(probs[classification]),
        "anomaly_score": float(int(classification != "Normal") * 0.35),
        "probabilities": probs,
        "signals": analysis.get("signals", {}),
        "explanation": explanation,
        "metrics": analysis.get("metrics", {}),
        "model_source": "rule_fallback",
    }


def analyze_fra_ml(series: List[float], pre_normalized: bool = False) -> Dict[str, object]:
    cleaned = [float(v) for v in series if np.isfinite(v)]
    if len(cleaned) < 8:
        return _fallback(cleaned)

    arr = np.array(cleaned[:500], dtype=np.float32)
    if arr.size < 500:
        arr = np.pad(arr, (0, 500 - arr.size), mode="edge")

    if not _load_models():
        return _fallback(cleaned)

    torch = _MODELS["torch"]
    meta = _MODELS["meta"] or {}
    ae_threshold = float(meta.get("ae_threshold", 0.02))

    if pre_normalized:
        x = arr.astype(np.float32)
    else:
        local_mean = float(np.mean(arr))
        local_std = float(np.std(arr))
        x = ((arr - local_mean) / (local_std + 1e-6)).astype(np.float32)
    x_cnn = torch.from_numpy(x).unsqueeze(0).unsqueeze(0)
    x_ae = torch.from_numpy(x).unsqueeze(0)

    with torch.no_grad():
        logits = _MODELS["cnn"](x_cnn)
        probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()
        pred_idx = int(np.argmax(probs))
        recon = _MODELS["autoencoder"](x_ae)
        recon_err = float(((recon - x_ae) ** 2).mean().cpu().item())

    classification = LABELS[pred_idx]
    confidence = float(probs[pred_idx])
    anomaly_score = float(recon_err / (ae_threshold + 1e-6))
    probabilities = _format_probabilities(probs.tolist())

    if anomaly_score >= 1.0:
        explanation = "Unusual frequency behavior detected"
    elif classification in {"Moderate Fault", "High Fault Risk"}:
        explanation = "Significant FRA deviation detected"
    else:
        explanation = "Stable FRA pattern detected"

    diff = np.diff(arr)
    if diff.size > 0:
        smoothness = float(np.std(diff))
        monotonic_ratio = float(np.sum(diff < 0) / len(diff))
        peaks = int(np.sum((diff[:-1] > 0) & (diff[1:] < 0))) if diff.size > 1 else 0
    else:
        smoothness = 0.0
        monotonic_ratio = 0.0
        peaks = 0

    is_smooth = smoothness < 0.3
    is_monotonic = monotonic_ratio > 0.85
    low_peaks = peaks <= 2

    print("---- SHAPE DEBUG ----")
    print("smoothness:", smoothness)
    print("monotonic_ratio:", monotonic_ratio)
    print("peaks:", peaks)
    print("classification_before:", classification)
    print("---------------------")
    print("override_check:", is_smooth, is_monotonic, low_peaks)

    # -------------------------------
    # FINAL CLEAN DECISION FLOW
    # -------------------------------

    # 1. NORMAL PROTECTION (single source)
    if classification in ["Moderate Fault", "High Fault Risk"]:
        if smoothness < 0.2 and monotonic_ratio > 0.9 and peaks <= 1:
            print("FINAL → NORMAL (smooth monotonic)")
            classification = "Normal"
            confidence = min(confidence, 0.7)
            explanation = "Smooth monotonic FRA response — no structural deviation detected"

    # 2. FAULT DECISION (single ladder — no overlaps)
    else:
        if peaks >= 4 and smoothness > 0.8:
            print("FINAL → HIGH FAULT")
            classification = "High Fault Risk"
            confidence = max(confidence, 0.8)
            explanation = "Multiple sharp resonance peaks indicate severe structural deformation"

        elif peaks >= 2 and smoothness > 0.45:
            print("FINAL → MODERATE FAULT")
            classification = "Moderate Fault"
            confidence = max(confidence, 0.75)
            explanation = "Noticeable oscillations indicate possible winding displacement"

        elif smoothness > 0.2:
            print("FINAL → MINOR DEVIATION")
            classification = "Minor Deviation"
            confidence = max(confidence, 0.65)
            explanation = "Slight irregularities detected in FRA response"

    print("FINAL CLASS:", classification)

    return {
        "classification": classification,
        "confidence": confidence,
        "anomaly_score": anomaly_score,
        "probabilities": probabilities,
        "signals": {
            "std_flag": classification in {"Moderate Fault", "High Fault Risk"},
            "range_flag": classification in {"Minor Deviation", "Moderate Fault", "High Fault Risk"},
            "energy_flag": anomaly_score >= 0.8,
            "spectral_flag": anomaly_score >= 1.0,
        },
        "explanation": explanation,
        "model_source": "ml",
    }
