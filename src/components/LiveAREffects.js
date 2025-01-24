import React, { useState } from 'react';
import './LiveAREffects.css';

const LiveAREffects = () => {
  const [effects, setEffects] = useState({
    hud: false,
    weather: false,
    time: false,
  });

  const toggleEffect = (effectName) => {
    setEffects((prevEffects) => ({
      ...prevEffects,
      [effectName]: !prevEffects[effectName],
    }));
  };

  return (
    <div className="live-ar-effects-container">
      <h3 className="ar-title">Live AR Effects</h3>
      <div className="effects-menu">
        {Object.keys(effects).map((effect) => (
          <button
            key={effect}
            className={`effect-button ${effects[effect] ? 'active' : ''}`}
            onClick={() => toggleEffect(effect)}
          >
            {effects[effect] ? `Disable ${effect}` : `Enable ${effect}`}
          </button>
        ))}
      </div>

      {/* AR Effects Visualization */}
      <div className="ar-visualization">
        {effects.hud && <div className="ar-overlay hud">HUD Active</div>}
        {effects.weather && <div className="ar-overlay weather">Weather Overlay</div>}
        {effects.time && <div className="ar-overlay time">Time Display</div>}
      </div>
    </div>
  );
};

export default LiveAREffects;
