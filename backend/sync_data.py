import requests
import sqlite3
import logging
import os
import time
import schedule

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Configuration
WAQI_TOKEN = "b2cc92eb7a941b1da252d56e483c46119a507f74"

# 🇮🇳 India Focus: Major Metros & Tech Hubs
CITIES = ["mumbai", "delhi", "bengaluru", "hyderabad", "chennai", "kolkata", "pune", "ahmedabad"]

# Automatically resolve the path for Windows
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")
AQI_THRESHOLD = 150

def init_db():
    """Ensure the database and table exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS aqi_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT,
            aqi INTEGER,
            temp REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    logging.info("Database initialized.")

def fetch_and_store_aqi():
    """Fetch AQI data from WAQI and store in SQLite."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    for city in CITIES:
        try:
            url = f"https://api.waqi.info/feed/{city}/?token={WAQI_TOKEN}"
            response = requests.get(url).json()
            
            if response.get('status') == 'ok':
                data = response['data']
                aqi = data.get('aqi', 0)
                # WAQI sometimes provides 't' (temperature) in iaqi
                temp = data.get('iaqi', {}).get('t', {}).get('v', 0.0) 
                
                cursor.execute("INSERT INTO aqi_data (city, aqi, temp) VALUES (?, ?, ?)", (city, aqi, temp))
                logging.info(f"✅ Ingested data for {city.capitalize()}: AQI {aqi}, Temp {temp}°C")
                
                # Check Threshold for Alerts
                if aqi > AQI_THRESHOLD:
                    trigger_alert(city, aqi)
            else:
                logging.error(f"❌ API Error for {city}: {response.get('data')}")
        except Exception as e:
            logging.error(f"❌ Failed to fetch data for {city}: {e}")
            
    conn.commit()
    conn.close()

def trigger_alert(city, aqi):
    """Simulates an alert trigger."""
    logging.warning(f"🚨 SPIDER-ALERT: Hazardous pollution in {city.capitalize()}! AQI is {aqi}.")

def run_etl_job():
    print("\n🕸️ --- Starting Scheduled Data Sync --- 🕸️")
    fetch_and_store_aqi()
    print("🕸️ --- Sync Complete! Waiting for next cycle... --- 🕸️\n")

if __name__ == "__main__":
    print("🕸️ Initializing SpiderNet Database...")
    init_db()
    
    # Run the job immediately when you start the script
    run_etl_job()
    
    # Schedule the job to run every 5 minutes (Hackathon Demo Speed!)
    schedule.every(5).minutes.do(run_etl_job)
    
    print("⏰ Automation Engine Online. Press Ctrl+C to stop.")
    
    # Keep the script running forever
    while True:
        schedule.run_pending()
        time.sleep(1)