

// ==============================================================================
// SCRIPT GEE : CLASSIFICATION AVANCÉE 7 CLASSES ET EXPORTS MULTIPLES
// ==============================================================================

// --- PRÉREQUIS (À vérifier dans l'onglet 'Assets' à gauche) ---
// 1. Importez votre KML/Shapefile de zone d'étude et renommez la variable en 'roi'
// 2. Importez vos points d'entraînement et renommez la variable en 'training_points'
//    (Ce fichier doit impérativement contenir une colonne nommée 'class' de 1 à 7)

// ==============================================================================
// 1. PARAMÈTRES DE BASE ET EXPORT
// ==============================================================================
// Définition du chemin d'exportation exact dans votre Google Drive
var dossier_export = 'GRCA/TFE Madagascar/TFE Process/GEE/2025';

var annee_etude = 2025; // Modifiable pour l'analyse historique
var date_debut = annee_etude + '-05-01'; // Saison sèche
var date_fin = annee_etude + '-10-31';

print("Démarrage de la classification pour l'année : " + annee_etude);

// ==============================================================================
// 2. PRÉPARATION DES DONNÉES SATELLITAIRES ET TOPOGRAPHIQUES
// ==============================================================================

// Fonction de correction et masquage (Landsat 8 & 9 Collection 2)
function prepLandsat(image) {
  var qa = image.select('QA_PIXEL');
  var cloudShadowBitMask = (1 << 4);
  var cloudsBitMask = (1 << 3);
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
    .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  
  // Application des facteurs d'échelle de réflectance de surface
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  return image.addBands(opticalBands, null, true).updateMask(mask);
}

// Récupération et mosaïquage des images
var collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .merge(ee.ImageCollection('LANDSAT/LC09/C02/T1_L2'))
  .filterBounds(roi)
  .filterDate(date_debut, date_fin)
  .filter(ee.Filter.lt('CLOUD_COVER', 15))
  .map(prepLandsat);

var mosaique = collection.median().clip(roi);

// --- INDICES SPECTRAUX ---
var ndvi = mosaique.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');   // Végétation
var mndwi = mosaique.normalizedDifference(['SR_B3', 'SR_B6']).rename('MNDWI'); // Eau libre
var ndbi = mosaique.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI');   // Bâti

// --- TOPOGRAPHIE (SRTM 30m) ---
var srtm = ee.Image('USGS/SRTMGL1_003').clip(roi);
var elevation = srtm.select('elevation').rename('Altitude');
var slope = ee.Terrain.slope(srtm).rename('Pente');

// Regroupement de toutes les couches
var image_predicteurs = mosaique.addBands([ndvi, mndwi, ndbi, elevation, slope]);

var bandes_rf = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7', 'NDVI', 'MNDWI', 'NDBI', 'Altitude', 'Pente'];

// ==============================================================================
// 3. ENTRAÎNEMENT ET CLASSIFICATION (RANDOM FOREST)
// ==============================================================================
print("Extraction des signatures pour les 7 classes...");

var training = image_predicteurs.select(bandes_rf).sampleRegions({
  collection: training_points,
  properties: ['class'], 
  scale: 30, 
  tileScale: 16 
});

print("Calcul du modèle Random Forest (250 arbres)...");
var classifier = ee.Classifier.smileRandomForest(250).train({
  features: training,
  classProperty: 'class',
  inputProperties: bandes_rf
});

// Application du modèle
var image_classee = image_predicteurs.select(bandes_rf).classify(classifier);

// ==============================================================================
// 4. POST-TRAITEMENT : TAMISAGE 3X3 PIXELS
// ==============================================================================
print("Lissage spatial : Tamisage 3x3...");

// Filtre modal : radius 1 = fenêtre de 3x3 pixels
var image_tamisee = image_classee.focalMode({
  radius: 1,
  kernelType: 'square',
  units: 'pixels'
}).rename('Classification');

// ==============================================================================
// 5. VISUALISATION AVEC SYMBOLOGIE SIG SÉMANTIQUE
// ==============================================================================

var palette_sig = [
  '0000FF', // 1: Eau libre
  '006400', // 2: Forêt
  '32CD32', // 3: Galerie forestière
  'FF0000', // 4: Habitations et infrastructures
  '00FFFF', // 5: Marais et zones humides
  'FFFF00', // 6: Rizicultures
  'DEB887'  // 7: Savanes et cultures pluviales 
];

Map.centerObject(roi, 11);
Map.addLayer(mosaique, {bands: ['SR_B4', 'SR_B3', 'SR_B2'], min: 0, max: 0.15}, 'Image Landsat (Vraies Couleurs)', false);
Map.addLayer(image_tamisee, {min: 1, max: 7, palette: palette_sig}, 'Classification 7 Classes (Symbologie SIG)');

// ==============================================================================
// 6. EXPORTATIONS MULTIPLES VERS GOOGLE DRIVE (CORRIGÉ)
// ==============================================================================
print("Prêt pour l'export. Cliquez sur 'Run' dans l'onglet 'Tasks' à droite pour les 9 couches.");

// Fonction simplifiée pour exporter facilement n'importe quelle image
function exporterImageToDrive(image_a_exporter, nom_fichier) {
  Export.image.toDrive({
    image: image_a_exporter,
    description: nom_fichier,
    folder: dossier_export,
    region: roi,
    scale: 30,
    crs: 'EPSG:32738', // Maintien strict du SCR UTM 38S
    maxPixels: 1e13
  });
}

// --- A. EXPORTS DE LA CLASSIFICATION (RASTER & VECTEUR) ---

// Export du Raster Classifié
exporterImageToDrive(image_tamisee, 'Classification_Alaotra_' + annee_etude + '_7Classes_TIF');

// Export du Shapefile (Vectorisation)
var vector_classification = image_tamisee.reduceToVectors({
  geometry: roi,
  crs: 'EPSG:32738',
  scale: 30,
  geometryType: 'polygon',
  eightConnected: false,
  labelProperty: 'class',
  maxPixels: 1e13,
  bestEffort: true 
});

Export.table.toDrive({
  collection: vector_classification,
  description: 'Classification_Alaotra_' + annee_etude + '_7Classes_SHP',
  folder: dossier_export,
  fileFormat: 'SHP'
});

// --- B. EXPORTS DES VARIABLES ET COMPOSITIONS ---

// Composition colorée (RGB)
exporterImageToDrive(mosaique.select(['SR_B4', 'SR_B3', 'SR_B2']), 'Composition_RGB_Landsat_' + annee_etude);

// Indices Spectraux
exporterImageToDrive(ndvi, 'NDVI_Alaotra_' + annee_etude);
exporterImageToDrive(mndwi, 'MNDWI_Alaotra_' + annee_etude);
exporterImageToDrive(ndbi, 'NDBI_Alaotra_' + annee_etude);

// Topographie (SRTM)
exporterImageToDrive(elevation, 'Elevation_SRTM_Alaotra');
exporterImageToDrive(slope, 'Slope_SRTM_Alaotra');
