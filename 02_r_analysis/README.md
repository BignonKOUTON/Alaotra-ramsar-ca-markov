# 02 — Analyses statistiques R

Ce dossier contient les scripts R utilisés pour les analyses post-classification et la production des figures.

## 📋 Contenu

| Fichier | Description |
|---|---|
| `analyses_transition.R` | Calcul des matrices de transition 2005-2015-2025, indices Kappa, statistiques descriptives et graphiques de dynamique paysagère |

## 🚀 Comment exécuter

1. Installer [R](https://www.r-project.org/) et [RStudio](https://posit.co/download/rstudio-desktop/)
2. Ouvrir le fichier `.R` dans RStudio
3. Installer les packages nécessaires (indiqués en début de script)
4. Adapter les chemins vers vos données locales
5. Exécuter ligne par ligne (Ctrl+Enter)

## 📦 Packages R utilisés

Les packages nécessaires sont chargés en début de script. Principaux packages :
- `raster` / `terra` — manipulation de données raster
- `sf` — vecteurs géospatiaux
- `dplyr` — manipulation de données
- `ggplot2` — visualisation
