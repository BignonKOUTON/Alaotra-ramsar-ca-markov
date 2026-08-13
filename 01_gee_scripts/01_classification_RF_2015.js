// ==============================================================================
// SCRIPT GEE MAÎTRE : CLASSIFICATION 7 CLASSES POUR 2005, 2015 OU 2025
// ==============================================================================

// --- PRÉREQUIS ---
// 1. Variable 'roi' : KML de votre zone d'étude
// 2. Variable 'training_points' : Points d'entraînement avec colonne 'class' (1 à 7)
// Attention : Assurez-vous que vos points d'entraînement correspondent bien à la réalité de l'année choisie !

// ==============================================================================
// 1. PARAMÈTRES DE BASE
// ==============================================================================

var annee_etude = 2015; // Mettez 2005, 2015 ou 2025 ici. Le script s'adapte tout seul !

// Création d'un sous-dossier par année pour bien ranger votre Drive
var dossier_export = 'GRCA/TFE Madagascar/TFE Process/GEE/' + annee_etude;
var date_debut = annee_etude + '-05-01'; 
var date_fin = annee_etude + '-10-31';

print("Démarrage du traitement pour l'année : " + annee_etude);
print("Dossier d'exportation : " + dossier_export);

// ==============================================================================
// 2. SÉLECTION AUTOMATIQUE DU SATELLITE (LANDSAT 5 ou 8/9)
// ==============================================================================

var collection;
var bandes_brutes;
var bandes_harmonisees = ['Bleu', 'Vert', 'Rouge', 'NIR', 'SWIR1', 'SWIR2'];

if (annee_etude >= 2013) {
  print("Capteur détecté : Landsat 8 & 9");
  collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .merge(ee.ImageCollection('LANDSAT/LC09/C02/T1_L2'));
  bandes_brutes = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];
} else {
  print("Capteur détecté : Landsat 5");
  collection = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2');
  bandes_brutes = ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'];
}

function prepLandsat(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 4).eq(0).and(qa.bitwiseAnd(1 << 3).eq(0));
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  return image.addBands(opticalBands, null, true).updateMask(mask);
}

// Mosaïque avec renommage des bandes pour que le RF ne soit pas perturbé par le capteur
var mosaique = collection
  .filterBounds(roi)
  .filterDate(date_debut, date_fin)
  .filter(ee.Filter.lt('CLOUD_COVER', 15))
  .map(prepLandsat)
  .median()
  .select(bandes_brutes, bandes_harmonisees) // Harmonisation des noms
  .clip(roi);

// ==============================================================================
// 3. INDICES SPECTRAUX ET TOPOGRAPHIE
// ==============================================================================

var ndvi = mosaique.normalizedDifference(['NIR', 'Rouge']).rename('NDVI');
var mndwi = mosaique.normalizedDifference(['Vert', 'SWIR1']).rename('MNDWI');
var ndbi = mosaique.normalizedDifference(['SWIR1', 'NIR']).rename('NDBI');

var srtm = ee.Image('USGS/SRTMGL1_003').clip(roi);
var elevation = srtm.select('elevation').rename('Altitude');
var slope = ee.Terrain.slope(srtm).rename('Pente');

var image_predicteurs = mosaique.addBands([ndvi, mndwi, ndbi, elevation, slope]);
var bandes_rf = ['Bleu', 'Vert', 'Rouge', 'NIR', 'SWIR1', 'SWIR2', 'NDVI', 'MNDWI', 'NDBI', 'Altitude', 'Pente'];

// ==============================================================================
// 4. ENTRAÎNEMENT ET CLASSIFICATION (RANDOM FOREST)
// ==============================================================================
print("Extraction et calcul du modèle Random Forest...");

var training = image_predicteurs.select(bandes_rf).sampleRegions({
  collection: training_points,
  properties: ['class'], 
  scale: 30, 
  tileScale: 16 
});

var classifier = ee.Classifier.smileRandomForest(250).train({
  features: training,
  classProperty: 'class',
  inputProperties: bandes_rf
});

var image_classee = image_predicteurs.select(bandes_rf).classify(classifier);

// Tamisage 3x3
var image_tamisee = image_classee.focalMode({
  radius: 1, kernelType: 'square', units: 'pixels'
}).rename('Classification');

// ==============================================================================
// 5. VISUALISATION
// ==============================================================================
var palette_sig = ['0000FF', '006400', '32CD32', 'FF0000', '00FFFF', 'FFFF00', 'DEB887'];

Map.centerObject(roi, 11);
Map.addLayer(mosaique, {bands: ['Rouge', 'Vert', 'Bleu'], min: 0, max: 0.15}, 'Vraies Couleurs ' + annee_etude, false);
Map.addLayer(image_tamisee, {min: 1, max: 7, palette: palette_sig}, 'Classification 7 Classes ' + annee_etude);

// ==============================================================================
// 6. EXPORTATIONS MULTIPLES
// ==============================================================================
print("Prêt pour l'export. Cliquez sur 'Run' dans l'onglet 'Tasks' (9 couches).");

function exporterImageToDrive(image_a_exporter, nom_fichier) {
  Export.image.toDrive({
    image: image_a_exporter,
    description: nom_fichier,
    folder: dossier_export,
    region: roi, scale: 30, crs: 'EPSG:32738', maxPixels: 1e13
  });
}

// Exports Raster
exporterImageToDrive(image_tamisee, 'Classification_Alaotra_' + annee_etude + '_7Classes_TIF');
exporterImageToDrive(mosaique.select(['Rouge', 'Vert', 'Bleu']), 'Composition_RGB_' + annee_etude);
exporterImageToDrive(ndvi, 'NDVI_' + annee_etude);
exporterImageToDrive(mndwi, 'MNDWI_' + annee_etude);
exporterImageToDrive(ndbi, 'NDBI_' + annee_etude);

// SRTM (exporté seulement si on le souhaite, mais la topo ne change pas entre 2005 et 2025)
exporterImageToDrive(elevation, 'Elevation_SRTM_Alaotra');
exporterImageToDrive(slope, 'Slope_SRTM_Alaotra');

// Export Vecteur (Scale à 90m pour éviter le "Error 3: Computed value is too large")
var vector_classification = image_tamisee.reduceToVectors({
  geometry: roi, crs: 'EPSG:32738', 
  scale: 90, // <--- MODIFIÉ ICI POUR SAUVER LA MÉMOIRE LORS DE LA VECTORISATION GEE
  geometryType: 'polygon', eightConnected: false, labelProperty: 'class', 
  maxPixels: 1e13, bestEffort: true 
});

Export.table.toDrive({
  collection: vector_classification,
  description: 'Classification_Alaotra_' + annee_etude + '_7Classes_SHP',
  folder: dossier_export, fileFormat: 'SHP'
});
