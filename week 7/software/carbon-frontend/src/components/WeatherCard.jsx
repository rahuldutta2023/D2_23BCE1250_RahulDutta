import { useLang } from "../i18n";
import './components.css';

const WEATHER_ICONS = {
  "clear sky": "☀️", "few clouds": "🌤️", "scattered clouds": "⛅",
  "broken clouds": "☁️", "shower rain": "🌧️", "rain": "🌦️",
  "thunderstorm": "⛈️", "snow": "❄️", "mist": "🌫️",
};

function getTempColor(temp) {
  if (temp >= 38) return "#ef4444";
  if (temp >= 30) return "#f59e0b";
  if (temp <= 15) return "#3b82f6";
  return "var(--accent)";
}

export default function WeatherCard({ weather }) {
  const { t } = useLang();
  if (!weather) return null;
  const icon      = WEATHER_ICONS[weather.description?.toLowerCase()] || "🌡️";
  const tempColor = getTempColor(weather.temperature);

  return (
    <div className="c-card">
      <p className="c-card-title">{icon} {weather.city} {t("today")}</p>

      <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", marginBottom: "0.85rem" }}>
        <span className="weather-temp" style={{ color: tempColor }}>
          {weather.temperature.toFixed(0)}°C
        </span>
        <div>
          <p className="weather-desc">{weather.description}</p>
          <p className="weather-humidity">{t("humidity")}: {weather.humidity}%</p>
        </div>
      </div>

      <div className="weather-tip">
        <p className="weather-tip-label">💡 {t("energySavingTip")}</p>
        <p className="weather-tip-text">{weather.tip}</p>
      </div>
    </div>
  );
}
