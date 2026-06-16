from typing import Dict, Any

try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    print("Warning: SpaCy is not installed.")
    SPACY_AVAILABLE = False

class MedicalNLPEngine:
    def __init__(self, model_name: str = "en_core_sci_sm"):
        """
        Loads the SciSpacy Clinical Named Entity Recognition (NER) model.
        """
        self.nlp = None
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load(model_name)
            except OSError:
                print(f"Warning: SciSpacy model '{model_name}' not found. Please install it.")

    def extract_entities(self, clinical_text: str) -> Dict[str, Any]:
        """
        Parses unstructured clinical text to extract standardized medical features.
        """
        structured_data = {
            "tumor_stage_extracted": None,
            "mvi_status_extracted": False,
            "cirrhosis_severity_extracted": "None"
        }
        
        if not self.nlp or not clinical_text:
            return structured_data

        doc = self.nlp(clinical_text.lower())
        
        # In a deep production setup, we would use contextual rules or EntityLinker.
        # Below is a robust programmatic pattern matching approach on NER entities.
        for ent in doc.ents:
            text = ent.text
            
            # Detect Tumor Stage
            if "stage" in text or "bclc" in text:
                structured_data["tumor_stage_extracted"] = text

            # Detect Microvascular Invasion (MVI)
            if "mvi" in text or "microvascular invasion" in text:
                structured_data["mvi_status_extracted"] = True
                if "negative" in clinical_text[max(0, ent.start_char-15):ent.end_char+15]:
                    structured_data["mvi_status_extracted"] = False
                    
            # Detect Cirrhosis / Fibrosis
            if "cirrhosis" in text or "fibrosis" in text:
                structured_data["cirrhosis_severity_extracted"] = "Severe"
                
        return structured_data
