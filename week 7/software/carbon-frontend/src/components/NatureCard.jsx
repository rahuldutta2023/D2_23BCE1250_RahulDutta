import { useLang } from "../i18n";
import './components.css';

export default function NatureCard({ data }) {
  const { t } = useLang();
  if (!data) return null;
  const { trees_to_offset, smartphone_hours_saved, excess_kg, saved_kg } = data;

  return (
    <div className="c-card">
      <p className="c-card-title">🌿 {t("natureEquiv")}</p>

      {excess_kg > 0 ? (
        <>
          <div className="nature-tile danger">
            <span className="nature-tile-icon">🌳</span>
            <div className="nature-tile-body">
              <p className="nature-tile-val">{trees_to_offset.toFixed(1)} {t("teakTrees")}</p>
              <p className="nature-tile-desc">
                {t("neededToOffset")} {excess_kg.toFixed(1)} {t("excessThisMonth")}
              </p>
            </div>
          </div>
          <p className="nature-footnote">{t("treeAbsorption")}</p>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div className="nature-tile good">
            <span className="nature-tile-icon">📱</span>
            <div className="nature-tile-body">
              <p className="nature-tile-val">{smartphone_hours_saved.toLocaleString()} {t("hrs")}</p>
              <p className="nature-tile-desc">{t("phoneCharging")}</p>
            </div>
          </div>
          <div className="nature-tile good">
            <span className="nature-tile-icon">🌱</span>
            <div className="nature-tile-body">
              <p className="nature-tile-val">{saved_kg.toFixed(1)} {t("savedKg")}</p>
              <p className="nature-tile-desc">{t("belowCityAvg")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
