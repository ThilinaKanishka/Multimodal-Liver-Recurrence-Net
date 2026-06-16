import os
import pydicom
import numpy as np
import SimpleITK as sitk
from radiomics import featureextractor

class RadiomicsEngine:
    def __init__(self, params_file: str = None):
        """
        Initializes the PyRadiomics feature extractor.
        In a production environment, you might provide a customized PyRadiomics YAML params file.
        """
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
        try:
            import io
            # Parse DICOM
            dicom_dataset = pydicom.dcmread(io.BytesIO(dicom_bytes))
            pixel_array = dicom_dataset.pixel_array
            
            # For PyRadiomics, we need a SimpleITK image and a mask.
            # In a real setup, a segmentation model (like UNet) would generate the tumor mask.
            # Here we simulate a generic mask for the tumor region for the demonstration.
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
            # Fallback to zeros if extraction fails to maintain pipeline stability
            return {"original_shape_Sphericity": 0.0, "original_glcm_Entropy": 0.0}
