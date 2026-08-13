# 01 — Scripts Google Earth Engine

Ce dossier contient les 3 scripts JavaScript exécutés dans l'éditeur de code de [Google Earth Engine](https://code.earthengine.google.com/).

## 📋 Contenu

| Fichier | Description |
|---|---|
| `01_classification_2005.js` | Classification Random Forest de l'occupation du sol pour 2005 (Landsat 5) |
| `02_classification_2015.js` | Classification Random Forest pour 2015 (Landsat 8) |
| `03_classification_2025.js` | Classification Random Forest pour 2025 (Landsat 8/9) |

## 🚀 Comment exécuter ces scripts

1. Créer un compte gratuit sur [Google Earth Engine](https://earthengine.google.com/)
2. Ouvrir l'[éditeur de code GEE](https://code.earthengine.google.com/)
3. Copier-coller le contenu d'un script `.js` dans l'éditeur
4. Cliquer sur **Run** ▶️

## ⚙️ Paramètres méthodologiques

- **Zone d'étude** : buffer de 10 km autour du site Ramsar 1312
- **Période de filtrage** : saison sèche (mai-octobre)
- **Masquage nuages** : bande QA_PIXEL
- **Indices spectraux** : NDVI, MNDWI, NDBI
- **Variables topographiques** : altitude et pente (SRTM 30m)
- **Algorithme** : Random Forest — 250 arbres
- **Classes** : 7 (EL, FO, GF, HI, MZ, RZ, SC)

## 📊 Performances

- Précision globale : **95,70 %**
- Indice Kappa : **0,95**
