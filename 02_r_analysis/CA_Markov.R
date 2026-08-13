
# ==============================================================================
# SCRIPT DE MODÉLISATION CA-MARKOV (EPSG:4326)
# Correction intégrée : Suppression de la dimension Z des KML
# ==============================================================================

library(terra)
library(sf)
library(dplyr)

target_crs <- "EPSG:4326"

# ==============================================================================
# PHASE 1 : IMPORTATION ET FORÇAGE DES DONNÉES
# ==============================================================================
cat("\n--- 1. IMPORTATION ET FORÇAGE DES DONNÉES ---\n")

cat("Sélectionnez OCS 2025 (Gabarit)...\n"); ocs_25_brut <- rast(file.choose())
if(crs(ocs_25_brut, describe=TRUE)$code != "4326") {
  ocs_2025 <- project(ocs_25_brut, target_crs, method="near")
} else { ocs_2025 <- ocs_25_brut }

forcer_raster <- function(nom, method="near") {
  cat(paste("Sélectionnez", nom, "...\n"))
  r_brut <- rast(file.choose())
  r_proj <- project(r_brut, target_crs, method=method)
  return(resample(r_proj, ocs_2025, method=method))
}

# NOUVELLE FONCTION VECTEUR : DÉTRUIT LE Z ET FORCE LE SCR
forcer_vecteur <- function(nom) {
  cat(paste("Sélectionnez le vecteur", nom, "...\n"))
  v_brut <- st_read(file.choose(), quiet=TRUE)
  
  # 1. Suppression de la dimension Z (Crucial pour les KML)
  v_2d <- st_zm(v_brut, drop=TRUE, what="ZM")
  
  # 2. Forçage strict du système de coordonnées
  v_proj <- st_transform(v_2d, target_crs)
  return(v_proj)
}

ocs_2015 <- forcer_raster("OCS 2015", "near")
ocs_2005 <- forcer_raster("OCS 2005", "near")
mnt      <- forcer_raster("MNT", "bilinear")
pente    <- forcer_raster("Pente", "bilinear")
routes   <- forcer_vecteur("Routes")
water    <- forcer_vecteur("Eau")


# ==============================================================================
# PHASE 2 : BILAN DE CONFIRMATION
# ==============================================================================
cat("\n=======================================================\n")
cat(" BILAN : SCR ET DIMENSIONS\n")
cat("=======================================================\n")
get_crs_name <- function(layer, is_raster=TRUE) {
  if(is_raster) return(crs(layer, describe=TRUE)$name) else return(st_crs(layer)$name)
}
cat("✅ OCS 2025 :", get_crs_name(ocs_2025, TRUE), "\n")
cat("✅ Routes   :", get_crs_name(routes, FALSE), "| Dimension Z supprimée\n")
cat("✅ Eau      :", get_crs_name(water, FALSE), "| Dimension Z supprimée\n")
cat("=======================================================\n")


# ==============================================================================
# PHASE 3 : CALCUL DES DISTANCES (AVEC VÉRIFICATION)
# ==============================================================================
cat("\n--- 2. CALCUL DES DISTANCES (DRIVERS) ---\n")

dir_out <- file.path(dirname(sources(ocs_25_brut)), "Resultats_Modelisation_4326")
if(!dir.exists(dir_out)) dir.create(dir_out)

normalize <- function(x) { (x - minmax(x)[1]) / (minmax(x)[2] - minmax(x)[1]) }

# Fonction de distance blindée avec rapport de succès
calcul_distance_sur <- function(couche_vecteur, gabarit_raster, nom_couche) {
  cat("-> Traitement de", nom_couche, "...\n")
  v_terra <- vect(couche_vecteur)
  
  # Étape A : Rasterisation
  r_base <- rasterize(v_terra, gabarit_raster, field=1, touches=TRUE)
  
  # Étape B : Diagnostic du vide
  nb_pixels <- global(r_base, "notNA")[[1]]
  if(is.na(nb_pixels) || nb_pixels == 0) {
    stop(paste("\n❌ ERREUR FATALE : Le vecteur", nom_couche, "ne tombe pas sur la carte de l'Alaotra. Problème géodésique lourd à la source."))
  } else {
    cat("   ✅ Succès :", nb_pixels, "pixels d'infrastructures rasterisés.\n")
  }
  
  # Étape C : Calcul
  d <- distance(r_base)
  d <- mask(d, gabarit_raster)
  return(normalize(d))
}

# Exécution des calculs
dist_routes <- calcul_distance_sur(routes, ocs_2025, "ROUTES")
dist_water  <- calcul_distance_sur(water, ocs_2025, "EAU")
pente_norm  <- normalize(pente)

writeRaster(dist_routes, file.path(dir_out, "Driver_Dist_Routes_4326.tif"), overwrite=TRUE)
writeRaster(dist_water, file.path(dir_out, "Driver_Dist_Eau_4326.tif"), overwrite=TRUE)
writeRaster(pente_norm, file.path(dir_out, "Driver_Pente_4326.tif"), overwrite=TRUE)
writeRaster(ocs_2005, file.path(dir_out, "OCS_2005_4326.tif"), overwrite=TRUE)
writeRaster(ocs_2025, file.path(dir_out, "OCS_2025_4326.tif"), overwrite=TRUE)


# ==============================================================================
# PHASE 4 : MATRICES ET SCÉNARIOS
# ==============================================================================
cat("\n--- 3. CRÉATION DES MATRICES DE MARKOV ---\n")

ct <- as.data.frame(crosstab(c(ocs_2005, ocs_2025), long=TRUE))
colnames(ct)[1:3] <- c("S05", "D25", "Freq")
ct_clean <- ct[!is.na(ct$S05) & !is.na(ct$D25) & ct$S05 %in% 1:7 & ct$D25 %in% 1:7, ]

classes <- as.character(1:7)
full_mat <- matrix(0, nrow=7, ncol=7, dimnames=list(classes, classes))
if(nrow(ct_clean) > 0) {
  for(i in 1:nrow(ct_clean)) { full_mat[as.character(ct_clean$S05[i]), as.character(ct_clean$D25[i])] <- ct_clean$Freq[i] }
}

prob_matrix <- t(apply(full_mat, 1, function(x) if(sum(x)==0) x else x/sum(x)))
for(i in 1:7) { if(sum(full_mat[i,]) == 0) prob_matrix[i, i] <- 1 }

cat("\n--- 4. SCÉNARIOS ET APTITUDES ---\n")
EL="1"; FO="2"; GF="3"; HI="4"; MZ="5"; RZ="6"; SC="7"

mat_bau <- prob_matrix
mat_int <- prob_matrix; mat_int[MZ, RZ] <- mat_int[MZ, RZ] * 1.5; mat_int[SC, RZ] <- mat_int[SC, RZ] * 1.3; mat_int <- prop.table(mat_int, 1)
mat_con <- prob_matrix; mat_con[MZ, RZ] <- 0.001; mat_con[EL, RZ] <- 0; mat_con <- prop.table(mat_con, 1)

write.csv(mat_bau, file.path(dir_out, "Matrice_BAU.csv"))
write.csv(mat_int, file.path(dir_out, "Matrice_Intensification.csv"))
write.csv(mat_con, file.path(dir_out, "Matrice_Conservation.csv"))

calc_apt <- function(p1, p2, p3) { normalize((p1*(1-pente_norm)) + (p2*(1-dist_water)) + (p3*(1-dist_routes))) }
writeRaster(calc_apt(0.4, 0.3, 0.3), file.path(dir_out, "Aptitude_BAU_4326.tif"), overwrite=TRUE)
writeRaster(calc_apt(0.2, 0.5, 0.3), file.path(dir_out, "Aptitude_Int_4326.tif"), overwrite=TRUE)
writeRaster(calc_apt(0.6, 0.2, 0.2), file.path(dir_out, "Aptitude_Con_4326.tif"), overwrite=TRUE)

cat("\n✅ OPÉRATION TERMINÉE ! Fichiers dans :", dir_out, "\n")
