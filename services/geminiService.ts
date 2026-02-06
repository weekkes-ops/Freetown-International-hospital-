
import { GoogleGenAI, Type } from "@google/genai";

// Strictly adhering to initialization guidelines: Assume API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Diagnostic advice involves complex clinical reasoning, so gemini-3-pro-preview is selected.
export const getDiagnosticAdvice = async (symptoms: string, patientHistory: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are a clinical decision support AI for a professional hospital management system. 
      Analyze the following symptoms and patient history to provide a concise differential diagnosis summary 
      and suggested next steps for a medical professional. 
      
      DISCLAIMER: Always include a prominent disclaimer that this is AI-generated advice and not a final medical diagnosis.
      
      Symptoms: ${symptoms}
      Patient History: ${patientHistory}`,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Diagnostic Analysis Error:", error);
    return "Error: Unable to generate diagnostic advice. Ensure symptoms are provided and your clinical context is valid.";
  }
};

// Structured Symptom Checker tool
export const checkSymptoms = async (symptoms: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Act as an expert clinical diagnostic system. Analyze these symptoms: "${symptoms}".
      Provide a structured differential diagnosis including potential conditions and specific clinical advice.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            disclaimer: { type: Type.STRING },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  condition: { type: Type.STRING },
                  probability: { type: Type.STRING, description: "Low, Medium, or High" },
                  urgency: { type: Type.STRING, description: "EMERGENT, URGENT, or ROUTINE" },
                  reasoning: { type: Type.STRING },
                  clinicalAdvice: { type: Type.STRING },
                  recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["condition", "probability", "urgency", "reasoning", "clinicalAdvice", "recommendedActions"]
              }
            }
          },
          required: ["disclaimer", "findings"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Symptom Checker Error:", error);
    return { 
      disclaimer: "System error during analysis.", 
      findings: [] 
    };
  }
};

// Summarization is a basic text task, gemini-3-flash-preview is appropriate.
export const summarizeMedicalRecords = async (records: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the following patient history records into a clean, professional clinical summary:
      ${records.join("\n")}`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Summarization Error:", error);
    return "Failed to summarize records.";
  }
};

// Risk analysis is a complex task requiring structured output for UI alerts.
export const analyzePatientRisk = async (symptoms: string, history: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze this clinical scenario for immediate life-threatening risks or critical clinical alerts.
      Symptoms: ${symptoms}
      History: ${history}
      
      Focus on red flags like sepsis, stroke, myocardial infarction, or severe drug interactions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              severity: {
                type: Type.STRING,
                description: "Must be one of: CRITICAL, WARNING, or INFO",
              },
              title: {
                type: Type.STRING,
                description: "Short name of the risk (e.g., Sepsis Risk)",
              },
              description: {
                type: Type.STRING,
                description: "Detailed clinical reasoning for this alert",
              },
            },
            required: ["severity", "title", "description"],
          }
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Risk Analysis Error:", error);
    return [];
  }
};
