import React, { useState, useMemo } from 'react';
import { BarChart3, School, Layers, Info } from 'lucide-react';

export default function Visualizer({ currentData }) {
  const [activeSubTab, setActiveSubTab] = useState('branch'); // 'branch' or 'college'
  
  // Dynamic Branches List
  const allBranches = useMemo(() => {
    const branchSet = new Set();
    currentData.forEach(c => {
      if (c.ranks) {
        Object.keys(c.ranks).forEach(b => branchSet.add(b));
      }
    });
    return Array.from(branchSet).sort();
  }, [currentData]);

  // Default selected values
  const [selectedBranch, setSelectedBranch] = useState(allBranches[0] || '');
  const [selectedCollegeCode, setSelectedCollegeCode] = useState(currentData[0]?.code || '');

  // 1. Calculations for Branch comparison
  const branchComparisonData = useMemo(() => {
    if (!selectedBranch) return [];

    const data = [];
    currentData.forEach(college => {
      const rank = college.ranks && college.ranks[selectedBranch];
      if (rank) {
        data.push({
          code: college.code,
          name: college.name.split(',')[0],
          city: college.city,
          rank
        });
      }
    });

    // Sort by rank ascending (most competitive first)
    const sorted = data.sort((a, b) => a.rank - b.rank);
    // Take top 10 for visualization to avoid overwhelming
    return sorted.slice(0, 10);
  }, [currentData, selectedBranch]);

  // Max rank in branch comparison (for scaling)
  const maxBranchRank = useMemo(() => {
    if (branchComparisonData.length === 0) return 1;
    return Math.max(...branchComparisonData.map(d => d.rank));
  }, [branchComparisonData]);

  // 2. Calculations for College branch spectrum
  const selectedCollegeObj = useMemo(() => {
    return currentData.find(c => c.code === selectedCollegeCode);
  }, [currentData, selectedCollegeCode]);

  const collegeSpectrumData = useMemo(() => {
    if (!selectedCollegeObj || !selectedCollegeObj.ranks) return [];

    const data = [];
    Object.entries(selectedCollegeObj.ranks).forEach(([branch, rank]) => {
      if (rank) {
        data.push({ branch, rank });
      }
    });

    // Sort by rank ascending
    return data.sort((a, b) => a.rank - b.rank);
  }, [selectedCollegeObj]);

  // Max rank in college spectrum (for scaling)
  const maxCollegeRank = useMemo(() => {
    if (collegeSpectrumData.length === 0) return 1;
    return Math.max(...collegeSpectrumData.map(d => d.rank));
  }, [collegeSpectrumData]);

  return (
    <div className="glass-card">
      <div className="panel-title">
        <BarChart3 size={20} style={{ color: 'var(--accent-emerald)' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Data Visualizer & Analytics Charts</h2>
      </div>

      {/* Sub tabs selector */}
      <div className="tabs-container" style={{ marginBottom: '24px' }}>
        <button 
          className={`tab-btn ${activeSubTab === 'branch' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('branch')}
        >
          <Layers size={14} />
          <span>Branch Cutoff Ranks (Across Colleges)</span>
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'college' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('college')}
        >
          <School size={14} />
          <span>College Cutoff Range (Across Branches)</span>
        </button>
      </div>

      {/* BRANCH COMPARISON PANEL */}
      {activeSubTab === 'branch' && (
        <div className="visualizer-grid">
          <div>
            <p className="chart-description">
              Select a branch to compare closing ranks across the top 10 most competitive colleges offering that seat. Lower ranks indicate higher popularity and tighter competition.
            </p>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Choose Engineering Branch</label>
              <select 
                className="select-field"
                style={{ width: '100%', padding: '10px' }}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {allBranches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: '12px', border: '1px solid var(--border-color)' }}>
              <Info size={16} style={{ color: 'var(--accent-sky)' }} />
              <div>
                <strong>Aesthetic Heatmap Index</strong>: Ranks below 10,000 show dense demand. Ranks above 60,000 represent higher closing gates.
              </div>
            </div>
          </div>

          <div>
            {branchComparisonData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No college offers this branch in the current dataset or all values are empty.
              </div>
            ) : (
              <div className="chart-bars-list">
                {branchComparisonData.map((item, index) => {
                  // Width represents rank. Since lower is better, we can split it or just display rank bar
                  const pct = Math.max(10, Math.min(100, (item.rank / maxBranchRank) * 100));
                  
                  return (
                    <div key={item.code} className="chart-bar-item">
                      <div className="chart-item-header">
                        <span className="chart-college-name" title={item.name}>
                          {index + 1}. {item.name} ({item.city})
                        </span>
                        <span className="chart-badge-ease" style={{
                          background: item.rank < 10000 ? 'var(--accent-emerald-light)' : 'var(--accent-sky-light)',
                          color: item.rank < 10000 ? 'var(--accent-emerald-heavy)' : 'var(--accent-sky-heavy)'
                        }}>
                          Rank: {item.rank.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="chart-bar-track">
                        <div 
                          className="chart-bar-fill-left" 
                          style={{ 
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, var(--accent-emerald) 0%, var(--accent-emerald-heavy) 100%)`
                          }}
                        >
                          {item.rank.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COLLEGE SPECTRUM PANEL */}
      {activeSubTab === 'college' && (
        <div className="visualizer-grid">
          <div>
            <p className="chart-description">
              Select a college to view the cutoff range of all branch seats offered inside it. You can see which branches are highly valued (left) versus easier to enter (right).
            </p>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Choose College</label>
              <select 
                className="select-field"
                style={{ width: '100%', padding: '10px' }}
                value={selectedCollegeCode}
                onChange={(e) => setSelectedCollegeCode(e.target.value)}
              >
                {currentData.map(c => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name.split(',')[0]}</option>
                ))}
              </select>
            </div>

            {selectedCollegeObj && (
              <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>{selectedCollegeObj.name}</h4>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <div>City Location: <strong style={{ color: 'var(--text-primary)' }}>{selectedCollegeObj.city}</strong></div>
                  <div>Counseling Category: <strong>{selectedCollegeObj.category}</strong></div>
                  <div style={{ marginTop: '4px' }}>Total Seats Monitored: <strong style={{ color: 'var(--accent-emerald)' }}>{collegeSpectrumData.length}</strong></div>
                </div>
              </div>
            )}
          </div>

          <div>
            {collegeSpectrumData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No active branches listed for this college.
              </div>
            ) : (
              <div className="chart-bars-list">
                {collegeSpectrumData.map((item, index) => {
                  const pct = Math.max(10, Math.min(100, (item.rank / maxCollegeRank) * 100));
                  return (
                    <div key={item.branch} className="chart-bar-item">
                      <div className="chart-item-header">
                        <span className="chart-college-name" style={{ fontSize: '11.5px', color: 'var(--text-primary)' }}>
                          {item.branch}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {item.rank.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="chart-spectrum-track">
                        <div 
                          className="chart-spectrum-fill" 
                          style={{ 
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, var(--accent-sky) 0%, var(--accent-sky-heavy) 100%)`
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
