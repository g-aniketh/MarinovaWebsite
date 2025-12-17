import { WeatherResponse } from '../types';
import { authService } from './authService';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

export const analyzeWeather = async (
  locationName: string,
  lat: number,
  lon: number,
  weatherData: WeatherResponse
): Promise<string> => {
  try {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/ai/analyze-weather`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationName,
        lat,
        lon,
        weatherData
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Analysis failed');
    }

    return data.analysis;
  } catch (error) {
    console.error("Weather analysis failed:", error);
    return "Unable to generate AI analysis at this time.";
  }
};