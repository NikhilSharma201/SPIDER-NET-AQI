import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp, Zap, Shield, XCircle, BarChart2, AlertTriangle } from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────────────────

const ACTIVITY_ICONS = {
  "Strenuous Exercise":      "🏃",
  "Moderate Activity":       "🚶",
  "Relaxing Outdoors":       "🌿",
  "Outdoor Event":           "🎉",
  "Children's Outdoor Play": "👧",
  "Commuting (Walk/Bike)":   "🚴",
};

const DECISION_CONFIG = {
  GO:      { icon: Shield,   iconColor: '#00E400', bg: 'rgba(0,228,0,0.07)',    border: 'rgba(0,228,0,0.25)',    label: 'GO',      badgeBg: '#00E40022' },
  CAUTION: { icon: Zap,      iconColor: '#FF7E00', bg: 'rgba(255,126,0,0.07)',  border: 'rgba(255,126,0,0.25)',  label: 'CAUTION', badgeBg: '#FF7E0022' },
  STOP:    { icon: XCircle,  iconColor: '#FF003C', bg: 'rgba(255,0,60,0.07)',   border: 'rgba(255,0,60,0.25)',   label: 'STOP',    badgeBg: '#FF003C22' },
};

const POLLUTANT_COLORS = {
  'PM.2.5': '#ff003c',
  'PM.10':  '#ff7e00',
  'O3':     '#ffff00',
  'NO2':    '#8f3f97',
  'CO':     '#00f0ff',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Mini horizontal bar for contribution visualization
function ContribBar({ pollutant, value, maxValue }) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  const color = POLLUTANT_COLORS[pollutant] || '#888';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 text-right font-mono" style={{ color }}>{pollutant}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="w-10 text-gray-500 font-mono">{value.toFixed(3)}</span>
    </div>
  );
}

// Single activity card
function ActivityCard({ activity, result, isExpanded, onToggle }) {
  const cfg = DECISION_CONFIG[result.decision] || DECISION_CONFIG.GO;
  const DecIcon = cfg.icon;
  const emoji = ACTIVITY_ICONS[activity] || '🏙️';
  const maxContrib = Math.max(...Object.values(result.contributions));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border overflow-hidden cursor-pointer"
      style={{
        background: isExpanded ? cfg.bg : 'rgba(255,255,255,0.02)',
        borderColor: isExpanded ? cfg.border : 'rgba(255,255,255,0.07)',
        transition: 'background 0.3s, border-color 0.3s',
      }}
      onClick={onToggle}
    >
      {/* Card header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{activity}</p>
            <p className="text-gray-500 text-xs mt-0.5">{result.short_advice}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Risk score pill */}
          <div className="text-center hidden sm:block">
            <div className="text-xs text-gray-600 mb-0.5">Risk Score</div>
            <div className="font-bold text-sm" style={{ color: cfg.iconColor }}>
              {result.risk_score.toFixed(2)}
            </div>
          </div>

          {/* Decision badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs"
            style={{ background: cfg.badgeBg, color: cfg.iconColor, border: `1px solid ${cfg.border}` }}
          >
            <DecIcon size={13} />
            {result.decision}
          </div>

          {isExpanded
            ? <ChevronUp size={16} className="text-gray-500" />
            : <ChevronDown size={16} className="text-gray-500" />
          }
        </div>
      </div>

      {/* Expanded detail panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-4">
              {/* Detail text */}
              <p className="text-gray-400 text-xs leading-relaxed">{result.detail}</p>

              {/* Action items */}
              {result.actions.length > 0 && (
                <div className="space-y-1">
                  {result.actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <span style={{ color: cfg.iconColor }} className="mt-0.5 flex-shrink-0">→</span>
                      {action}
                    </div>
                  ))}
                </div>
              )}

              {/* Pollutant contribution bars */}
              <div>
                <p className="text-gray-600 text-xs mb-2 flex items-center gap-1">
                  <BarChart2 size={11} /> Pollutant risk contributions
                </p>
                <div className="space-y-1.5">
                  {Object.entries(result.contributions)
                    .sort((a, b) => b[1] - a[1])
                    .map(([p, val]) => (
                      <ContribBar
                        key={p}
                        pollutant={p.toUpperCase().replace('_', '.')}
                        value={val}
                        maxValue={maxContrib}
                      />
                    ))
                  }
                </div>
              </div>

              {/* Top drivers callout */}
              {result.top_drivers.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle size={12} style={{ color: cfg.iconColor }} />
                  <span className="text-gray-500">Top drivers:</span>
                  {result.top_drivers.map((d, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded font-bold"
                      style={{
                        color: POLLUTANT_COLORS[d.pollutant] || '#fff',
                        background: `${POLLUTANT_COLORS[d.pollutant] || '#888'}22`,
                      }}
                    >
                      {d.pollutant}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// WHO guideline table
function WhoTable({ whoTable }) {
  const statusStyle = {
    safe:    { color: '#00e400', label: '✅ Safe' },
    elevated:{ color: '#ff7e00', label: '⚠️ Elevated' },
    exceeds: { color: '#ff003c', label: '🚫 Exceeds' },
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-600 border-b border-gray-800">
            <th className="text-left py-2 pr-4">Pollutant</th>
            <th className="text-right py-2 pr-4">Current</th>
            <th className="text-right py-2 pr-4">WHO Limit</th>
            <th className="text-right py-2 pr-4">% of Limit</th>
            <th className="text-right py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {whoTable.map((row) => {
            const s = statusStyle[row.status] || statusStyle.safe;
            return (
              <tr key={row.pollutant} className="border-b border-gray-900">
                <td className="py-2 pr-4 font-mono font-bold text-white">{row.pollutant}</td>
                <td className="py-2 pr-4 text-right text-gray-300">{row.current} μg/m³</td>
                <td className="py-2 pr-4 text-right text-gray-500">{row.guideline}</td>
                <td className="py-2 pr-4 text-right font-bold" style={{ color: s.color }}>
                  {row.percent_of_guideline}%
                </td>
                <td className="py-2 text-right" style={{ color: s.color }}>{s.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function DecisionEngine({ city, decisionData, loading }) {
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [showWhoTable, setShowWhoTable] = useState(false);

  const toggle = (activity) =>
    setExpandedActivity((prev) => (prev === activity ? null : activity));

  // Summary counts
  const counts = decisionData
    ? Object.values(decisionData.activities).reduce(
        (acc, r) => { acc[r.decision] = (acc[r.decision] || 0) + 1; return acc; },
        {}
      )
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-spider-card rounded-xl border border-gray-800 md:col-span-3 overflow-hidden"
    >
      {/* Panel header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-spider-red/10 border border-spider-red/20">
            <Brain size={20} className="text-spider-red" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">Decision Engine</h2>
            <p className="text-gray-600 text-xs">
              Activity risk assessment · WHO pollutant analysis
              {city && <span className="text-gray-500"> · {city}</span>}
            </p>
          </div>
        </div>

        {/* Summary badges */}
        {decisionData && (
          <div className="flex items-center gap-2">
            {counts.GO     && <span className="text-xs px-2 py-1 rounded font-bold" style={{ background: '#00E40015', color: '#00E400', border: '1px solid #00E40030' }}>✅ {counts.GO} GO</span>}
            {counts.CAUTION && <span className="text-xs px-2 py-1 rounded font-bold" style={{ background: '#FF7E0015', color: '#FF7E00', border: '1px solid #FF7E0030' }}>⚠️ {counts.CAUTION} CAUTION</span>}
            {counts.STOP   && <span className="text-xs px-2 py-1 rounded font-bold" style={{ background: '#FF003C15', color: '#FF003C', border: '1px solid #FF003C30' }}>🚫 {counts.STOP} STOP</span>}
          </div>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-600 animate-pulse gap-2">
            <Brain size={18} /> Analysing pollutant data...
          </div>
        ) : !decisionData ? (
          <div className="text-center text-gray-700 py-10">
            <Brain size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Scan a city to run the decision engine</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Activity cards */}
            {Object.entries(decisionData.activities).map(([activity, result]) => (
              <ActivityCard
                key={activity}
                activity={activity}
                result={result}
                isExpanded={expandedActivity === activity}
                onToggle={() => toggle(activity)}
              />
            ))}

            {/* WHO Guideline Table toggle */}
            {decisionData.who_table?.length > 0 && (
              <div className="mt-4 rounded-xl border border-gray-800 overflow-hidden">
                <button
                  onClick={() => setShowWhoTable((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-gray-400 hover:text-white transition-colors text-sm font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <BarChart2 size={16} /> WHO Guideline Comparison
                  </span>
                  {showWhoTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                  {showWhoTable && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden px-4 pb-4 border-t border-gray-800 pt-3"
                    >
                      <WhoTable whoTable={decisionData.who_table} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}