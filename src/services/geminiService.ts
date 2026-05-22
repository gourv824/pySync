import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // In the frontend, process.env.GEMINI_API_KEY is provided by the platform
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateProjectDescription(details: { 
    title: string, 
    type: string, 
    location: string, 
    area: string, 
    configuration?: string, 
    bathrooms?: number | string, 
    amenities?: string, 
    price?: number | string, 
    priceUnit?: string, 
    possessionStatus?: string 
  }): Promise<string> {
    const prompt = `Generate a compelling, professional, and attractive real estate project description for a ${details.type} located in ${details.location}.
    Project Title: ${details.title}.
    Key Features:
    - Area: ${details.area} sq ft.
    ${details.configuration ? `- Configuration: ${details.configuration}.` : ''}
    ${details.bathrooms ? `- Bathrooms: ${details.bathrooms}.` : ''}
    ${details.amenities ? `- Amenities: ${details.amenities}.` : ''}
    ${details.price ? `- Price: ${details.price} ${details.priceUnit}.` : ''}
    ${details.possessionStatus ? `- Possession Status: ${details.possessionStatus}.` : ''}

    Please weave these details into a narrative that highlights the lifestyle benefits of the project and its location. Keep the description engaging, under 200 words, and formatted as a polished real estate listing.`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return response.text || "Could not generate description.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async generateResaleDescription(details: {
    societyName: string,
    location: string,
    propertyType: string,
    bhk: number | string,
    sizeSqft: number | string,
    price: number | string,
    priceUnit: string,
    floorNumber?: string,
    propertyAge?: string
  }): Promise<string> {
    const prompt = `Generate a professional and attractive resale property description for a ${details.bhk} BHK ${details.propertyType} in ${details.societyName}, located at ${details.location}.
    Key Details:
    - Size: ${details.sizeSqft} sq ft.
    - Price: ${details.price} ${details.priceUnit}.
    ${details.floorNumber ? `- Floor: ${details.floorNumber}.` : ''}
    ${details.propertyAge ? `- Property Age: ${details.propertyAge}.` : ''}

    Please create a compelling description that highlights the value of the property, the society's reputation, and the convenience of the location. Keep it under 150 words.`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return response.text || "Could not generate description.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
