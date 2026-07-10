<div align="center">
  <img src="https://img.icons8.com/?size=100&id=103328&format=png&color=000000" alt="HepatoAI Logo" width="80" height="80">
  <h1 align="center">HepatoAI: Multimodal Liver Recurrence Net</h1>
  <p align="center">
    <strong>Enterprise-Grade Clinical Diagnostic & Hospital Administration Platform</strong>
    <br />
    <br />
    <a href="#overview">Overview</a> •
    <a href="#features">Key Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#installation">Installation</a> •
    <a href="#security">Security Protocol</a>
  </p>
</div>

---

## 🔬 Overview

**HepatoAI** is a state-of-the-art, multimodal artificial intelligence platform designed strictly for enterprise clinical environments. It predicts Hepatocellular Carcinoma (HCC) recurrence post-resection by fusing **Clinical, Genomic, and Radiological (3D Volumetric)** data streams.

Built with a secure, zero-trust architecture, the platform features a highly professional Medical Workstation UI, biometric MFA, enforced clinical session management, and a robust administrative provisioning suite for hospital IT departments.

## ✨ Key Features

### 1. Advanced Clinical Intelligence
* **Multimodal AI Ensembles:** Integrates XGBoost, LightGBM, and CatBoost with automated hyperparameter tuning (Optuna) and dynamic class balancing (SMOTE).
* **SHAP Explainability:** Provides attending physicians with localized, feature-level inference explanations for strict medical auditability.
* **3D MPR Workstation:** Integrated WebGL-accelerated Multi-Planar Reconstruction (MPR) viewer for volumetric radiological review.
* **Patient Record Archiving:** Complete longitudinal tracking of historical diagnostic inferences and clinical input metadata.

### 2. Enterprise Security & Authentication (Zero-Trust)
* **Biometric MFA:** Integrates `DeepFace` and `MTCNN` for strict facial verification prior to dashboard access.
* **Google Identity Services (OAuth 2.0):** Secured integration with Google's native One Tap protocol, strictly restricted to email addresses provisioned by Hospital IT.
* **Automated Provisioning:** Admin-driven credential generation with automated, highly stylized HTML email dispatch via SMTP.
* **Forced Policy Enforcement:** Mandatory password rotation upon initial login.
* **Strict Session Management:** Volatile `sessionStorage` token isolation combined with a rigid 15-minute inactivity auto-logout mechanism.

### 3. Financial & Administrative Workflows
* **Automated Physician Payroll:** Dynamic, multi-currency (USD, LKR, EUR) remittance automation synchronized with hospital financial ledgers.
* **Enterprise Reporting:** One-click, high-fidelity PDF exports of financial audits and access logs via `html2canvas` and `jsPDF`.
* **Helpdesk Ticketing:** Fully integrated IT support module tailored for enterprise response tracking.

---

## 🏗️ System Architecture

### Frontend (Clinical Portal & Admin Console)
* **Framework:** React 18 + Vite + TypeScript
* **Styling:** TailwindCSS (Deep Slate Medical UI / Glassmorphism)
* **State Management:** React Hooks + Volatile DOM Storage
* **Icons & UI:** Lucide React

### Backend (Inference Engine & API)
* **Framework:** FastAPI (High-performance async server via Uvicorn)
* **Database:** MongoDB (Motor AsyncIO)
* **Machine Learning:** Scikit-Learn, XGBoost, LightGBM, CatBoost, SHAP
* **Biometrics:** DeepFace, MTCNN, OpenCV, PyTorch

---

## 🚀 Installation & Deployment

### Prerequisites
* Node.js (v18+)
* Python 3.10+
* MongoDB Instance (Local or Atlas)
* Google Cloud Console Account (For OAuth Client ID)

### Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt
pip install google-auth requests PyJWT torch torchvision deepface mtcnn

# 3. Configure Environment Variables
# Ensure your MongoDB URI and SMTP credentials are set in the environment or main.py

# 4. Start the Inference Server
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Configure Google OAuth
# Add your Google Client ID to src/main.tsx

# 4. Start the Clinical Workstation UI
npm run dev
```

---

## 🛡️ Security & Compliance Protocol

* **Data Restraints:** This system does not persistently store raw patient imagery; inferences are logged pseudo-anonymously.
* **Session Lifecycle:** Active user sessions are wiped instantly upon tab closure or 15 minutes of idle time (mouse/keyboard tracking).
* **OAuth Safeguards:** Google SSO is inherently sandboxed. Unknown emails attempting SSO will be unconditionally rejected with HTTP 401.

---

<div align="center">
  <p><i>HIPAA Compliant Architecture Concept &bull; FDA Cleared for Investigational Use Only (Simulated)</i></p>
  <p>&copy; 2026 HepatoAI Development Team. All rights reserved.</p>
</div>