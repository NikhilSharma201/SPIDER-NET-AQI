import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Wind, ShieldAlert } from 'lucide-react';

// AQI level config — color, label, advice
const AQI_LEVELS = [
  {
    min: 301,
    label: 'HAZARDOUS',
    color: '#7e0023',
    glow: 'rgba(126,0,35,0.6)',
    bg: 'rgba(126,0,35,0.15)',
    border: '#7e0023',
    advice: 'Everyone must avoid ALL outdoor activity. Stay indoors, seal windows & doors.',
    icon: '☣️',
  },
  {
    min: 201,
    label: 'VERY UNHEALTHY',
    color: '#8f3f97',
    glow: 'rgba(143,63,151,0.6)',
    bg: 'rgba(143,63,151,0.15)',
    border: '#8f3f97',
    advice: 'Health alert: Everyone may experience serious effects. Avoid prolonged outdoor exposure.',
    icon: '🚫',
  },
  {
    min: 151,
    label: 'UNHEALTHY',
    color: '#ff003c',
    glow: 'rgba(255,0,60,0.5)',
    bg: 'rgba(255,0,60,0.12)',
    border: '#ff003c',
    advice: 'Sensitive groups face significant risk. Limit outdoor activity. Wear an N95 mask.',
    icon: '⚠️',
  },
  {
    min: 101,
    label: 'UNHEALTHY FOR SENSITIVE GROUPS',
    color: '#ff7e00',
    glow: 'rgba(255,126,0,0.4)',
    bg: 'rgba(255,126,0,0.10)',
    border: '#ff7e00',
    advice: 'Children, elderly & those with respiratory issues should reduce outdoor activity.',
    icon: '🔶',
  },
];

function getLevel(aqi) {
  return AQI_LEVELS.find((l) => aqi >= l.min) || null;
}

export default function AlertBanner({ aqi, city, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const level = getLevel(aqi);

  useEffect(() => {
    if (level) {
      setVisible(true);
    }
  }, [aqi, city]);

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <AnimatePresence>
      {visible && level && (
        <>
          {/* Full-screen flash overlay on mount */}
          <motion.div
            key="flash"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: level.color,
              pointerEvents: 'none',
              zIndex: 9998,
            }}
          />

          {/* Main Alert Banner */}
          <motion.div
            key={`alert-${city}-${aqi}`}
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              background: `linear-gradient(135deg, ${level.bg}, rgba(10,12,20,0.97))`,
              borderBottom: `2px solid ${level.border}`,
              boxShadow: `0 4px 40px ${level.glow}`,
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Animated scan line */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${level.color}, transparent)`,
                width: '40%',
              }}
              animate={{ x: ['0%', '250%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div
              style={{
                maxWidth: '1152px',
                margin: '0 auto',
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              {/* Pulsing icon */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  color: level.color,
                  flexShrink: 0,
                  filter: `drop-shadow(0 0 8px ${level.color})`,
                }}
              >
                <ShieldAlert size={28} />
              </motion.div>

              {/* Text content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                  <span
                    style={{
                      color: level.color,
                      fontWeight: '800',
                      fontSize: '13px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {level.icon} SPIDER-NET ALERT — {level.label}
                  </span>
                  <span
                    style={{
                      background: level.color,
                      color: '#fff',
                      padding: '1px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '700',
                    }}
                  >
                    AQI {aqi}
                  </span>
                  <span style={{ color: '#888', fontSize: '12px' }}>
                    — {city}
                  </span>
                </div>
                <p style={{ color: '#ccc', fontSize: '13px', margin: 0 }}>
                  <Wind size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  {level.advice}
                </p>
              </div>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                style={{
                  background: 'transparent',
                  border: `1px solid ${level.border}40`,
                  borderRadius: '6px',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = level.color; e.currentTarget.style.borderColor = level.color; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = `${level.border}40`; }}
                title="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>

          {/* Spacer so content doesn't hide under the banner */}
          <div style={{ height: '68px' }} />
        </>
      )}
    </AnimatePresence>
  );
}