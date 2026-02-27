import { useEffect, useRef, useCallback } from 'react';

/**
 * useAlertStream — subscribes to the FastAPI SSE alert stream.
 * Calls `onAlert(city, aqi)` whenever a hazardous AQI is detected
 * by the background ETL scheduler (not just manual searches).
 *
 * Usage:
 *   useAlertStream((city, aqi) => {
 *     setAlert({ city, aqi });
 *   });
 */
export default function useAlertStream(onAlert) {
  const esRef = useRef(null);
  const stableCallback = useRef(onAlert);

  useEffect(() => {
    stableCallback.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
    // Create EventSource connection to the FastAPI SSE endpoint
    const es = new EventSource('http://localhost:8000/api/alerts/stream');
    esRef.current = es;

    es.addEventListener('connected', (e) => {
      console.log('🕸️ Spider-Net Alert Stream connected:', e.data);
    });

    es.addEventListener('aqi_alert', (e) => {
      try {
        const data = JSON.parse(e.data);
        console.warn(`🚨 SSE Alert received: ${data.city} AQI ${data.aqi}`);
        stableCallback.current(data.city, data.aqi);
      } catch (err) {
        console.error('Alert parse error:', err);
      }
    });

    es.onerror = () => {
      // SSE auto-reconnects, no need to panic
      console.warn('Alert stream connection interrupted — reconnecting...');
    };

    return () => {
      es.close();
    };
  }, []); // Only open once on mount
}