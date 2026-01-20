
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  /**
   * Generates a quick safety tip or weather reminder based on current context
   */
  async getQuickSafetyTip(driver: string, destination: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere uma dica de segurança curta e motivacional (máximo 15 palavras) em português para o motorista ${driver} que está saindo para ${destination}.`,
      });
      return response.text || "Boa viagem e dirija com segurança!";
    } catch (error) {
      return "Dirija com cuidado!";
    }
  }
}

export const geminiService = new GeminiService();
