import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FIVE_OCEANS } from '../../constants';
import { OceanLocation, WeatherResponse, WeatherDataPoint, DailyForecast } from '../../types';
import { fetchWeatherData, transformToChartData, transformToDailyForecast } from '../../services/weatherService';
import { analyzeWeather } from '../../services/geminiService';
import { checkAndIncrementUsage } from '../../services/usageService';
import WeatherChart from '../../components/WeatherChart';
import OceanCard from '../../components/OceanCard';
import CurrentConditions from '../../components/CurrentConditions';
import DailyForecastList from '../../components/DailyForecast';
import { Loader2, Search, Navigation, MapIcon, Thermometer, BrainCircuit, Lock } from 'lucide-react';

const ForecastPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<OceanLocation>(FIVE_OCEANS[0]);
  const [customLat, setCustomLat] = useState<string>('');
  const [customLon, setCustomLon] = useState<string>('');
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [chartData, setChartData] = useState<WeatherDataPoint[]>([]);
  const [dailyData, setDailyData] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  // Initialize custom inputs
  useEffect(() => {
    setCustomLat(selectedLocation.lat.toString());
    setCustomLon(selectedLocation.lon.toString());
  }, [selectedLocation]);

  const loadWeatherData = useCallback(async (loc: OceanLocation) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    
    try {
      const data = await fetchWeatherData(loc.lat, loc.lon);
      setWeather(data);
      setChartData(transformToChartData(data));
      setDailyData(transformToDailyForecast(data));
    } catch (err) {
      setError("Failed to fetch weather data. Please check connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadWeatherData(selectedLocation);
  }, []);

  const handleLocationSelect = (loc: OceanLocation) => {
    if (!checkAndIncrementUsage()) return;
    setSelectedLocation(loc);
    loadWeatherData(loc);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAndIncrementUsage()) return;

    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError("Invalid coordinates.");
      return;
    }

    const customLoc: OceanLocation = {
      id: 'custom',
      name: 'Custom Coordinates',
      lat,
      lon,
      description: 'User specified location'
    };
    setSelectedLocation(customLoc);
    loadWeatherData(customLoc);
  };

  const handleAiAnalysis = async () => {
    if (!weather) return;
    
    // Check if user has subscription for AI analysis
    if (user && user.subscriptionStatus === 'free') {
      navigate('/subscription');
      return;
    }
    
    if (!checkAndIncrementUsage()) return;
    
    setAnalyzing(true);
    try {
      const result = await analyzeWeather(
        selectedLocation.name,
        selectedLocation.lat,
        selectedLocation.lon,
        weather
      );
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setAnalysis("Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    if (!checkAndIncrementUsage()) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc: OceanLocation = {
          id: 'user',
          name: 'Your Location',
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          description: 'Current device location'
        };
        setSelectedLocation(userLoc);
        loadWeatherData(userLoc);
      },
      () => {
        setLoading(false);
        setError("Unable to retrieve location.");
      }
    );
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Forecast Intelligence</h2>
        <p className="text-slate-400 text-sm">Detailed weather analysis and AI predictions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-cyan-400" />
              Select Region
            </h2>
            
            <div className="space-y-3 mb-6">
              {FIVE_OCEANS.map(ocean => (
                <OceanCard 
                  key={ocean.id}
                  ocean={ocean}
                  isSelected={selectedLocation.id === ocean.id}
                  onClick={handleLocationSelect}
                />
              ))}
            </div>

            <div className="border-t border-slate-700/50 pt-6">
              <form onSubmit={handleCustomSearch} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    placeholder="Lat"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Lon"
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Find
                  </button>
                  <button
                    type="button"
                    onClick={handleGeolocation}
                    className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
          {weather && <DailyForecastList data={dailyData} />}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          {/* Header Card */}
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  {selectedLocation.name}
                </h2>
                <p className="text-slate-400 font-mono text-sm">
                  {selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lon.toFixed(4)}° E
                </p>
              </div>
              {weather && (
                <div className="flex gap-6">
                  <div className="text-right">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Temp</p>
                    <div className="flex items-center justify-end gap-2 text-2xl font-bold text-cyan-400">
                      <Thermometer className="w-6 h-6" />
                      {weather.current.temperature_2m}°C
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {weather && <CurrentConditions data={weather} />}

          <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-200">48-Hour Deep Dive</h3>
              {loading && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
            </div>
            
            {loading && !chartData.length ? (
              <div className="h-[300px] w-full flex items-center justify-center text-slate-500">
                Loading weather data...
              </div>
            ) : (
              <WeatherChart data={chartData} />
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-900/40 to-[#1e293b] border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-indigo-200 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5" />
                Captain's Intelligence Brief
              </h3>
              <button
                onClick={handleAiAnalysis}
                disabled={analyzing || loading || !weather}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analysing...
                  </>
                ) : user && user.subscriptionStatus === 'free' ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Pro Feature
                  </>
                ) : (
                  <>
                    Generate Brief
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#0f172a]/50 rounded-xl p-4 min-h-[120px] border border-indigo-500/10">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-indigo-300/50 py-8">
                  <BrainCircuit className="w-8 h-8 animate-pulse" />
                  <p className="text-sm animate-pulse">Processing barometric pressure and wind patterns...</p>
                </div>
              ) : analysis ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="whitespace-pre-line text-slate-300 leading-relaxed">
                    {analysis}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600 py-4">
                  <p className="text-sm">Tap "Generate Brief" for an AI maritime assessment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastPage;
