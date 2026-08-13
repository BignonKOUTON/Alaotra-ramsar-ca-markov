# 03 — Modélisation prospective CA-Markov

Ce dossier documente la démarche de modélisation prospective de l'occupation du sol à l'horizon 2045, réalisée avec **QGIS** et le plugin **MOLUSCE** (Modules for Land Use Change Simulations).

## 📋 Contenu

| Fichier | Description |
|---|---|
| `workflow_molusce.md` | Procédure pas-à-pas de la modélisation dans MOLUSCE |
| `variables_motrices.md` | Description des variables explicatives utilisées |
| `scenarios_2045.md` | Paramétrage des 3 scénarios prospectifs (BAU, SIA, SCE) |

## 🛠️ Outils utilisés

- **QGIS** version 3.16 LTR
- **Plugin MOLUSCE** (Modules for Land Use Change Simulations)
- Données d'entrée : cartes d'occupation du sol 2005 et 2015 (issues de GEE)

## 🎯 Résultats de validation

Kappa de simulation obtenus pour la période 2005-2025 :

| Scénario | Kappa |
|---|---|
| Business as Usual (BAU) | **0,79** |
| Conservation (SCE) | **0,83** |
| Intensification Agricole (SIA) | **0,91** |
