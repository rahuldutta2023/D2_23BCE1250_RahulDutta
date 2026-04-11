import './components.css';

export default function NatureCard({ data }) {
  if (!data) return null;
  const { trees_to_offset, smartphone_hours_saved, excess_kg, saved_kg } = data;

  return (
    <div className="c-card">
      <p className="c-card-title">🌿 Nature Equivalents</p>

      {excess_kg > 0 ? (
        <>
          <div className="nature-tile danger">
            <span className="nature-tile-icon">🌳</span>
            <div>
              <p className="nature-tile-val">{trees_to_offset} Teak Trees</p>
              <p className="nature-tile-desc">
                needed to offset your {excess_kg} kg CO₂ excess this month
              </p>
            </div>
          </div>
          <p className="nature-footnote">One mature teak tree absorbs ~1.83 kg CO₂/month</p>
        </>
      ) : (
        <>
          <div className="nature-tile good">
            <span className="nature-tile-icon">📱</span>
            <div>
              <p className="nature-tile-val">{smartphone_hours_saved.toLocaleString()} hrs</p>
              <p className="nature-tile-desc">smartphone charging equivalent — energy you saved!</p>
            </div>
          </div>
          <div className="nature-tile good" style={{ marginTop: "0.45rem" }}>
            <span className="nature-tile-icon">🌱</span>
            <div>
              <p className="nature-tile-val">{saved_kg} kg saved</p>
              <p className="nature-tile-desc">below city average this month</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
