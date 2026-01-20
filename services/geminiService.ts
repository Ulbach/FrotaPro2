
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  /**
   * Extracts KM reading from an image of a vehicle odometer
   */
  async extractKmFromImage(base64Image: string): Promise<number | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              text: "Extract only the numerical value of the odometer reading from this image. Return only the number, no text or symbols. If not found, return 'null'.",
            },
          ],
        },
      });

      const text = response.text?.trim() || '';
      const km = parseInt(text.replace(/\D/g, ''), 10);
      return isNaN(km) ? null : km;
    } catch (error) {
      console.error("Error extracting KM from image:", error);
      return null;
    }
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
