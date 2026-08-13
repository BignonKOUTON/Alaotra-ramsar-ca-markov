

// ==============================================================================
// SCRIPT GEE SPÉCIFIQUE : CLASSIFICATION 7 CLASSES POUR 2005 (LANDSAT 5)
// SOLUTION COMPOSITE PLURIANNUEL (2004-2006)
// ==============================================================================

// --- PRÉREQUIS (À vérifier dans l'onglet 'Assets' à gauche) ---
// 1. Variable 'roi' : KML/Shapefile de votre zone d'étude
// 2. Variable 'training_points' : Points d'entraînement réalisés sur l'image de 2005 (avec colonne 'class')

// ==============================================================================
// 1. PARAMÈTRES DE BASE ET EXPORT
// ==============================================================================
var annee_etude = 2005;
var dossier_export = 'GRCA/TFE Madagascar/TFE Process/GEE/2005';

// ÉLARGISSEMENT DE LA FENÊTRE TEMPORELLE POUR COMBLER LES TROUS DE LANDSAT 5
var date_debut_large = '2004-01-01'; 
var date_fin_large = '2006-12-31';

print("Démarrage de la classification pour la période autour de : " + annee_etude + " (Capteur : Landsat 5)");

// ==============================================================================
// 2. PRÉPARATION DES DONNÉES LANDSAT 5
// ==============================================================================

function prepLandsat5(image) {
  var qa = image.select('QA_PIXEL');
  var cloudShadowBitMask = (1 << 4);
  var cloudsBitMask = (1 << 3);
  // Masquage chirurgical des nuages pixel par pixel
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
    .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  return image.addBands(opticalBands, null, true).updateMask(mask);
}

// Sélection de la collection Landsat 5 SANS LE FILTRE GLOBAL DE NUAGES
var collection = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
  .filterBounds(roi)
  .filterDate(date_debut_large, date_fin_large)
  .map(prepLandsat5);

print("Nombre d'images Landsat 5 utilisées pour le composite :", collection.size());

// Mosaïque (médiane) et harmonisation des noms de bandes
// La médiane ignorera les valeurs extrêmes et gardera les pixels clairs
var bandes_brutes = ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'];
var bandes_harmonisees = ['Bleu', 'Vert', 'Rouge', 'NIR', 'SWIR1', 'SWIR2'];

var mosaique = collection.median().select(bandes_brutes, bandes_harmonisees).clip(roi);

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

var image_classee = image_predicteurs.select(bandes_rf).classify(classifier);

// ==============================================================================
// 5. POST-TRAITEMENT : TAMISAGE 3X3 PIXELS
// ==============================================================================
print("Lissage spatial : Tamisage 3x3...");

var image_tamisee = image_classee.focalMode({
  radius: 1, kernelType: 'square', units: 'pixels'
}).rename('Classification');

// ==============================================================================
// 6. VISUALISATION AVEC SYMBOLOGIE SIG SÉMANTIQUE
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
Map.addLayer(mosaique, {bands: ['Rouge', 'Vert', 'Bleu'], min: 0, max: 0.15}, 'Image Landsat 5 (Vraies Couleurs)', false);
Map.addLayer(image_tamisee, {min: 1, max: 7, palette: palette_sig}, 'Classification 2005 (7 Classes)');

// ==============================================================================
// 7. EXPORTATIONS VERS GOOGLE DRIVE
// ==============================================================================
print("Prêt pour l'export. Cliquez sur 'Run' dans l'onglet 'Tasks'.");

function exporterImageToDrive(image_a_exporter, nom_fichier) {
  Export.image.toDrive({
    image: image_a_exporter, description: nom_fichier, folder: dossier_export,
    region: roi, scale: 30, crs: 'EPSG:32738', maxPixels: 1e13
  });
}

// Exports Raster
exporterImageToDrive(image_tamisee, 'Classification_Alaotra_2005_7Classes_TIF');
exporterImageToDrive(mosaique.select(['Rouge', 'Vert', 'Bleu']), 'Composition_RGB_Landsat_2005');
exporterImageToDrive(ndvi, 'NDVI_Alaotra_2005');
exporterImageToDrive(mndwi, 'MNDWI_Alaotra_2005');
exporterImageToDrive(ndbi, 'NDBI_Alaotra_2005');

// Export Vecteur (Scale à 90m pour contourner la limite de mémoire de GEE)
var vector_classification = image_tamisee.reduceToVectors({
  geometry: roi, crs: 'EPSG:32738', scale: 90, geometryType: 'polygon',
  eightConnected: false, labelProperty: 'class', maxPixels: 1e13, bestEffort: true 
});

Export.table.toDrive({
  collection: vector_classification,
  description: 'Classification_Alaotra_2005_7Classes_SHP',
  folder: dossier_export, fileFormat: 'SHP'
});