import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getGlobalOceanSnapshot } from '../../services/dashboardService';
import { DashboardOceanData } from '../../types';
import OceanStatusCard from '../../components/OceanStatusCard';
import { Loader2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardOceanData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        // Fetch real-time data if authenticated, otherwise delayed by 5 hours
        const data = await getGlobalOceanSnapshot(isAuthenticated);
        setDashboardData(data);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial Load
    loadDashboard();

    // Update every 5 hours (5 * 60 * 60 * 1000 ms)
    const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
    intervalId = setInterval(loadDashboard, FIVE_HOURS_MS);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">MARINOVA</h2>
          <p className="text-cyan-400 font-medium">Ocean Data Explorer</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
            <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-amber-400 shadow-amber-400/50'} animate-pulse shadow-[0_0_8px_currentColor]`}></div>
            <span className="text-sm font-medium text-slate-200">
              {isAuthenticated ? 'Real-Time Satellite Feed' : 'Data delayed 5h • Sign in for Real-Time'}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="animate-pulse">Acquiring satellite telemetry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {dashboardData.map((ocean) => (
            <OceanStatusCard key={ocean.oceanId} data={ocean} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
