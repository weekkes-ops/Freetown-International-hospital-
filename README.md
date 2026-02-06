# Freetown International Hospital Management System (HMS)

A modern, professional-grade medical management suite designed for Freetown International Hospital. This system features a robust relational data model, AI-powered diagnostic support, and specialized portals for various hospital roles.

## 🏥 Key Modules

- **Dashboard**: Real-time analytics and statistical overview of hospital operations.
- **Patient Journey (Wizard)**: A streamlined, step-by-step workflow for intake, consultation, and diagnostics.
- **Registration Desk**: Comprehensive patient onboarding and financial ledger posting.
- **Clinical Consultation**: Specialized portal for doctors with MD-standard vital monitoring and clinical documentation.
- **Laboratory Station**: Diagnostic test management and result synchronization.
- **Accounting & Ledger**: Full financial tracking of income and expenditures with category-based classification.
- **AI Diagnostic Assistant**: Integrated Google Gemini AI for differential diagnosis and clinical summary generation.

## 🛠️ Tech Stack

- **Frontend**: React (v19)
- **Styling**: Tailwind CSS
- **Intelligence**: Google Gemini API (@google/genai)
- **Analytics**: Recharts
- **Database Simulation**: PostgreSQL-aligned service layer with IndexedDB/LocalStorage persistence.

## 🚀 Getting Started

1. **Environment Variables**:
   Ensure `process.env.API_KEY` is configured with a valid Google Gemini API key for the AI Assistant module.

2. **Installation**:
   ```bash
   npm install
   ```

3. **Development**:
   ```bash
   npm start
   ```

## 🔒 Security & Roles

The system implements a strict Permission Matrix across 5 distinct roles:
- `ADMIN`: Full system access and personnel management.
- `DOCTOR`: Clinical assessments, medical records, and AI support.
- `CASHIER`: Financial transactions and patient registration.
- `LAB_TECH`: Diagnostic test processing.
- `MATRON`: Ward management and patient oversight.

---
*Developed for Freetown International Hospital • Secure Enterprise Suite*
