import { ResearchReport } from '../types';
import { authService } from './authService';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

export const generateResearchReport = async (
  topic: string
): Promise<ResearchReport | null> => {
  try {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    // Backend handles credit checking and deduction

    const response = await fetch(`${API_URL}/api/ai/generate-report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Report generation failed');
    }

    // Backend returns { content, sources }
    return {
      id: Date.now().toString(),
      topic,
      timestamp: Date.now(),
      content: data.report.content,
      sources: data.report.sources,
      // Location context and image generation can be added later
      locationContext: undefined,
      generatedImage: undefined
    };
  } catch (error) {
    console.error("Research report error:", error);
    throw error;
  }
};
