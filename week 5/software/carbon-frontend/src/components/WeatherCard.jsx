import './components.css';

const WEATHER_ICONS = {
  "clear sky": "☀️", "few clouds": "🌤️", "scattered clouds": "⛅",
  "broken clouds": "☁️", "shower rain": "🌧️", "rain": "🌦️",
  "thunderstorm": "⛈️", "snow": "❄️", "mist": "🌫️",
};

function getTempColor(temp) {
  if (temp >= 38) return "#dc2626";
  if (temp >= 30) return "#ea580c";
  if (temp <= 15) return "#2563eb";
  return "#15803d";
}

export default function WeatherCard({ weather }) {
  if (!weather) return null;
  const icon      = WEATHER_ICONS[weather.description?.toLowerCase()] || "🌡️";
  const tempColor = getTempColor(weather.temperature);

  return (
    <div className="c-card">
      <p className="c-card-title">{icon} {weather.city} Today</p>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
        <span className="weather-temp" style={{ color: tempColor }}>
          {weather.temperature}°C
        </span>
        <div>
          <p className="weather-desc">{weather.description}</p>
          <p className="weather-humidity">Humidity: {weather.humidity}%</p>
        </div>
      </div>

      <div className="weather-tip">
        <p className="weather-tip-label">💡 Energy Saving Tip</p>
        <p className="weather-tip-text">{weather.tip}</p>
      </div>
    </div>
  );
}
