"""
========================================================
PROJET INTEGRE BI - ETAPE 6 : MODÉLISATION MACHINE LEARNING
Dataset : AI4I 2020 Predictive Maintenance
Groupe 7 — ESPRIT — PI2 LBC-BI 2025-2026
========================================================
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
import os
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix, roc_auc_score, roc_curve)

# Algorithmes
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC

# ─── Chemins ────────────────────────────────────────────────────────────────
PROJECT_DIR = r"C:\Users\user\Documents\pi bi 2"
INPUT_CSV   = os.path.join(PROJECT_DIR, "ai4i2020_cleaned.csv")
OUTPUT_DIR  = PROJECT_DIR
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── Style ──────────────────────────────────────────────────────────────────
plt.rcParams.update({
    'figure.facecolor': '#F8F9FA',
    'axes.facecolor':   '#FFFFFF',
    'axes.spines.top':  False,
    'axes.spines.right':False,
    'font.family':      'DejaVu Sans',
    'font.size':        10,
})
PALETTE = ['#2563EB', '#16A34A', '#DC2626', '#F59E0B', '#7C3AED']

print("=" * 60)
print("  ETAPE 6 — MODÉLISATION MACHINE LEARNING")
print("  Classification : Prédiction de panne machine")
print("=" * 60)

# ─── 1. CHARGEMENT ──────────────────────────────────────────────────────────
df = pd.read_csv(INPUT_CSV, encoding='utf-8-sig')
df.columns = df.columns.str.strip()
print(f"\n✔ Dataset chargé : {df.shape[0]} lignes × {df.shape[1]} colonnes")

# ─── 2. PRÉPARATION DES DONNÉES ─────────────────────────────────────────────
num_cols = [
    'Air temperature [K]',
    'Process temperature [K]',
    'Rotational speed [rpm]',
    'Torque [Nm]',
    'Tool wear [min]'
]

# Encodage Type
le = LabelEncoder()
df['Type_encoded'] = le.fit_transform(df['Type'])

# Features et cible
feature_cols = num_cols + ['Type_encoded']
X = df[feature_cols]
y = df['Machine failure']

print(f"\n✔ Features utilisées : {feature_cols}")
print(f"   Classe 0 (Pas de panne) : {(y==0).sum()}")
print(f"   Classe 1 (Panne)        : {(y==1).sum()}")
print(f"   Taux de panne           : {y.mean()*100:.2f}%")

# ─── 3. SPLIT TRAIN/TEST ────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\n✔ Split : Train={len(X_train)} | Test={len(X_test)}")

# Normalisation
scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc  = scaler.transform(X_test)

# ─── 4. DÉFINITION DES MODÈLES ──────────────────────────────────────────────
models = {
    'Arbre de Décision':  DecisionTreeClassifier(max_depth=5, random_state=42),
    'Random Forest':      RandomForestClassifier(n_estimators=100, random_state=42),
    'KNN':                KNeighborsClassifier(n_neighbors=5),
    'SVM':                SVC(kernel='rbf', probability=True, random_state=42)
}

results = {}

print("\n── Entraînement et évaluation des modèles ──")
for name, model in models.items():
    # Utiliser données normalisées pour KNN et SVM
    if name in ['KNN', 'SVM']:
        model.fit(X_train_sc, y_train)
        y_pred = model.predict(X_test_sc)
        y_prob = model.predict_proba(X_test_sc)[:, 1]
        cv_scores = cross_val_score(model, X_train_sc, y_train, cv=5, scoring='accuracy')
    else:
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')

    acc   = accuracy_score(y_test, y_pred)
    auc   = roc_auc_score(y_test, y_prob)
    cv_m  = cv_scores.mean()
    cm    = confusion_matrix(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    results[name] = {
        'model':    model,
        'y_pred':   y_pred,
        'y_prob':   y_prob,
        'accuracy': acc,
        'auc':      auc,
        'cv_mean':  cv_m,
        'cm':       cm,
        'report':   report,
        'scaled':   name in ['KNN', 'SVM']
    }

    print(f"\n   📊 {name}")
    print(f"      Accuracy  : {acc*100:.2f}%")
    print(f"      AUC-ROC   : {auc:.4f}")
    print(f"      CV (5-fold): {cv_m*100:.2f}% ± {cv_scores.std()*100:.2f}%")
    print(f"      Rapport   :\n{classification_report(y_test, y_pred)}")


# ─── FIGURE 1 : Comparaison des métriques ───────────────────────────────────
fig1, axes = plt.subplots(1, 3, figsize=(18, 6))
fig1.suptitle("FIGURE 1 — Comparaison des Algorithmes de Classification",
              fontsize=14, fontweight='bold', color='#1E3A5F')

names      = list(results.keys())
accuracies = [results[n]['accuracy']*100 for n in names]
aucs       = [results[n]['auc'] for n in names]
cv_means   = [results[n]['cv_mean']*100 for n in names]

# Accuracy
bars1 = axes[0].bar(names, accuracies, color=PALETTE[:4], edgecolor='white', linewidth=1.5)
axes[0].set_title("Accuracy (%)", fontweight='bold')
axes[0].set_ylim(80, 100)
axes[0].set_ylabel("Accuracy (%)")
axes[0].tick_params(axis='x', rotation=15)
for bar, v in zip(bars1, accuracies):
    axes[0].text(bar.get_x()+bar.get_width()/2, v+0.1,
                 f'{v:.2f}%', ha='center', fontweight='bold', fontsize=9)

# AUC-ROC
bars2 = axes[1].bar(names, aucs, color=PALETTE[:4], edgecolor='white', linewidth=1.5)
axes[1].set_title("AUC-ROC Score", fontweight='bold')
axes[1].set_ylim(0.5, 1.0)
axes[1].set_ylabel("AUC-ROC")
axes[1].tick_params(axis='x', rotation=15)
for bar, v in zip(bars2, aucs):
    axes[1].text(bar.get_x()+bar.get_width()/2, v+0.005,
                 f'{v:.4f}', ha='center', fontweight='bold', fontsize=9)

# Cross-Validation
bars3 = axes[2].bar(names, cv_means, color=PALETTE[:4], edgecolor='white', linewidth=1.5)
axes[2].set_title("Cross-Validation (5-fold) %", fontweight='bold')
axes[2].set_ylim(80, 100)
axes[2].set_ylabel("CV Accuracy (%)")
axes[2].tick_params(axis='x', rotation=15)
for bar, v in zip(bars3, cv_means):
    axes[2].text(bar.get_x()+bar.get_width()/2, v+0.1,
                 f'{v:.2f}%', ha='center', fontweight='bold', fontsize=9)

plt.tight_layout()
out1 = os.path.join(OUTPUT_DIR, "fig_ml1_comparaison.png")
plt.savefig(out1, dpi=150, bbox_inches='tight')
plt.close()
print(f"\n✔ Figure 1 sauvegardée : {out1}")


# ─── FIGURE 2 : Matrices de confusion ───────────────────────────────────────
fig2, axes2 = plt.subplots(1, 4, figsize=(20, 5))
fig2.suptitle("FIGURE 2 — Matrices de Confusion",
              fontsize=14, fontweight='bold', color='#1E3A5F')

for i, (name, res) in enumerate(results.items()):
    cm = res['cm']
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Pas de panne', 'Panne'],
                yticklabels=['Pas de panne', 'Panne'],
                linewidths=1, linecolor='white',
                annot_kws={'size': 12, 'fontweight': 'bold'},
                ax=axes2[i])
    axes2[i].set_title(name, fontweight='bold')
    axes2[i].set_xlabel("Prédit")
    axes2[i].set_ylabel("Réel")

plt.tight_layout()
out2 = os.path.join(OUTPUT_DIR, "fig_ml2_confusion.png")
plt.savefig(out2, dpi=150, bbox_inches='tight')
plt.close()
print(f"✔ Figure 2 sauvegardée : {out2}")


# ─── FIGURE 3 : Courbes ROC ─────────────────────────────────────────────────
fig3, ax3 = plt.subplots(figsize=(9, 7))
fig3.suptitle("FIGURE 3 — Courbes ROC",
              fontsize=14, fontweight='bold', color='#1E3A5F')

for i, (name, res) in enumerate(results.items()):
    fpr, tpr, _ = roc_curve(y_test, res['y_prob'])
    ax3.plot(fpr, tpr, color=PALETTE[i], linewidth=2,
             label=f"{name} (AUC = {res['auc']:.4f})")

ax3.plot([0, 1], [0, 1], 'k--', linewidth=1.5, label='Aléatoire (AUC = 0.5)')
ax3.set_xlabel("Taux de Faux Positifs (FPR)", fontsize=11)
ax3.set_ylabel("Taux de Vrais Positifs (TPR)", fontsize=11)
ax3.set_title("Courbes ROC — Comparaison des Modèles", fontweight='bold')
ax3.legend(loc='lower right', fontsize=10)
ax3.grid(True, alpha=0.3)

plt.tight_layout()
out3 = os.path.join(OUTPUT_DIR, "fig_ml3_roc.png")
plt.savefig(out3, dpi=150, bbox_inches='tight')
plt.close()
print(f"✔ Figure 3 sauvegardée : {out3}")


# ─── FIGURE 4 : Importance des features (Random Forest) ─────────────────────
fig4, ax4 = plt.subplots(figsize=(10, 6))
fig4.suptitle("FIGURE 4 — Importance des Variables (Random Forest)",
              fontsize=14, fontweight='bold', color='#1E3A5F')

rf_model     = results['Random Forest']['model']
importances  = rf_model.feature_importances_
feat_names   = [f.split(' [')[0] for f in feature_cols[:-1]] + ['Type']
sorted_idx   = np.argsort(importances)[::-1]

bars = ax4.bar([feat_names[i] for i in sorted_idx],
               [importances[i] for i in sorted_idx],
               color=PALETTE[:len(feat_names)], edgecolor='white', linewidth=1.5)
ax4.set_title("Importance des Variables", fontweight='bold')
ax4.set_ylabel("Importance")
ax4.set_xlabel("Variable")
for bar, v in zip(bars, sorted(importances, reverse=True)):
    ax4.text(bar.get_x()+bar.get_width()/2, v+0.002,
             f'{v:.3f}', ha='center', fontweight='bold', fontsize=9)

plt.tight_layout()
out4 = os.path.join(OUTPUT_DIR, "fig_ml4_importance.png")
plt.savefig(out4, dpi=150, bbox_inches='tight')
plt.close()
print(f"✔ Figure 4 sauvegardée : {out4}")


# ─── TABLEAU RÉCAPITULATIF ───────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  TABLEAU RÉCAPITULATIF DES RÉSULTATS")
print("=" * 60)
print(f"{'Algorithme':<25} {'Accuracy':>10} {'AUC-ROC':>10} {'CV (5-fold)':>12}")
print("-" * 60)
for name, res in results.items():
    print(f"{name:<25} {res['accuracy']*100:>9.2f}% {res['auc']:>10.4f} {res['cv_mean']*100:>11.2f}%")

# Meilleur modèle
best_name = max(results, key=lambda n: results[n]['auc'])
print(f"\n🏆 Meilleur modèle : {best_name}")
print(f"   AUC-ROC : {results[best_name]['auc']:.4f}")
print(f"   Accuracy : {results[best_name]['accuracy']*100:.2f}%")

print("\n" + "=" * 60)
print("  ✅ ETAPE 6 TERMINÉE — Tous les fichiers générés dans :")
print(f"  {OUTPUT_DIR}")
print("=" * 60)
