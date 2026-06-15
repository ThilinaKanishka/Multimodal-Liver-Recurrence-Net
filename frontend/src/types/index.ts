export interface DiagnosticInput {
  tumor_size_cm: number;
  tumor_number: number;
  tumor_density_hu: number;
  tumor_shape_irregularity: number;
  tumor_texture_entropy: number;
  margin_definition: "well-defined" | "ill-defined";
  enhancement_pattern: "arterial" | "washout" | "delayed";
  afp_ngml: number;
  alp_iul: number;
  alt_iul: number;
  ast_iul: number;
  bilirubin_mgdl: number;
  albumin_gdl: number;
  platelet_k_ul: number;
  child_pugh_score: "A" | "B" | "C";
  bclc_stage: "0" | "A" | "B" | "C" | "D";
  cirrhosis_present: boolean;
  hepatitis_b: boolean;
  hepatitis_c: boolean;
  mvi_pathology: boolean;
  clinical_text_report: string;
}

export interface PredictionResult {
  recurrence_risk: "HIGH" | "LOW";
  probability: number;
  ai_insights: string[];
}
