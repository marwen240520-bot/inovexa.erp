"""
========================================================
PROJET INTEGRE BI - ETAPE 2 : PRE-TRAITEMENT DES DONNEES
Dataset : AI4I 2020 Predictive Maintenance
Groupe 7 — ESPRIT — PI2 LBC-BI 2025-2026
========================================================
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from scipy import stats
from sklearn.preprocessing import MinMaxScaler, StandardScaler, LabelEncoder
from sklearn.decomposition import PCA
import os

# ─── Chemins du projet ───────────────────────────────────────────────────────
PROJECT_DIR = r"C:\Users\user\Documents\pi bi 2"
INPUT_CSV   = os.path.join(PROJECT_DIR, "ai4i2020.csv")
OUTPUT_DIR  = PROJECT_DIR   # les figures et CSV seront dans le même dossier
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── Style global ────────────────────────────────────────────────────────────
plt.rcParams.update({
    'figure.facecolor': '#F8F9FA',
    'axes.facecolor':   '#FFFFFF',
    'axes.spines.top':  False,
    'axes.spines.right':False,
    'font.family':      'DejaVu Sans',
    'font.size':        10,
})
PALETTE = ['#2563EB', '#16A34A', '#DC2626', '#F59E0B', '#7C3AED']

# ─── 1. CHARGEMENT ───────────────────────────────────────────────────────────
print("=" * 60)
print("  ETAPE 2 — PRE-TRAITEMENT DES DONNEES")
print("  Dataset : AI4I 2020 Predictive Maintenance")
print("=" * 60)

# encoding='utf-8-sig' gère automatiquement le BOM (﻿) du fichier CSV
df = pd.read_csv(INPUT_CSV, encoding='utf-8-sig')

# Nettoyer les espaces dans les noms de colonnes (précaution)
df.columns = df.columns.str.strip()

print(f"\n✔  Dataset chargé  → {df.shape[0]} lignes × {df.shape[1]} colonnes")
print(f"   Colonnes : {df.columns.tolist()}\n")

# Colonnes numériques utilisées dans tout le script
num_cols = [
    'Air temperature [K]',
    'Process temperature [K]',
    'Rotational speed [rpm]',
    'Torque [Nm]',
    'Tool wear [min]'
]

# Vérification que toutes les colonnes attendues existent
missing_cols = [c for c in num_cols + ['Type', 'Machine failure',
                'TWF', 'HDF', 'PWF', 'OSF', 'RNF'] if c not in df.columns]
if missing_cols:
    print(f"⚠️  Colonnes introuvables : {missing_cols}")
    print(f"   Colonnes disponibles  : {df.columns.tolist()}")
    raise SystemExit("Corrigez les noms de colonnes avant de continuer.")
else:
    print("✔  Toutes les colonnes attendues sont présentes.\n")


# ─── FIGURE 1 : Aperçu général ───────────────────────────────────────────────
fig1, axes = plt.subplots(1, 3, figsize=(16, 4))
fig1.suptitle("FIGURE 1 — Aperçu général du dataset", fontsize=13,
              fontweight='bold', color='#1E3A5F', y=1.02)

# 1a — Répartition des types de produit
type_counts = df['Type'].value_counts()
axes[0].bar(type_counts.index, type_counts.values,
            color=PALETTE[:3], edgecolor='white', linewidth=1.5)
axes[0].set_title("Répartition des types de produit", fontweight='bold')
axes[0].set_xlabel("Type")
axes[0].set_ylabel("Nombre d'enregistrements")
for i, (k, v) in enumerate(type_counts.items()):
    axes[0].text(i, v + 50, str(v), ha='center', fontweight='bold', color='#1E3A5F')

# 1b — Distribution Machine failure
fail_counts = df['Machine failure'].value_counts().sort_index()
axes[1].pie(
    fail_counts.values,
    labels=['Pas de panne (0)', 'Panne (1)'],
    autopct='%1.1f%%',
    colors=['#16A34A', '#DC2626'],
    startangle=90,
    wedgeprops=dict(edgecolor='white', linewidth=2)
)
axes[1].set_title("Distribution Machine failure", fontweight='bold')

# 1c — Modes de défaillance
failure_modes = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
fm_counts = [int(df[c].sum()) for c in failure_modes]
bars = axes[2].barh(failure_modes, fm_counts,
                    color=PALETTE, edgecolor='white', linewidth=1.5)
axes[2].set_title("Modes de défaillance", fontweight='bold')
axes[2].set_xlabel("Nombre de pannes")
for bar, v in zip(bars, fm_counts):
    axes[2].text(v + 0.5, bar.get_y() + bar.get_height() / 2,
                 str(v), va='center', fontweight='bold')

plt.tight_layout()
out1 = os.path.join(OUTPUT_DIR, "fig1_apercu_general.png")
plt.savefig(out1, dpi=150, bbox_inches='tight')
plt.close()
print(f"✔  Figure 1 sauvegardée : {out1}")


# ─── 2. VALEURS MANQUANTES ───────────────────────────────────────────────────
print("\n── Valeurs manquantes ──")
missing = df.isnull().sum()
if missing.any():
    print(missing[missing > 0])
else:
    print("   Aucune valeur manquante détectée ✔")


# ─── FIGURE 2 : Distributions des variables numériques ───────────────────────
fig2, axes2 = plt.subplots(2, 5, figsize=(20, 7))
fig2.suptitle("FIGURE 2 — Distribution & Boxplots des variables numériques",
              fontsize=13, fontweight='bold', color='#1E3A5F')

for i, col in enumerate(num_cols):
    short = col.split(' [')[0]

    # Histogramme
    axes2[0, i].hist(df[col], bins=40, color=PALETTE[i],
                     edgecolor='white', alpha=0.85)
    axes2[0, i].set_title(short, fontsize=9, fontweight='bold')
    axes2[0, i].set_ylabel("Fréquence")

    # Boxplot
    bp = axes2[1, i].boxplot(df[col], patch_artist=True, vert=True, widths=0.5)
    for patch in bp['boxes']:
        patch.set_facecolor(PALETTE[i])
        patch.set_alpha(0.7)
    for elem in ['whiskers', 'caps', 'medians', 'fliers']:
        plt.setp(bp[elem], color='#1E3A5F')
    axes2[1, i].set_xticks([])
    axes2[1, i].set_ylabel("Valeur")

plt.tight_layout()
out2 = os.path.join(OUTPUT_DIR, "fig2_distributions.png")
plt.savefig(out2, dpi=150, bbox_inches='tight')
plt.close()
print(f"✔  Figure 2 sauvegardée : {out2}")


# ─── 3. DÉTECTION ET TRAITEMENT DES OUTLIERS ─────────────────────────────────
print("\n── Détection des outliers (Z-score > 3) ──")
df_clean = df.copy()

for col in num_cols:
    z = np.abs(stats.zscore(df_clean[col]))
    n_out = int((z > 3).sum())
    print(f"   {col:<40} {n_out:>4} outliers")
    if n_out > 0:
        median_val = df_clean[col].median()
        df_clean.loc[z > 3, col] = median_val
        print(f"      → remplacés par la médiane ({median_val:.2f})")

# ─── FIGURE 3 : Avant / Après traitement des outliers ────────────────────────
fig3, axes3 = plt.subplots(2, 5, figsize=(20, 7))
fig3.suptitle("FIGURE 3 — Avant / Après traitement des outliers",
              fontsize=13, fontweight='bold', color='#1E3A5F')

for i, col in enumerate(num_cols):
    short = col.split(' [')[0]
    for row, (data, label) in enumerate([(df[col], 'Avant'), (df_clean[col], 'Après')]):
        color = '#DC2626' if row == 0 else '#16A34A'
        bp = axes3[row, i].boxplot(data, patch_artist=True, widths=0.5)
        for patch in bp['boxes']:
            patch.set_facecolor(color)
            patch.set_alpha(0.6)
        for elem in ['whiskers', 'caps', 'medians', 'fliers']:
            plt.setp(bp[elem], color='#1E3A5F')
        axes3[row, i].set_title(f"{short}\n({label})", fontsize=8, fontweight='bold')
        axes3[row, i].set_xticks([])

plt.tight_layout()
out3 = os.path.join(OUTPUT_DIR, "fig3_outliers.png")
plt.savefig(out3, dpi=150, bbox_inches='tight')
plt.close()
print(f"✔  Figure 3 sauvegardée : {out3}")


# ─── 4. ENCODAGE DES VARIABLES CATÉGORIELLES ─────────────────────────────────
print("\n── Encodage des variables catégorielles ──")
le = LabelEncoder()
df_clean['Type_encoded'] = le.fit_transform(df_clean['Type'])
mapping = dict(zip(le.classes_, le.transform(le.classes_)))
print(f"   Label Encoding — Type → {mapping}")

df_encoded = pd.get_dummies(df_clean, columns=['Type'], prefix='Type')
ohe_cols = [c for c in df_encoded.columns if c.startswith('Type_')]
print(f"   One-Hot Encoding appliqué : {ohe_cols}")


# ─── 5. NORMALISATION ────────────────────────────────────────────────────────
print("\n── Normalisation des variables numériques ──")
scaler_mm  = MinMaxScaler()
scaler_std = StandardScaler()

df_minmax = pd.DataFrame(
    scaler_mm.fit_transform(df_clean[num_cols]),
    columns=num_cols
)
df_zscore = pd.DataFrame(
    scaler_std.fit_transform(df_clean[num_cols]),
    columns=num_cols
)

print("   Min-Max Scaler  → plage [0, 1]")
print("   Standard Scaler → moyenne=0, écart-type=1")
print(df_minmax.describe().round(3))

# ─── FIGURE 4 : Comparaison Original / MinMax / Z-score ──────────────────────
fig4, axes4 = plt.subplots(3, 5, figsize=(20, 10))
fig4.suptitle("FIGURE 4 — Comparaison des normalisations",
              fontsize=13, fontweight='bold', color='#1E3A5F')

labels_rows = ['Original', 'Min-Max [0,1]', 'Z-Score (μ=0, σ=1)']
data_rows   = [df_clean[num_cols], df_minmax, df_zscore]
colors_rows = [PALETTE[0], PALETTE[1], PALETTE[2]]

for row, (data, label, color) in enumerate(zip(data_rows, labels_rows, colors_rows)):
    for col_i, col in enumerate(num_cols):
        axes4[row, col_i].hist(data[col], bins=35, color=color,
                               edgecolor='white', alpha=0.8)
        if row == 0:
            axes4[row, col_i].set_title(col.split(' [')[0],
                                        fontsize=9, fontweight='bold')
        if col_i == 0:
            axes4[row, col_i].set_ylabel(label, fontsize=9, fontweight='bold')

plt.tight_layout()
out4 = os.path.join(OUTPUT_DIR, "fig4_normalisation.png")
plt.savefig(out4, dpi=150, bbox_inches='tight')
plt.close()
print(f"✔  Figure 4 sauvegardée : {out4}")


# ─── 6. MATRICE DE CORRÉLATION ───────────────────────────────────────────────
fig5, ax5 = plt.subplots(figsize=(10, 8))
fig5.suptitle("FIGURE 5 — Matrice de corrélation",
              fontsize=13, fontweight='bold', color='#1E3A5F')

corr_cols   = num_cols + ['Machine failure']
corr_matrix = df_clean[corr_cols].corr()
mask        = np.triu(np.ones_like(corr_matrix, dtype=bool))

sns.heatmap(corr_matrix, mask=mask, annot=True, fmt='.2f',
            cmap='RdYlGn', center=0, vmin=-1, vmax=1,
            linewidths=0.5, linecolor='#E5E7EB',
            annot_kws={'size': 10, 'fontweight': 'bold'},
            ax=ax5)
ax5.set_xticklabels(ax5.get_xticklabels(), rotation=30, ha='right')
ax5.set_yticklabels(ax5.get_yticklabels(), rotation=0)

plt.tight_layout()
out5 = os.path.join(OUTPUT_DIR, "fig5_correlation.png")
plt.savefig(out5, dpi=150, bbox_inches='tight')
plt.close()
print(f"✔  Figure 5 sauvegardée : {out5}")


# ─── 7. RÉDUCTION DE DIMENSIONNALITÉ (PCA) ───────────────────────────────────
print("\n── Réduction de dimensionnalité (ACP/PCA) ──")
X_scaled = scaler_std.fit_transform(df_clean[num_cols])

pca_full = PCA()
pca_full.fit(X_scaled)
explained   = pca_full.explained_variance_ratio_
cumulative  = np.cumsum(explained)

print("   Variance expliquée par composante :")
for i, (e, c) in enumerate(zip(explained, cumulative)):
    print(f"   PC{i+1}: {e*100:.1f}%   (cumulé: {c*100:.1f}%)")

# PCA 2D pour visualisation
pca2  = PCA(n_components=2)
X_pca = pca2.fit_transform(X_scaled)

# ─── FIGURE 6 : PCA ──────────────────────────────────────────────────────────
fig6, (ax6a, ax6b) = plt.subplots(1, 2, figsize=(14, 5))
fig6.suptitle("FIGURE 6 — Réduction de dimensionnalité (ACP)",
              fontsize=13, fontweight='bold', color='#1E3A5F')

# Variance expliquée
n_comp = len(explained)
ax6a.bar([f'PC{i+1}' for i in range(n_comp)], explained * 100,
         color=PALETTE[:n_comp], edgecolor='white', linewidth=1.5, alpha=0.85)
ax6b_twin = ax6a.twinx()
ax6b_twin.plot([f'PC{i+1}' for i in range(n_comp)], cumulative * 100,
               'o--', color='#1E3A5F', linewidth=2, markersize=7, label='Cumulé')
ax6b_twin.set_ylabel("Variance cumulée (%)", color='#1E3A5F')
ax6b_twin.set_ylim(0, 110)
ax6a.set_title("Variance expliquée par composante", fontweight='bold')
ax6a.set_ylabel("Variance expliquée (%)")
ax6a.set_ylim(0, 60)
for i, v in enumerate(explained * 100):
    ax6a.text(i, v + 0.5, f'{v:.1f}%', ha='center', fontweight='bold', fontsize=9)

# Projection 2D
colors_pca = ['#16A34A' if f == 0 else '#DC2626'
              for f in df_clean['Machine failure']]
ax6b.scatter(X_pca[:, 0], X_pca[:, 1], c=colors_pca,
             alpha=0.4, s=8, edgecolors='none')
ax6b.set_title("Projection 2D (PC1 vs PC2)", fontweight='bold')
ax6b.set_xlabel(f"PC1 ({explained[0]*100:.1f}% var.)")
ax6b.set_ylabel(f"PC2 ({explained[1]*100:.1f}% var.)")
ax6b.legend(
    handles=[
        mpatches.Patch(color='#16A34A', label='No failure'),
        mpatches.Patch(color='#DC2626', label='Failure')
    ],
    loc='upper right'
)

plt.tight_layout()
out6 = os.path.join(OUTPUT_DIR, "fig6_pca.png")
plt.savefig(out6, dpi=150, bbox_inches='tight')
plt.close()
print(f"✔  Figure 6 sauvegardée : {out6}")


# ─── 8. EXPORT DU DATASET NETTOYÉ ────────────────────────────────────────────
out_csv = os.path.join(OUTPUT_DIR, "ai4i2020_cleaned.csv")
df_clean.to_csv(out_csv, index=False, encoding='utf-8-sig')
print(f"\n✔  Dataset nettoyé exporté : {out_csv}")
print(f"   Dimensions finales : {df_clean.shape[0]} lignes × {df_clean.shape[1]} colonnes")

print("\n" + "=" * 60)
print("  ✅  ETAPE 2 TERMINÉE — Tous les fichiers générés dans :")
print(f"  {OUTPUT_DIR}")
print("=" * 60)