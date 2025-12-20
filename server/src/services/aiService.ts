import OpenAI from 'openai';
import { WeatherResponse } from '../types';

// Initialize OpenAI client with OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://www.marinova.in",
    "X-Title": "MARINOVA Ocean Data Platform",
  },
});

// AI Configuration
const AI_CONFIG = {
  weather: {
    model: "openai/gpt-4o-mini",
    maxTokens: 500,
    temperature: 0.7
  },
  chat: {
    model: "anthropic/claude-3.5-sonnet",
    maxTokens: 800,
    temperature: 0.8
  },
  research: {
    model: "anthropic/claude-3.5-sonnet",
    maxTokens: 2000,
    temperature: 0.7
  },
  insights: {
    model: "openai/gpt-4o-mini",
    maxTokens: 3000,
    temperature: 0.9
  },
  images: {
    model: "dall-e-3",
    size: "1024x1024" as const,
    quality: "standard" as const
  }
};

/**
 * Analyze weather data and generate Captain's Intelligence Brief
 */
export const analyzeWeather = async (
  locationName: string,
  lat: number,
  lon: number,
  weatherData: WeatherResponse
): Promise<string> => {
  try {
    const current = weatherData.current;
    const daily = weatherData.daily;
    
    const tempTrend = `${daily.temperature_2m_min[0]}°C - ${daily.temperature_2m_max[0]}°C`;
    const rainForecast = daily.precipitation_sum.slice(0, 3).map((p: number) => `${p}mm`).join(', ');

    const prompt = `Act as an expert marine meteorologist. Analyze the detailed weather data for ${locationName} (Lat: ${lat}, Lon: ${lon}) provided by MARINOVA's sensor network.

CURRENT CONDITIONS:
- Temp: ${current.temperature_2m}°C (Feels like ${current.apparent_temperature}°C)
- Pressure: ${current.pressure_msl} hPa
- Wind: ${current.wind_speed_10m} km/h (Gusts: ${current.wind_gusts_10m} km/h) at ${current.wind_direction_10m}°
- Visibility: ${weatherData.hourly.visibility[0] / 1000} km
- Cloud Cover: ${current.cloud_cover}%
- UV Index Today: ${daily.uv_index_max[0]}

FORECAST (Next 3 Days):
- Temps: ${tempTrend}
- Precip: ${rainForecast}
- Max Winds: ${Math.max(...daily.wind_speed_10m_max.slice(0, 3))} km/h

Provide a "Captain's Intelligence Brief":
1. **Situation**: Brief summary of current sea/air state (Stability, Visibility).
2. **Advisory**: Specific warnings for mariners (Gale force, Squalls, Fog, UV exposure).
3. **Outlook**: What to expect over the next 48 hours.
4. **Ocean Fact**: A short, fascinating fact about this specific coordinates/ocean region.

Tone: Professional, nautical, yet accessible. Do not mention external data providers.`;

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.weather.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: AI_CONFIG.weather.maxTokens,
      temperature: AI_CONFIG.weather.temperature,
    });

    return response.choices[0]?.message?.content || "Analysis unavailable.";
  } catch (error) {
    console.error("Weather analysis failed:", error);
    throw new Error("Unable to generate AI analysis at this time.");
  }
};

/**
 * Chat with multimodal AI (text + images)
 */
export const generateChatResponse = async (
  messages: Array<{ role: string; content: string }>,
  imageUrls?: string[]
): Promise<string> => {
  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : msg.role,
      content: msg.content
    }));

    // Add images to the last user message if provided
    if (imageUrls && imageUrls.length > 0 && formattedMessages.length > 0) {
      const lastMessage = formattedMessages[formattedMessages.length - 1];
      if (lastMessage.role === 'user') {
        lastMessage.content = [
          { type: "text", text: lastMessage.content },
          ...imageUrls.map(url => ({
            type: "image_url" as const,
            image_url: { url }
          }))
        ] as any;
      }
    }

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.chat.model,
      messages: formattedMessages as any,
      max_tokens: AI_CONFIG.chat.maxTokens,
      temperature: AI_CONFIG.chat.temperature,
    });

    return response.choices[0]?.message?.content || "I apologize, I couldn't generate a response.";
  } catch (error) {
    console.error("Chat generation failed:", error);
    throw new Error("Unable to generate chat response.");
  }
};

/**
 * Generate research report on a topic
 */
export const generateResearchReport = async (
  topic: string
): Promise<{ content: string; sources: Array<{ title: string; url: string }> }> => {
  try {
    const prompt = `You are a marine research specialist. Generate a comprehensive research report on: "${topic}"

Include:
1. Executive Summary
2. Background & Context  
3. Current Research & Findings
4. Key Data & Statistics
5. Future Implications
6. Conclusion

Format in markdown with headers (##). Be detailed and scientific. Include 3-5 credible sources at the end.

Sources format:
[SOURCE 1] Title | URL
[SOURCE 2] Title | URL`;

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.research.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: AI_CONFIG.research.maxTokens,
      temperature: AI_CONFIG.research.temperature,
    });

    const content = response.choices[0]?.message?.content || "";
    
    // Parse sources from content
    const sources: Array<{ title: string; url: string }> = [];
    const sourceMatches = content.matchAll(/\[SOURCE \d+\] (.+?) \| (.+?)$/gm);
    for (const match of sourceMatches) {
      sources.push({ title: match[1], url: match[2] });
    }

    return { content, sources };
  } catch (error) {
    console.error("Research report generation failed:", error);
    throw new Error("Unable to generate research report.");
  }
};

/**
 * Generate monthly ocean insights
 */
export const generateMonthlyInsights = async (): Promise<Array<{
  id: string;
  date: string;
  title: string;
  type: 'Prediction' | 'Observation' | 'Anomaly' | 'Event';
  region: string;
  description: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'Critical' | 'Positive';
  tags: string[];
}>> => {
  try {
    const prompt = `Generate 15 diverse oceanographic insights, predictions, and anomalies for a global ocean monitoring platform for the next 2 weeks.

Requirements:
- Return ONLY a valid JSON array, no markdown formatting
- Each insight must follow this exact structure:
{
  "date": "YYYY-MM-DD" (use dates from today onwards),
  "title": "Concise title (max 60 chars)",
  "type": "Prediction" or "Observation" or "Anomaly" or "Event",
  "region": "Specific ocean region",
  "description": "Detailed description (100-150 words)",
  "confidence": 70-95 (number only, for Predictions),
  "severity": "Low" or "Medium" or "Critical" or "Positive",
  "tags": ["tag1", "tag2", "tag3"]
}

Topics to cover: coral bleaching, ocean currents, temperature anomalies, marine life migrations, pollution events, extreme weather impacts, pH changes, biodiversity.

Return exactly 15 insights as a JSON array. Start immediately with [ and end with ].`;

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.insights.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8000, // Enough for 15 detailed insights
      temperature: AI_CONFIG.insights.temperature,
    });

    let content = response.choices[0]?.message?.content || "[]";
    
    // Strip markdown code blocks if present
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    
    const insights = JSON.parse(content);
    
    // Add IDs
    return insights.map((insight: any, index: number) => ({
      ...insight,
      id: `ai-insight-${index + 1}`
    }));
  } catch (error) {
    console.error("Insights generation failed:", error);
    throw new Error("Unable to generate monthly insights.");
  }
};

/**
 * Generate image using DALL-E 3
 */
export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Ocean/marine themed: ${prompt}. Realistic, scientific, beautiful.`,
      n: 1,
      size: AI_CONFIG.images.size,
      quality: AI_CONFIG.images.quality,
    });

    return response.data?.[0]?.url || "";
  } catch (error) {
    console.error("Image generation failed:", error);
    throw new Error("Unable to generate image.");
  }
};
