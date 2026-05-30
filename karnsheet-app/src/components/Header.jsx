import React from 'react';
import { Sun, Moon, Database, GraduationCap, Sparkles } from 'lucide-react';

export default function Header({ theme, toggleTheme, currentData }) {
  // Dynamic stats calculation
  const totalColleges = currentData.length;
  
  // Calculate total distinct course disciplines
  const disciplinesSet = new Set();
  let topClosingRank = Infinity;

  currentData.forEach(college => {
    if (college.ranks) {
      Object.entries(college.ranks).forEach(([branch, rankObj]) => {
        disciplinesSet.add(branch);
        if (rankObj) {
          const r3 = rankObj.r3;
          const r4 = rankObj.r4;
          const minRank = [r3, r4].filter(x => x !== null && x !== undefined && !isNaN(x) && x > 0);
          if (minRank.length > 0) {
            const minVal = Math.min(...minRank);
            if (minVal < topClosingRank) {
              topClosingRank = minVal;
            }
          }
        }
      });
    }
  });

  const totalDisciplines = disciplinesSet.size;
  const displayTopRank = topClosingRank === Infinity ? 0 : topClosingRank;

  return (
    <header className="header-glass">
      <div className="header-wrapper">
        <div className="logo-section">
          <div className="logo-badge">
            <GraduationCap size={28} />
          </div>
          <div className="logo-text">
            <h1>KarnSheet 2026</h1>
            <p>COMEDK Round 3 Cutoff Decision Portal</p>
          </div>
        </div>

        <div className="metrics-panel">
          <div className="metric-item">
            <div className="metric-label">Colleges</div>
            <div className="metric-value">{totalColleges}</div>
          </div>
          <div className="vertical-divider"></div>
          <div className="metric-item">
            <div className="metric-label">Disciplines</div>
            <div className="metric-value">{totalDisciplines}</div>
          </div>
          <div className="vertical-divider"></div>
          <div className="metric-item">
            <div className="metric-label">Top GM Rank</div>
            <div className="metric-value">
              {displayTopRank.toLocaleString()}
            </div>
          </div>
        </div>

        <button 
          onClick={toggleTheme} 
          className="btn btn-secondary"
          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} style={{ color: 'var(--accent-amber)' }} />
              <span style={{ fontSize: '11px', fontWeight: 600 }}>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={16} style={{ color: 'var(--accent-sky)' }} />
              <span style={{ fontSize: '11px', fontWeight: 600 }}>Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
