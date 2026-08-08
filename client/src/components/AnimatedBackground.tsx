import React from "react";
import "./AnimatedBackground.css";

const AnimatedBackground: React.FC = () => {
  return (
    <div className="app-animated-bg" aria-hidden="true">
      <div className="app-bg-grid" />
      <div className="app-bg-orb app-bg-orb-1" />
      <div className="app-bg-orb app-bg-orb-2" />
      <div className="app-bg-orb app-bg-orb-3" />
      <div className="app-bg-orb app-bg-orb-4" />
      <div className="app-bg-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="app-particle" />
        ))}
      </div>
    </div>
  );
};

export default AnimatedBackground;
