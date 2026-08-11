import { GoogleGenAI } from "@google/genai";
import { Teacher, Course } from "../types";

export async function suggestWorkload(teachers: Teacher[], courses: Course[]): Promise<string> {
  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || 'AIzaSyDummyKeyForDevelopment';
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Eres un asistente experto en gestión académica universitaria. 
      Tengo los siguientes docentes: ${teachers.map(t => `${t.name} (Max ${t.maxHours}h)`).join(', ')}.
      Tengo los siguientes cursos: ${courses.map(c => `${c.name} (${c.hoursPerWeek}h)`).join(', ')}.
      Por favor, sugiere una distribución de carga horaria (quién enseña qué) buscando un equilibrio y respetando el máximo de horas de cada docente.
      Devuelve la respuesta en formato Markdown legible.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "No se pudo generar una sugerencia.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al conectar con la IA para generar la sugerencia.";
  }
}
