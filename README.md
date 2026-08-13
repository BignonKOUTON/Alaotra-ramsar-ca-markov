# 🌍 Alaotra Ramsar CA-Markov

**Modélisation prospective de la vulnérabilité socio-écologique et des conflits d'usage sur le site Ramsar 1312 (Lac Alaotra, Madagascar)**

*Diagnostic historique 2005-2025 et scénarios prospectifs à l'horizon 2045*

---

![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)
![Made with GEE](https://img.shields.io/badge/Made%20with-Google%20Earth%20Engine-blue)
![Made with R](https://img.shields.io/badge/Made%20with-R-276DC3)
![Master GRCA](https://img.shields.io/badge/Master-GRCA%20ULiège--UNamur-brightgreen)
![Status](https://img.shields.io/badge/Status-Active-success)

---

## 📖 À propos du projet

Ce dépôt contient l'ensemble des **scripts, méthodologies et données** produits dans le cadre du Travail de Fin d'Études du Master de spécialisation en **Gestion des Risques et Catastrophes à l'ère de l'Anthropocène (GRCA)** aux Universités de Liège et de Namur.

L'étude articule la **télédétection multi-temporelle** (Landsat 5/7/8 traités dans Google Earth Engine, classification par Random Forest) et la **modélisation prospective par automates cellulaires** (CA-Markov) pour cartographier les dynamiques socio-écologiques du bassin versant du lac Alaotra à Madagascar (1 679 958 hectares).

Trois scénarios contrastés sont projetés à l'horizon 2045 : **Business as Usual (BAU)**, **Intensification Agricole (SIA)** et **Conservation (SCE)**.

---

## 🎯 Chiffres clés

| Indicateur | Valeur |
|---|---|
| Zone d'étude | Site Ramsar 1312 — 1 679 958 ha |
| Période historique | 2005 — 2015 — 2025 |
| Horizon prospectif | 2045 |
| Classes d'occupation | 7 (EL, FO, GF, HI, MZ, RZ, SC) |
| Précision globale (RF) | **95,70 %** |
| Indice Kappa | **0,95** |
| Kappa de simulation (CA-Markov) | 0,79 – 0,91 |

---

## 🗂️ Structure du dépôt

alaotra-ramsar-ca-markov/
├── 01_gee_scripts/ # Scripts Google Earth Engine (JavaScript)
├── 02_r_analysis/ # Analyses statistiques R
├── 03_ca_markov/ # Modèle prospectif CA-Markov (QGIS + MOLUSCE)
├── 04_data/ # Données légères, métadonnées
├── 05_figures/ # Cartes exportées (PNG)
└── docs/ # Documentation méthodologique

---

## 🛠️ Méthodologie en 3 étapes

### 1️⃣ Analyse historique par télédétection (2005–2025)

- **Sources** : Landsat 5, 7 et 8 (30 m)
- **Traitement** : Google Earth Engine (masquage nuages, composites saison sèche)
- **Indices spectraux** : NDVI, MNDWI, NDBI
- **Classification** : Random Forest supervisé (250 arbres, 7 classes)
- **Validation** : matrice de confusion + indice Kappa

### 2️⃣ Modélisation prospective CA-Markov (2045)

- **Chaînes de Markov** : probabilités de transition inter-classes
- **Automates cellulaires** : spatialisation avec variables motrices
- **Variables motrices** : pente, distances euclidiennes aux cours d'eau, routes et localités
- **Calibration** : sur 2005-2015, validation sur 2025 observé
- **Projection** : trois scénarios contrastés à l'horizon 2045

### 3️⃣ Analyse des conflits d'usage et vulnérabilité socio-écologique

- Croisement carte 2045 × zonage Ramsar
- Identification des hotspots de vulnérabilité
- Typologie des conflits pêche/riziculture/élevage/conservation

---

## 📊 Résultats principaux

Les projections révèlent un **« paradoxe de l'expansion »** : sous le scénario d'intensification agricole (SIA), la riziculture progresse de + 148 000 ha, mais détruit 41 073 ha de marais — les infrastructures écologiques mêmes qui garantissent son irrigation. À l'inverse, le scénario de conservation (SCE) maintient 129 005 ha de zones humides fonctionnelles.

Cette étude fournit un **outil d'aide à la décision territorialisé** pour les gestionnaires du site Ramsar 1312 et les autorités de la région d'Alaotra-Mangoro.

---

## 📚 Comment citer ce travail

**Citation académique (APA)** :

> KOUTON, B. N. (2025). *Vulnérabilité socio-écologique et modélisation des conflits d'usage sur le site Ramsar du Lac Alaotra (Madagascar) : diagnostic historique et scénarios prospectifs à l'horizon 2045* [Mémoire de Master de spécialisation]. Universités de Liège et de Namur.

**Citation BibTeX** :

```bibtex
@mastersthesis{kouton2025alaotra,
  author  = {KOUTON, Bignon Nicanor},
  title   = {Vulnérabilité socio-écologique et modélisation des conflits d'usage sur le site Ramsar du Lac Alaotra (Madagascar) : diagnostic historique et scénarios prospectifs à l'horizon 2045},
  school  = {Universités de Liège et de Namur},
  year    = {2025},
  type    = {Mémoire de Master de spécialisation GRCA},
  address = {Liège, Belgique}
}
```

---

## 👥 Auteur et encadrement

**Auteur** — Bignon Nicanor **KOUTON**
Étudiant Master de spécialisation GRCA (ULiège-UNamur)
Doctorant à l'École Doctorale des Sciences Agronomiques et de l'Eau, Université de Parakou (Bénin)

**Promoteur** — Prof. Pierre **OZER**
Unité de recherche SPHERES, Département des Sciences et Gestion de l'Environnement, Université de Liège

---

## 🌐 Liens utiles

- 📄 **Mémoire complet sur MatheO ULiège** : 
- 🌍 **Fiche Ramsar du site 1312** : https://rsis.ramsar.org/ris/1312
- 🎓 **Master GRCA** : https://www.uliege.be/cms/c_9054334/fr/master-de-specialisation-en-gestion-des-risques-et-des-catastrophes

---

## 🏛️ Institutions & Financements

Ce travail a été rendu possible grâce au soutien de :

- **ARES — Académie de Recherche et d'Enseignement Supérieur** (Belgique) : bourse de mobilité Master GRCA
- **Fondation Roi Baudouin — Fonds Élisabeth et Amélie : financement de la mission de terrain à Madagascar

---

## 📄 Licence

Ce travail est distribué sous licence **Creative Commons Attribution 4.0 International (CC-BY 4.0)**.

Vous êtes libre de partager, copier, redistribuer et adapter ce travail, à condition d'en créditer l'auteur, d'indiquer les éventuelles modifications et de fournir un lien vers la licence.

Voir le fichier [LICENSE](LICENSE) pour les détails complets.

---

## 📮 Contact

Pour toute question, collaboration ou demande d'accès à des données non incluses :

📧 koutonbignonnicanor@gmail.com

---

*Dernière mise à jour : Aout 2026*

