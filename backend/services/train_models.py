import csv
import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset
except Exception as exc:  # pragma: no cover
    raise RuntimeError("PyTorch is required for training models. Install torch first.") from exc


LABELS = ["Normal", "Minor Deviation", "Moderate Fault", "High Fault Risk"]
LABEL_TO_ID = {k: i for i, k in enumerate(LABELS)}


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


def _parse_series(text: str):
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [float(v) for v in parsed]
    except Exception:
        pass
    return [float(v) for v in text.split() if v]


def _load_dataset(path: Path):
    xs, ys = [], []
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            series = _parse_series(row["series"])
            if len(series) != 500:
                continue
            label = row["label"]
            if label not in LABEL_TO_ID:
                continue
            xs.append(series)
            ys.append(LABEL_TO_ID[label])
    x = np.asarray(xs, dtype=np.float32)
    y = np.asarray(ys, dtype=np.int64)
    return x, y


def _render_summary_text(metrics: dict, dataset_info: dict | None = None) -> str:
    info = dataset_info or {}
    cnn = metrics["cnn"]
    cnn_report = cnn["classification_report"]
    cnn_cm = cnn["confusion_matrix"]

    ae = metrics["autoencoder"]
    ae_report = ae["classification_report"]
    ae_cm = ae["confusion_matrix"]

    lines = [
        "IntelliFRA Model Evaluation Summary",
        "",
        "Dataset Used for Training",
        f"- Total dataset rows (samples): {info.get('total_rows', 'N/A')}",
        f"- Points per sample (magnitude): {info.get('points_per_sample', 500)}",
        f"- Classes: Normal, Minor Deviation, Moderate Fault, High Fault Risk",
        f"- Samples per class (approx.): {info.get('per_class', 'N/A')}",
        f"- Train split (80%): {info.get('train_rows', 'N/A')} rows",
        f"- Validation split (20%): {info.get('val_rows', 'N/A')} rows",
        f"- CSV path: {info.get('csv_path', 'backend/data/fra_dataset.csv')}",
        "",
        "How the dataset was created (not web scraping)",
        "- Source type: Physics-inspired SFRA simulation (ladder winding model approximation).",
        "- We did NOT use web scraping, Kaggle downloads, or copied utility data for this file.",
        "- Script: backend/data/generate_dataset.py + backend/data/physics_fra_synthesis.py",
        "- Method:",
        "  * Log-spaced frequency grid (~1 kHz to 2 MHz), 500 points per curve.",
        "  * Multi-mode |H(f)| sum: Lorentzian peaks per disk (ladder-model proxy).",
        "  * Fault classes (literature-style): NF, DLF/LCF → Minor; RDF/IDF → Moderate; SCF → High.",
        "  * Capacitive roll-off, fault-specific mode shifts/broadening/splitting, SC short-circuit notch.",
        "  * Magnitudes scaled to [0, 30] for compatibility with the IntelliFRA pipeline.",
        "- Reference methodology: SFRA fault simulation taxonomy (e.g. MDPI Energies 2023, en16176347).",
        "- Regenerate: python data/generate_dataset.py --samples 50000",
        "  then: python services/train_models.py",
        "",
        "1D CNN Classification Metrics",
        f"- Accuracy: {cnn['accuracy']:.4f}",
        f"- Precision: {cnn['precision']:.4f}",
        f"- Recall: {cnn['recall']:.4f}",
        f"- F1 Score: {cnn['f1_score']:.4f}",
        "",
        "Per-Class Performance",
        "",
        "Class               Precision   Recall      F1 Score    Support",
        "---------------------------------------------------------------",
        f"Normal              {cnn_report['Normal']['precision']:.4f}      {cnn_report['Normal']['recall']:.4f}      {cnn_report['Normal']['f1-score']:.4f}      {int(cnn_report['Normal']['support'])}",
        f"Minor Deviation     {cnn_report['Minor Deviation']['precision']:.4f}      {cnn_report['Minor Deviation']['recall']:.4f}      {cnn_report['Minor Deviation']['f1-score']:.4f}      {int(cnn_report['Minor Deviation']['support'])}",
        f"Moderate Fault      {cnn_report['Moderate Fault']['precision']:.4f}      {cnn_report['Moderate Fault']['recall']:.4f}      {cnn_report['Moderate Fault']['f1-score']:.4f}      {int(cnn_report['Moderate Fault']['support'])}",
        f"High Fault Risk     {cnn_report['High Fault Risk']['precision']:.4f}      {cnn_report['High Fault Risk']['recall']:.4f}      {cnn_report['High Fault Risk']['f1-score']:.4f}      {int(cnn_report['High Fault Risk']['support'])}",
        "",
        "CNN Confusion Matrix",
        "[",
        f"  {cnn_cm[0]},",
        f"  {cnn_cm[1]},",
        f"  {cnn_cm[2]},",
        f"  {cnn_cm[3]}",
        "]",
        "",
        "Autoencoder Anomaly Detection Metrics",
        "- Positive class: Fault (non-Normal)",
        f"- Threshold: {ae['threshold']:.6f}",
        f"- Accuracy: {ae['accuracy']:.4f}",
        f"- Precision: {ae['precision']:.4f}",
        f"- Recall: {ae['recall']:.4f}",
        f"- F1 Score: {ae['f1_score']:.4f}",
        f"- Validation Normal Mean Error: {ae['normal_error_mean']:.6f}",
        f"- Validation Fault Mean Error: {ae['fault_error_mean']:.6f}",
        "",
        "AE Class Performance",
        "",
        "Class        Precision   Recall      F1 Score    Support",
        "--------------------------------------------------------",
        f"Normal       {ae_report['Normal']['precision']:.4f}      {ae_report['Normal']['recall']:.4f}      {ae_report['Normal']['f1-score']:.4f}      {int(ae_report['Normal']['support'])}",
        f"Fault        {ae_report['Fault']['precision']:.4f}      {ae_report['Fault']['recall']:.4f}      {ae_report['Fault']['f1-score']:.4f}      {int(ae_report['Fault']['support'])}",
        "",
        "AE Confusion Matrix",
        "Rows: true [Normal, Fault], Columns: predicted [Normal, Fault]",
        "[",
        f"  {ae_cm[0]},",
        f"  {ae_cm[1]}",
        "]",
        "",
        "Source",
        "- backend/models/training_metrics.json",
    ]
    return "\n".join(lines) + "\n"


def train() -> None:
    base = Path(__file__).resolve().parents[1]
    data_path = base / "data" / "fra_dataset.csv"
    model_dir = base / "models"
    model_dir.mkdir(parents=True, exist_ok=True)

    x, y = _load_dataset(data_path)
    if len(x) == 0:
        raise RuntimeError("Dataset is empty. Run data/generate_dataset.py first.")

    dataset_mean = float(x.mean())
    dataset_std = float(x.std() + 1e-6)
    sample_mean = np.mean(x, axis=1, keepdims=True)
    sample_std = np.std(x, axis=1, keepdims=True)
    x_norm = (x - sample_mean) / (sample_std + 1e-6)

    rng = np.random.default_rng(42)
    perm = rng.permutation(len(x_norm))
    x_norm = x_norm[perm]
    y = y[perm]

    split = int(0.8 * len(x_norm))
    train_x, val_x = x_norm[:split], x_norm[split:]
    train_y, val_y = y[:split], y[split:]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    cnn = FRA1DCNN().to(device)
    optimizer = torch.optim.Adam(cnn.parameters(), lr=1e-3)
    criterion = nn.CrossEntropyLoss()

    train_ds = TensorDataset(
        torch.from_numpy(train_x).unsqueeze(1),
        torch.from_numpy(train_y),
    )
    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
    val_ds = TensorDataset(
        torch.from_numpy(val_x).unsqueeze(1),
        torch.from_numpy(val_y),
    )
    val_loader = DataLoader(val_ds, batch_size=64, shuffle=False)

    for epoch in range(20):
        cnn.train()
        train_correct = 0
        train_total = 0
        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device)
            optimizer.zero_grad()
            logits = cnn(xb)
            loss = criterion(logits, yb)
            loss.backward()
            optimizer.step()
            preds = logits.argmax(dim=1)
            train_correct += int((preds == yb).sum().item())
            train_total += int(yb.size(0))

        cnn.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for xb, yb in val_loader:
                xb, yb = xb.to(device), yb.to(device)
                logits = cnn(xb)
                preds = logits.argmax(dim=1)
                val_correct += int((preds == yb).sum().item())
                val_total += int(yb.size(0))
        train_acc_epoch = (train_correct / train_total) if train_total else 0.0
        val_acc_epoch = (val_correct / val_total) if val_total else 0.0
        print(f"Epoch {epoch + 1:02d}/20 - train_acc={train_acc_epoch:.4f} val_acc={val_acc_epoch:.4f}")

    cnn.eval()
    with torch.no_grad():
        val_tensor = torch.from_numpy(val_x).unsqueeze(1).to(device)
        val_logits = cnn(val_tensor)
        val_pred = val_logits.argmax(dim=1).cpu().numpy()
        val_acc = float((val_pred == val_y).mean()) if len(val_y) else 0.0
    report = classification_report(
        val_y,
        val_pred,
        labels=list(range(len(LABELS))),
        target_names=LABELS,
        output_dict=True,
        zero_division=0,
    )
    cm = confusion_matrix(val_y, val_pred, labels=list(range(len(LABELS))))
    precision, recall, f1, _ = precision_recall_fscore_support(
        val_y,
        val_pred,
        average="weighted",
        zero_division=0,
    )

    autoencoder = FRAAutoencoder().to(device)
    ae_opt = torch.optim.Adam(autoencoder.parameters(), lr=1e-3)
    ae_loss = nn.MSELoss()

    normal_mask = train_y == LABEL_TO_ID["Normal"]
    ae_train_x = train_x[normal_mask] if normal_mask.any() else train_x
    ae_ds = TensorDataset(torch.from_numpy(ae_train_x))
    ae_loader = DataLoader(ae_ds, batch_size=32, shuffle=True)

    autoencoder.train()
    for _ in range(20):
        for (xb,) in ae_loader:
            xb = xb.to(device)
            ae_opt.zero_grad()
            recon = autoencoder(xb)
            loss = ae_loss(recon, xb)
            loss.backward()
            ae_opt.step()

    autoencoder.eval()
    with torch.no_grad():
        ae_train_tensor = torch.from_numpy(ae_train_x).to(device)
        recon_train = autoencoder(ae_train_tensor)
        train_err = ((recon_train - ae_train_tensor) ** 2).mean(dim=1).cpu().numpy()
        ae_threshold = float(np.percentile(train_err, 95))

        val_ae_tensor = torch.from_numpy(val_x).to(device)
        recon_val = autoencoder(val_ae_tensor)
        val_err = ((recon_val - val_ae_tensor) ** 2).mean(dim=1).cpu().numpy()

    ae_true = (val_y != LABEL_TO_ID["Normal"]).astype(np.int64)
    ae_pred = (val_err >= ae_threshold).astype(np.int64)
    ae_acc = float(np.mean(ae_true == ae_pred)) if len(ae_true) else 0.0
    ae_precision, ae_recall, ae_f1, _ = precision_recall_fscore_support(
        ae_true,
        ae_pred,
        average="binary",
        zero_division=0,
    )
    ae_report = classification_report(
        ae_true,
        ae_pred,
        labels=[0, 1],
        target_names=["Normal", "Fault"],
        output_dict=True,
        zero_division=0,
    )
    ae_cm = confusion_matrix(ae_true, ae_pred, labels=[0, 1])
    normal_val_err = val_err[ae_true == 0]
    fault_val_err = val_err[ae_true == 1]

    torch.save(cnn.state_dict(), model_dir / "cnn_model.pth")
    torch.save(autoencoder.state_dict(), model_dir / "autoencoder.pth")

    meta = {
        "labels": LABELS,
        "mean": dataset_mean,
        "std": dataset_std,
        "ae_threshold": ae_threshold,
        "cnn_val_accuracy": val_acc,
        "ae_val_accuracy": ae_acc,
    }
    with (model_dir / "ml_meta.json").open("w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    metrics = {
        "cnn": {
            "accuracy": float(np.mean(val_y == val_pred)),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "classification_report": report,
            "confusion_matrix": cm.tolist(),
        },
        "autoencoder": {
            "threshold": float(ae_threshold),
            "accuracy": float(ae_acc),
            "precision": float(ae_precision),
            "recall": float(ae_recall),
            "f1_score": float(ae_f1),
            "normal_error_mean": float(normal_val_err.mean()) if len(normal_val_err) else 0.0,
            "fault_error_mean": float(fault_val_err.mean()) if len(fault_val_err) else 0.0,
            "classification_report": ae_report,
            "confusion_matrix": ae_cm.tolist(),
        },
    }

    os.makedirs(model_dir, exist_ok=True)
    with (model_dir / "training_metrics.json").open("w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=4)

    df = pd.DataFrame(report).transpose()
    df.to_csv(model_dir / "training_metrics.csv")

    pd.DataFrame(cm).to_csv(model_dir / "confusion_matrix.csv", index=False)
    pd.DataFrame(ae_report).transpose().to_csv(model_dir / "autoencoder_metrics.csv")
    pd.DataFrame(ae_cm).to_csv(model_dir / "autoencoder_confusion_matrix.csv", index=False)

    report_text = classification_report(
        val_y,
        val_pred,
        labels=list(range(len(LABELS))),
        target_names=LABELS,
        digits=4,
        zero_division=0,
    )
    ae_report_text = classification_report(
        ae_true,
        ae_pred,
        labels=[0, 1],
        target_names=["Normal", "Fault"],
        digits=4,
        zero_division=0,
    )

    per_class = len(x) // len(LABELS) if len(LABELS) else 0
    dataset_info = {
        "total_rows": len(x),
        "points_per_sample": 500,
        "per_class": per_class,
        "train_rows": len(train_x),
        "val_rows": len(val_x),
        "csv_path": str(data_path.relative_to(base.parent.parent)),
    }
    summary_text = _render_summary_text(metrics, dataset_info)
    with (model_dir / "training_metrics_summary.txt").open("w", encoding="utf-8") as f:
        f.write(summary_text)
    with (base.parent.parent / "model_accuracy.txt").open("w", encoding="utf-8") as f:
        f.write(summary_text)

    print(f"Saved models in {model_dir}")
    print(f"CNN validation accuracy: {val_acc:.4f}")
    print(f"AE threshold: {ae_threshold:.6f}")

    print("\n===== TRAINING SUMMARY =====")
    print(f"Accuracy: {metrics['cnn']['accuracy']:.4f}")
    print(f"Precision: {metrics['cnn']['precision']:.4f}")
    print(f"Recall: {metrics['cnn']['recall']:.4f}")
    print(f"F1 Score: {metrics['cnn']['f1_score']:.4f}")
    print("\nConfusion Matrix:")
    print(cm)
    print("\nClassification report:")
    print(report_text)
    print("\n===== AUTOENCODER SUMMARY =====")
    print(f"Threshold: {metrics['autoencoder']['threshold']:.6f}")
    print(f"Accuracy: {metrics['autoencoder']['accuracy']:.4f}")
    print(f"Precision: {metrics['autoencoder']['precision']:.4f}")
    print(f"Recall: {metrics['autoencoder']['recall']:.4f}")
    print(f"F1 Score: {metrics['autoencoder']['f1_score']:.4f}")
    print("\nAE Confusion Matrix:")
    print(ae_cm)
    print("\nAE Classification report:")
    print(ae_report_text)


if __name__ == "__main__":
    train()
