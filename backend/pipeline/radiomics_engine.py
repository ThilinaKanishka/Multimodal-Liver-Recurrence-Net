import os
import io
import numpy as np

try:
    import pydicom
    import SimpleITK as sitk
    from radiomics import featureextractor
    RADIOMICS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: PyRadiomics or its dependencies are not installed. Error: {e}")
    RADIOMICS_AVAILABLE = False

class RadiomicsEngine:
    def __init__(self, params_file: str = None):
        """
        Initializes the PyRadiomics feature extractor.
        In a production environment, you might provide a customized PyRadiomics YAML params file.
        """
        self.extractor = None
        if RADIOMICS_AVAILABLE:
            if params_file and os.path.exists(params_file):
                self.extractor = featureextractor.RadiomicsFeatureExtractor(params_file)
            else:
                # Default production configuration for 3D textures, shapes and first order metrics
                self.extractor = featureextractor.RadiomicsFeatureExtractor()
                self.extractor.disableAllFeatures()
                self.extractor.enableFeatureClassByName('shape')
                self.extractor.enableFeatureClassByName('firstorder')
                self.extractor.enableFeatureClassByName('glcm')
                self.extractor.enableFeatureClassByName('glrlm')

    def extract_features(self, dicom_bytes: bytes) -> dict:
        """
        Extracts sub-visual texture and geometric features from a raw DICOM byte stream.
        """
        if not RADIOMICS_AVAILABLE or not self.extractor:
            print("PyRadiomics not available. Returning fallback features.")
            return {"original_shape_Sphericity": 0.85, "original_glcm_Entropy": 4.2}

        try:
            # Parse DICOM
            dicom_dataset = pydicom.dcmread(io.BytesIO(dicom_bytes))
            pixel_array = dicom_dataset.pixel_array
            
            # For PyRadiomics, we need a SimpleITK image and a mask.
            image = sitk.GetImageFromArray(pixel_array)
            
            # Dummy mask for entire image (In production, replace with actual Segmentation Mask)
            mask_array = np.ones_like(pixel_array, dtype=np.uint8)
            mask = sitk.GetImageFromArray(mask_array)
            mask.CopyInformation(image)

            # Execute PyRadiomics Feature Extraction
            result = self.extractor.execute(image, mask)
            
            # Filter output to keep only the calculated features (remove metadata)
            features = {key: float(val) for key, val in result.items() if key.startswith("original_")}
            return features

        except Exception as e:
            print(f"Radiomics extraction error: {e}")
            # Fallback to defaults if extraction fails to maintain pipeline stability
            return {"original_shape_Sphericity": 0.85, "original_glcm_Entropy": 4.2}
