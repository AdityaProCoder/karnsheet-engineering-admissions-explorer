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
      const rankObj = college.ranks && college.ranks[selectedBranch];
      if (rankObj && (rankObj.r3 !== null || rankObj.r4 !== null)) {
        data.push({
          code: college.code,
          name: college.name.split(',')[0],
          city: college.city,
          rankR3: rankObj.r3,
          rankR4: rankObj.r4,
          primaryRank: rankObj.r4 !== null ? rankObj.r4 : rankObj.r3
        });
      }
    });

    // Sort by rank ascending (most competitive first)
    const sorted = data.sort((a, b) => a.primaryRank - b.primaryRank);
    // Take top 10 for visualization to avoid overwhelming
    return sorted.slice(0, 10);
  }, [currentData, selectedBranch]);

  // Max rank in branch comparison (for scaling)
  const maxBranchRank = useMemo(() => {
    if (branchComparisonData.length === 0) return 1;
    return Math.max(...branchComparisonData.map(d => Math.max(d.rankR3 || 0, d.rankR4 || 0)));
  }, [branchComparisonData]);

  // 2. Calculations for College branch spectrum
  const selectedCollegeObj = useMemo(() => {
    return currentData.find(c => c.code === selectedCollegeCode);
  }, [currentData, selectedCollegeCode]);

  const collegeSpectrumData = useMemo(() => {
    if (!selectedCollegeObj || !selectedCollegeObj.ranks) return [];

    const data = [];
    Object.entries(selectedCollegeObj.ranks).forEach(([branch, rankObj]) => {
      if (rankObj && (rankObj.r3 !== null || rankObj.r4 !== null)) {
        data.push({ 
          branch, 
          rankR3: rankObj.r3, 
          rankR4: rankObj.r4,
          primaryRank: rankObj.r4 !== null ? rankObj.r4 : rankObj.r3
        });
      }
    });

    // Sort by rank ascending
    return data.sort((a, b) => a.primaryRank - b.primaryRank);
  }, [selectedCollegeObj]);

  // Max rank in college spectrum (for scaling)
  const maxCollegeRank = useMemo(() => {
    if (collegeSpectrumData.length === 0) return 1;
    return Math.max(...collegeSpectrumData.map(d => Math.max(d.rankR3 || 0, d.rankR4 || 0)));
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
                {/* Visual Color Legend */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', fontSize: '11px', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'linear-gradient(90deg, var(--accent-emerald) 0%, var(--accent-emerald-heavy) 100%)', borderRadius: '2px' }}></div>
                    <span>Round 3 Cutoff</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'linear-gradient(90deg, var(--accent-sky) 0%, var(--accent-sky-heavy) 100%)', borderRadius: '2px' }}></div>
                    <span>Round 4 Cutoff</span>
                  </div>
                </div>

                {branchComparisonData.map((item, index) => {
                  const pctR3 = item.rankR3 ? Math.max(10, Math.min(100, (item.rankR3 / maxBranchRank) * 100)) : 0;
                  const pctR4 = item.rankR4 ? Math.max(10, Math.min(100, (item.rankR4 / maxBranchRank) * 100)) : 0;
                  
                  return (
                    <div key={item.code} className="chart-bar-item" style={{ marginBottom: '16px' }}>
                      <div className="chart-item-header" style={{ marginBottom: '6px' }}>
                        <span className="chart-college-name" title={item.name} style={{ fontWeight: 700 }}>
                          {index + 1}. {item.name} ({item.city})
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Code: {item.code}
                        </span>
                      </div>
                      
                      {/* Round 3 Bar */}
                      {item.rankR3 ? (
                        <div className="chart-bar-track" style={{ marginBottom: '4px' }}>
                          <div 
                            className="chart-bar-fill-left" 
                            style={{ 
                              width: `${pctR3}%`,
                              background: `linear-gradient(90deg, var(--accent-emerald) 0%, var(--accent-emerald-heavy) 100%)`
                            }}
                          >
                            R3: {item.rankR3.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', paddingLeft: '8px' }}>R3: Not Available / Cutoff Closed</div>
                      )}

                      {/* Round 4 Bar */}
                      {item.rankR4 ? (
                        <div className="chart-bar-track">
                          <div 
                            className="chart-bar-fill-left" 
                            style={{ 
                              width: `${pctR4}%`,
                              background: `linear-gradient(90deg, var(--accent-sky) 0%, var(--accent-sky-heavy) 100%)`
                            }}
                          >
                            R4: {item.rankR4.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', paddingLeft: '8px' }}>R4: Not Available / Cutoff Closed</div>
                      )}
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
                {/* Visual Color Legend */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', fontSize: '11px', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'linear-gradient(90deg, var(--accent-emerald) 0%, var(--accent-emerald-heavy) 100%)', borderRadius: '2px' }}></div>
                    <span>Round 3 Cutoff</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'linear-gradient(90deg, var(--accent-sky) 0%, var(--accent-sky-heavy) 100%)', borderRadius: '2px' }}></div>
                    <span>Round 4 Cutoff</span>
                  </div>
                </div>

                {collegeSpectrumData.map((item, index) => {
                  const pctR3 = item.rankR3 ? Math.max(10, Math.min(100, (item.rankR3 / maxCollegeRank) * 100)) : 0;
                  const pctR4 = item.rankR4 ? Math.max(10, Math.min(100, (item.rankR4 / maxCollegeRank) * 100)) : 0;
                  
                  return (
                    <div key={item.branch} className="chart-bar-item" style={{ marginBottom: '16px' }}>
                      <div className="chart-item-header" style={{ marginBottom: '6px' }}>
                        <span className="chart-college-name" style={{ fontSize: '11.5px', color: 'var(--text-primary)', fontWeight: 700 }}>
                          {item.branch}
                        </span>
                      </div>
                      
                      {/* Round 3 Bar */}
                      {item.rankR3 ? (
                        <div className="chart-bar-track" style={{ marginBottom: '4px' }}>
                          <div 
                            className="chart-bar-fill-left" 
                            style={{ 
                              width: `${pctR3}%`,
                              background: `linear-gradient(90deg, var(--accent-emerald) 0%, var(--accent-emerald-heavy) 100%)`
                            }}
                          >
                            R3: {item.rankR3.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', paddingLeft: '8px' }}>R3: Not Available / Cutoff Closed</div>
                      )}

                      {/* Round 4 Bar */}
                      {item.rankR4 ? (
                        <div className="chart-bar-track">
                          <div 
                            className="chart-bar-fill-left" 
                            style={{ 
                              width: `${pctR4}%`,
                              background: `linear-gradient(90deg, var(--accent-sky) 0%, var(--accent-sky-heavy) 100%)`
                            }}
                          >
                            R4: {item.rankR4.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', paddingLeft: '8px' }}>R4: Not Available / Cutoff Closed</div>
                      )}
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
