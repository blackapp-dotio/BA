import React, { useState } from 'react';
import AIAnalytics from './AIAnalytics';
import ARCircle from './ARCircle';
import './CircleSection.css'; // Styling for My Circle section

const CircleSection = ({ analytics, circleData }) => {
  const [mode, setMode] = useState('AI'); // Default mode: AI Insights

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'AI' ? 'AR' : 'AI'));
  };

  return (
    <div className="circle-section">
      <div className="circle-header">
        <h3>Your Circle</h3>
        <button onClick={toggleMode}>
          Switch to {mode === 'AI' ? 'AR Visualization' : 'AI Insights'}
        </button>
      </div>
      <div className={`circle-content ${mode === 'AI' ? 'ai-layout' : 'ar-layout'}`}>
        {mode === 'AI' ? (
          <AIAnalytics analytics={analytics} />
        ) : (
          <ARCircle circleData={circleData} />
        )}
      </div>
    </div>
  );
};

export default CircleSection;
