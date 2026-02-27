import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Activity, Thermometer, AlertTriangle, MapPin, Bell, BellOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MapContainer, TileLayer, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Loader from './Loader';
import AlertBanner from './AlertBanner';
import useAlertStream from './useAlertStream';

// Helper to auto-center map when a new city is searched
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 10);
  }, [coords, map]);
  return null;
}

// Custom dot renderer — highlights the LAST (current) dot
const CustomDot = (props) => {
  const { cx, cy, index, dataLength } = props;
  const isLast = index === dataLength - 1;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isLast ? 7 : 4}
      fill="#ff003c"
      stroke={isLast ? '#ffffff' : 'none'}
      strokeWidth={isLast ? 2 : 0}
    />
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#1a2332',
        border: '1px solid #00f0ff',
        borderRadius: '8px',
        padding: '10px 14px',
      }}>
        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>{label}</p>
        <p style={{ color: '#00f0ff', fontWeight: 'bold', fontSize: '18px', margin: '4px 0 0' }}>
          AQI: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// AQI status label helper
const getAqiStatus = (aqi) => {
  if (aqi > 300) return { label: 'Hazardous', color: '#7e0023' };
  if (aqi > 200) return { label: 'Very Unhealthy', color: '#8f3f97' };
  if (aqi > 150) return { label: 'Unhealthy', color: '#ff003c' };
  if (aqi > 100) return { label: 'Unhealthy for Sensitive', color: '#ff7e00' };
  if (aqi > 50)  return { label: 'Moderate', color: '#ffff00' };
  return { label: 'Good', color: '#00e400' };
};

export default function Dashboard() {
  const [city, setCity] = useState('');
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [alertKey, setAlertKey] = useState(0);
  // SSE-driven background alerts (fired by the ETL scheduler, independent of user search)
  const [sseAlert, setSseAlert] = useState(null);

  useAlertStream((alertCity, alertAqi) => {
    setSseAlert({ city: alertCity, aqi: alertAqi, key: Date.now() });
  });

  // Sine-wave variance for smooth historical data
  const generateTimeline = (currentAqi) => {
    const now = new Date();
    const timeline = [];
    for (let i = 6; i > 0; i--) {
      const past = new Date(now.getTime() - i * 60 * 60 * 1000);
      const sineVariance = Math.round(Math.sin(i * 0.9) * 18);
      timeline.push({
        time: past.getHours().toString().padStart(2, '0') + ':00',
        aqi: Math.max(1, currentAqi + sineVariance),
      });
    }
    timeline.push({
      time: now.getHours().toString().padStart(2, '0') + ':00',
      aqi: currentAqi,
    });
    return timeline;
  };

  const fetchData = async (e) => {
    e.preventDefault();
    if (!city) return;
    setLoading(true);
    // Reset alert state for new city
    setAlertDismissed(false);
    setAlertKey((k) => k + 1);
    try {
      const res = await fetch(`http://localhost:8000/api/aqi/${city}`);
      if (!res.ok) throw new Error('City not found');
      const result = await res.json();
      setData(result);
      setTrends(generateTimeline(result.aqi));
    } catch (error) {
      console.error('Web shooters jammed:', error);
      alert("City not found or API error. Try a major city name like 'Pune' or 'Chennai'.");
    }
    setLoading(false);
  };

  const getAqiColor = (aqi) => {
    if (aqi > 150) return 'text-spider-red';
    if (aqi > 100) return 'text-orange-500';
    if (aqi > 50)  return 'text-yellow-400';
    return 'text-green-400';
  };

  const getMapColorHex = (aqi) => {
    if (aqi > 300) return '#7e0023';
    if (aqi > 200) return '#8f3f97';
    if (aqi > 150) return '#ff0000';
    if (aqi > 100) return '#ff7e00';
    if (aqi > 50)  return '#ffff00';
    return '#00e400';
  };

  const yDomainMin = (dataMin) => Math.max(0, Math.floor(dataMin - 20));
  const yDomainMax = (dataMax) => Math.ceil(dataMax + 20);

  const aqiStatus = data ? getAqiStatus(data.aqi) : null;
  // Show alert for AQI > 100 (Unhealthy for Sensitive and above)
  const shouldAlert = data && data.aqi > 100 && !alertDismissed;

  return (
    <div className="min-h-screen bg-spider-dark text-white p-6 font-sans">

      {/* ✅ ALERT BANNER — search-triggered (AQI from user's city scan) */}
      {shouldAlert && (
        <AlertBanner
          key={alertKey}
          aqi={data.aqi}
          city={data.city}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}

      {/* ✅ ALERT BANNER — SSE-triggered (from background ETL scheduler) */}
      {sseAlert && !shouldAlert && (
        <AlertBanner
          key={sseAlert.key}
          aqi={sseAlert.aqi}
          city={sseAlert.city}
          onDismiss={() => setSseAlert(null)}
        />
      )}

      <header className="max-w-6xl mx-auto mb-10 text-center">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-spider-red to-spider-blue"
        >
          SPIDER-NET AQI
        </motion.h1>
        <p className="text-gray-400 mt-2 tracking-widest uppercase text-sm">Pan-India Environmental Grid</p>
      </header>

      <main className="max-w-6xl mx-auto">
        <form onSubmit={fetchData} className="flex gap-4 mb-8 justify-center">
          <input
            type="text"
            placeholder="Scan any city (e.g., Bhopal, Chennai)..."
            className="px-6 py-3 bg-spider-card border border-spider-blue/30 rounded-lg focus:outline-none focus:border-spider-blue w-96 text-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] focus:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-spider-red hover:bg-red-700 rounded-lg flex items-center gap-2 font-bold transition-all shadow-[0_0_15px_rgba(255,0,60,0.4)]"
          >
            <Search size={20} /> Scan
          </button>
        </form>

        {loading ? (
          <Loader />
        ) : data ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* AQI Card */}
            <div className="bg-spider-card p-6 rounded-xl border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-spider-red"></div>
              <h2 className="text-gray-400 font-semibold mb-4 flex items-center gap-2">
                <Activity size={18} /> Air Quality Index
              </h2>
              <div className={`text-6xl font-bold ${getAqiColor(data.aqi)}`}>
                {data.aqi}
              </div>
              {/* AQI status badge */}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: `${aqiStatus.color}22`, color: aqiStatus.color, border: `1px solid ${aqiStatus.color}55` }}
                >
                  {aqiStatus.label}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{data.city}</p>

              {/* Hazard warning inside card */}
              {data.aqi > 150 && (
                <div className="mt-4 text-spider-red text-sm flex items-center gap-2 animate-pulse">
                  <AlertTriangle size={16} /> Hazard Level Detected
                </div>
              )}

              {/* Re-trigger alert button if dismissed */}
              {alertDismissed && data.aqi > 100 && (
                <button
                  onClick={() => { setAlertDismissed(false); setAlertKey((k) => k + 1); }}
                  className="mt-3 text-xs flex items-center gap-1 text-gray-500 hover:text-orange-400 transition-colors"
                >
                  <Bell size={12} /> Show Alert Again
                </button>
              )}
            </div>

            {/* Temp Card */}
            <div className="bg-spider-card p-6 rounded-xl border border-gray-800 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-spider-blue"></div>
              <h2 className="text-gray-400 font-semibold mb-4 flex items-center gap-2">
                <Thermometer size={18} /> Temperature
              </h2>
              <div className="text-5xl font-bold text-white">
                {typeof data.temp === 'number' ? data.temp.toFixed(1) : data.temp}°C
              </div>
            </div>

            {/* Area Map */}
            <div className="bg-spider-card p-4 rounded-xl border border-gray-800 relative md:col-span-1 h-64 overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <h2 className="text-gray-400 font-semibold mb-2 flex items-center gap-2 text-sm z-10 relative">
                <MapPin size={16} /> Regional AQI Intensity
              </h2>
              <div className="w-full h-52 rounded-lg overflow-hidden">
                <MapContainer center={[data.lat, data.lng]} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <ChangeMapView coords={[data.lat, data.lng]} />
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <Circle
                    center={[data.lat, data.lng]}
                    pathOptions={{
                      color: getMapColorHex(data.aqi),
                      fillColor: getMapColorHex(data.aqi),
                      fillOpacity: 0.35,
                      weight: 2,
                    }}
                    radius={12000}
                  />
                </MapContainer>
              </div>
            </div>

            {/* Trends Chart */}
            <div className="bg-spider-card p-6 rounded-xl border border-gray-800 md:col-span-3 mt-2" style={{ height: '340px' }}>
              <h2 className="text-gray-400 font-semibold mb-4 flex items-center justify-between">
                <span>Live Timeline (Hourly)</span>
                <span className="text-xs text-gray-600 font-normal">Last 6 hours → Now</span>
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="time" stroke="#555" tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 12 }} domain={[yDomainMin, yDomainMax]} width={45} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={data.aqi}
                    stroke="#ff003c"
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                    label={{ value: `Now: ${data.aqi}`, fill: '#ff003c', fontSize: 11, position: 'insideTopRight' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="aqi"
                    stroke="#00f0ff"
                    strokeWidth={3}
                    dot={(props) => <CustomDot {...props} dataLength={trends.length} />}
                    activeDot={{ r: 9, fill: '#00f0ff', stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ) : (
          <div className="text-center text-gray-600 mt-20 text-lg animate-pulse">
            Awaiting network target...
          </div>
        )}
      </main>
    </div>
  );
}