import { motion } from 'framer-motion';
import { 
  Droplets, Wind, Eye, Gauge, Sun, Cloud, 
  CloudRain, CloudSnow, CloudLightning, Cloudy 
} from 'lucide-react';

// Map Open-Meteo WMO weather codes to icon + label
function getWeatherInfo(code) {
  if (code === 0)              return { icon: Sun,             label: 'Clear Sky',        color: '#FFD700' };
  if (code <= 2)               return { icon: Cloudy,          label: 'Partly Cloudy',    color: '#a0aec0' };
  if (code === 3)              return { icon: Cloud,           label: 'Overcast',         color: '#718096' };
  if (code <= 49)              return { icon: Cloud,           label: 'Foggy',            color: '#90cdf4' };
  if (code <= 57)              return { icon: CloudRain,       label: 'Drizzle',          color: '#63b3ed' };
  if (code <= 67)              return { icon: CloudRain,       label: 'Rain',             color: '#4299e1' };
  if (code <= 77)              return { icon: CloudSnow,       label: 'Snow',             color: '#bee3f8' };
  if (code <= 82)              return { icon: CloudRain,       label: 'Rain Showers',     color: '#3182ce' };
  if (code <= 86)              return { icon: CloudSnow,       label: 'Snow Showers',     color: '#90cdf4' };
  if (code <= 99)              return { icon: CloudLightning,  label: 'Thunderstorm',     color: '#f6e05e' };
  return                              { icon: Sun,             label: 'Unknown',          color: '#a0aec0' };
}

// UV Index label
function getUVLabel(uv) {
  if (uv <= 2)  return { label: 'Low',       color: '#00e400' };
  if (uv <= 5)  return { label: 'Moderate',  color: '#ffff00' };
  if (uv <= 7)  return { label: 'High',      color: '#ff7e00' };
  if (uv <= 10) return { label: 'Very High', color: '#ff003c' };
  return              { label: 'Extreme',    color: '#8f3f97' };
}

export default function WeatherCard({ weather, cityName }) {
  if (!weather) return null;

  const { icon: WeatherIcon, label: weatherLabel, color: weatherColor } = getWeatherInfo(weather.weathercode);
  const uvInfo = getUVLabel(weather.uv_index ?? 0);

  const stats = [
    {
      icon: Droplets,
      label: 'Humidity',
      value: `${weather.relativehumidity_2m}%`,
      color: '#00f0ff',
    },
    {
      icon: Wind,
      label: 'Wind',
      value: `${weather.windspeed_10m} km/h`,
      color: '#00f0ff',
    },
    {
      icon: Eye,
      label: 'Visibility',
      value: `${(weather.visibility / 1000).toFixed(1)} km`,
      color: '#00f0ff',
    },
    {
      icon: Gauge,
      label: 'Pressure',
      value: `${weather.surface_pressure?.toFixed(0)} hPa`,
      color: '#00f0ff',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-spider-card rounded-xl border border-gray-800 relative overflow-hidden md:col-span-3"
      style={{ boxShadow: `0 0 20px ${weatherColor}22` }}
    >
      {/* Top color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${weatherColor}, transparent)` }}
      />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-gray-400 font-semibold flex items-center gap-2 mb-1">
              <Sun size={18} /> Current Weather
            </h2>
            <p className="text-gray-600 text-xs">{cityName}</p>
          </div>

          {/* Main weather condition */}
          <div className="flex items-center gap-3">
            <WeatherIcon size={36} style={{ color: weatherColor, filter: `drop-shadow(0 0 8px ${weatherColor})` }} />
            <div className="text-right">
              <div className="text-white font-semibold text-lg">{weatherLabel}</div>
              <div className="text-gray-500 text-xs">
                Feels like {weather.apparent_temperature?.toFixed(1)}°C
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-lg p-3 border border-gray-700 flex flex-col gap-1"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <Icon size={13} style={{ color }} />
                {label}
              </div>
              <div className="text-white font-bold text-lg">{value}</div>
            </div>
          ))}
        </div>

        {/* UV Index + Sunrise/Sunset footer */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <Sun size={14} style={{ color: uvInfo.color }} />
            <span className="text-gray-500 text-xs">UV Index</span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ color: uvInfo.color, background: `${uvInfo.color}22`, border: `1px solid ${uvInfo.color}55` }}
            >
              {weather.uv_index?.toFixed(1)} — {uvInfo.label}
            </span>
          </div>
          {weather.precipitation != null && (
            <div className="flex items-center gap-2">
              <Droplets size={14} className="text-blue-400" />
              <span className="text-gray-500 text-xs">Precipitation</span>
              <span className="text-white text-xs font-semibold">{weather.precipitation} mm</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}