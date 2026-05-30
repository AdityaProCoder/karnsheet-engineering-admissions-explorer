import React, { useState, useMemo } from 'react';
import { Search, Compass, Plus, Check, ShieldAlert, Sparkles, Filter, Award, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

export default function Predictor({ currentData, onAddPreference, savedPreferences }) {
  const [rankInput, setRankInput] = useState('');
  const [submittedRank, setSubmittedRank] = useState(null);
  const [selectedCities, setSelectedCities] = useState(() => {
    const uniqueCities = new Set();
    currentData.forEach(c => {
      if (c.city) uniqueCities.add(c.city);
    });
    return Array.from(uniqueCities).sort();
  });
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [branchCategory, setBranchCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('rank-asc'); // rank-asc, rank-desc, chance-safe-first
  const [predictRound, setPredictRound] = useState('r4'); // 'r4' | 'r3' | 'best'

  // Dynamic Cities List
  const cities = useMemo(() => {
    const uniqueCities = new Set();
    currentData.forEach(c => {
      if (c.city) uniqueCities.add(c.city);
    });
    return Array.from(uniqueCities).sort();
  }, [currentData]);

  // Handle Predict Button
  const handlePredict = (e) => {
    e.preventDefault();
    const rankVal = parseInt(rankInput, 10);
    if (!isNaN(rankVal) && rankVal > 0) {
      setSubmittedRank(rankVal);
    }
  };

  // Helper to categorize chance
  const getChance = (userRank, cutoff) => {
    if (!cutoff) return null;
    if (userRank <= 0.9 * cutoff) {
      return { type: 'safe', label: 'Safe Bet', pct: 95 };
    } else if (userRank <= cutoff) {
      return { type: 'target', label: 'Realistic Target', pct: 75 };
    } else if (userRank <= 1.1 * cutoff) {
      return { type: 'dream', label: 'Ambitious Dream', pct: 35 };
    }
    return null; // Unlikely
  };

  // Filter and compute matches
  const predictionResults = useMemo(() => {
    if (submittedRank === null) return [];

    const matches = [];

    currentData.forEach(college => {
      // Filter by city (multi-select: active checked cities)
      if (!selectedCities.includes(college.city)) return;

      if (college.ranks) {
        Object.entries(college.ranks).forEach(([branch, cutoffObj]) => {
          if (!cutoffObj) return;

          // Determine active cutoff based on selected predictRound
          let activeCutoff = null;
          if (predictRound === 'r3') {
            activeCutoff = cutoffObj.r3;
          } else if (predictRound === 'r4') {
            activeCutoff = cutoffObj.r4;
          } else if (predictRound === 'best') {
            const r3Val = cutoffObj.r3 || 0;
            const r4Val = cutoffObj.r4 || 0;
            activeCutoff = Math.max(r3Val, r4Val);
            if (activeCutoff === 0) activeCutoff = null;
          }

          if (activeCutoff === null) return;

          // Filter by branch category
          if (branchCategory !== 'All') {
            const code = branch.split(' - ')[0];
            const isCsIt = ['CS', 'IS', 'AI', 'CD', 'CY', 'AD', 'CI', 'IC', 'CB', 'CE', 'CG'].includes(code) || branch.toLowerCase().includes('computer') || branch.toLowerCase().includes('artificial') || branch.toLowerCase().includes('information') || branch.toLowerCase().includes('data');
            const isEce = ['EC', 'EI', 'ET', 'VL', 'VLS', 'ECV', 'EE'].includes(code) || branch.toLowerCase().includes('electronics') || branch.toLowerCase().includes('telecommunic') || branch.toLowerCase().includes('instrumentation') || branch.toLowerCase().includes('vlsi');
            const isCore = ['ME', 'CV', 'CH', 'BT', 'MT', 'AE', 'AS', 'AU'].includes(code) || branch.toLowerCase().includes('mechanical') || branch.toLowerCase().includes('civil') || branch.toLowerCase().includes('chemical') || branch.toLowerCase().includes('bio') || branch.toLowerCase().includes('mechatronics') || branch.toLowerCase().includes('aeronautical') || branch.toLowerCase().includes('aerospace');

            if (branchCategory === 'cs_it' && !isCsIt) return;
            if (branchCategory === 'ece' && !isEce) return;
            if (branchCategory === 'core' && !isCore) return;
          }

          const chance = getChance(submittedRank, activeCutoff);
          if (chance) {
            matches.push({
              code: college.code,
              name: college.name,
              city: college.city,
              category: college.category,
              branch,
              cutoff: activeCutoff,
              cutoffR3: cutoffObj.r3,
              cutoffR4: cutoffObj.r4,
              chance
            });
          }
        });
      }
    });

    // Sort matches
    return matches.sort((a, b) => {
      if (sortOrder === 'rank-asc') {
        return a.cutoff - b.cutoff;
      } else if (sortOrder === 'rank-desc') {
        return b.cutoff - a.cutoff;
      } else if (sortOrder === 'chance-safe-first') {
        const priority = { safe: 1, target: 2, dream: 3 };
        return priority[a.chance.type] - priority[b.chance.type] || a.cutoff - b.cutoff;
      }
      return 0;
    });
  }, [currentData, submittedRank, selectedCities, branchCategory, sortOrder]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const counts = { safe: 0, target: 0, dream: 0 };
    predictionResults.forEach(item => {
      counts[item.chance.type]++;
    });
    return counts;
  }, [predictionResults]);

  const isSeatSaved = (collegeCode, branch) => {
    return savedPreferences.some(pref => pref.code === collegeCode && pref.branch === branch);
  };

  return (
    <div className="predictor-grid">
      
      {/* LEFT PANEL: Filters and Rank Input */}
      <div className="glass-card" style={{ height: 'fit-content', overflow: 'visible', zIndex: 100 }}>
        <div className="panel-title">
          <Compass size={20} style={{ color: 'var(--accent-emerald)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Rank Predictor</h2>
        </div>

        <form onSubmit={handlePredict}>
          <div className="form-group">
            <label className="form-label" htmlFor="rank-input">Enter COMEDK GM Rank</label>
            <input 
              id="rank-input"
              type="number" 
              className="form-input" 
              placeholder="e.g. 15000"
              value={rankInput}
              onChange={(e) => setRankInput(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Preferred City Location</label>
            <div className="multiselect-container" style={{ position: 'relative', overflow: 'visible', zIndex: 110 }}>
              {/* Overlay background to close the dropdown on click outside */}
              {isCityDropdownOpen && (
                <div 
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 45,
                    background: 'transparent'
                  }} 
                  onClick={() => setIsCityDropdownOpen(false)}
                />
              )}
              
              <button 
                type="button"
                className="multiselect-trigger"
                onClick={() => {
                  setIsCityDropdownOpen(!isCityDropdownOpen);
                  if (isCityDropdownOpen) {
                    setCitySearchQuery('');
                  }
                }}
                aria-haspopup="true"
                aria-expanded={isCityDropdownOpen}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <MapPin size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                  {selectedCities.length === cities.length 
                    ? 'All Cities Selected' 
                    : selectedCities.length === 0 
                    ? 'No Cities Selected (Choose below)' 
                    : `${selectedCities.length} Selected: ${selectedCities.join(', ')}`
                  }
                </span>
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                  {isCityDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>
              
              {isCityDropdownOpen && (
                <div className="multiselect-dropdown">
                  <div className="multiselect-header">
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {selectedCities.length === cities.length ? 'Showing all cities' : `${selectedCities.length} active filter(s)`}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        className="multiselect-action-btn"
                        onClick={() => setSelectedCities(cities)}
                      >
                        Select All
                      </button>
                      {selectedCities.length > 0 && (
                        <button 
                          type="button" 
                          className="multiselect-action-btn clear"
                          onClick={() => setSelectedCities([])}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Search input field inside dropdown */}
                  <div style={{ padding: '0 2px 8px 2px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        placeholder="Search city name..." 
                        style={{
                          width: '100%',
                          padding: '6px 10px 6px 28px',
                          fontSize: '12px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                        value={citySearchQuery}
                        onChange={(e) => setCitySearchQuery(e.target.value)}
                      />
                      <Search size={12} style={{ position: 'absolute', left: '8px', top: '9px', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                  
                  <div className="multiselect-options-list">
                    {cities
                      .filter(c => c.toLowerCase().includes(citySearchQuery.toLowerCase()))
                      .map(c => {
                        const isChecked = selectedCities.includes(c);
                        return (
                          <label key={c} className="multiselect-option">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedCities(selectedCities.filter(x => x !== c));
                                } else {
                                  setSelectedCities([...selectedCities, c]);
                                }
                              }}
                            />
                            <span>{c}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Branch Stream Specialization</label>
            <select 
              className="select-field" 
              style={{ width: '100%', padding: '10px' }}
              value={branchCategory}
              onChange={(e) => setBranchCategory(e.target.value)}
            >
              <option value="All">All Streams & Branches</option>
              <option value="cs_it">CS, IT & Computing Allied</option>
              <option value="ece">ECE, EE & Electronics Allied</option>
              <option value="core">Mechanical, Civil & Core Allied</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Predict Against Cutoff Round</label>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', gap: '2px' }}>
              <button 
                type="button"
                className={`btn ${predictRound === 'r4' ? 'btn-active-emerald' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: 'var(--radius-sm)', border: 'none' }}
                onClick={() => setPredictRound('r4')}
              >
                Round 4 (Latest)
              </button>
              <button 
                type="button"
                className={`btn ${predictRound === 'r3' ? 'btn-active-emerald' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: 'var(--radius-sm)', border: 'none' }}
                onClick={() => setPredictRound('r3')}
              >
                Round 3
              </button>
              <button 
                type="button"
                className={`btn ${predictRound === 'best' ? 'btn-active-emerald' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: 'var(--radius-sm)', border: 'none' }}
                onClick={() => setPredictRound('best')}
                title="Predicts using the better (higher) cutoff rank from either Round 3 or 4"
              >
                Best Case
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '8px' }}>
            <Sparkles size={16} />
            <span>Generate Admissions Forecast</span>
          </button>
        </form>
      </div>

      {/* RIGHT PANEL: Prediction Forecast and Recommendation Cards */}
      <div className="glass-card">
        {submittedRank === null ? (
          <div className="predictor-empty">
            <Compass size={64} style={{ color: 'var(--text-muted)', strokeWidth: 1 }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Awaiting Admissions Rank
            </h3>
            <p style={{ maxWidth: '400px', fontSize: '13px' }}>
              Input your COMEDK General Merit (GM) rank in the left panel to discover target colleges, probability spectra, and customized preferences.
            </p>
          </div>
        ) : (
          <div className="outcome-dashboard">
            
            {/* Aggregate Stats Cards */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Forecast Overview for Rank {submittedRank.toLocaleString()}
              </h3>
              
              <div className="outcomes-grid">
                <div className="outcome-card safe">
                  <span className="outcome-card-label safe">Safe Bet</span>
                  <span className="outcome-card-value safe">{stats.safe}</span>
                  <span style={{ fontSize: '9px', display: 'block', color: 'var(--accent-emerald-heavy)', fontWeight: 600, marginTop: '2px' }}>
                    Rank ≤ 90% cutoff
                  </span>
                </div>
                
                <div className="outcome-card target">
                  <span className="outcome-card-label target">Realistic Target</span>
                  <span className="outcome-card-value target">{stats.target}</span>
                  <span style={{ fontSize: '9px', display: 'block', color: 'var(--accent-amber-heavy)', fontWeight: 600, marginTop: '2px' }}>
                    Rank ≤ 100% cutoff
                  </span>
                </div>
                
                <div className="outcome-card dream">
                  <span className="outcome-card-label dream">Ambitious Dream</span>
                  <span className="outcome-card-value dream">{stats.dream}</span>
                  <span style={{ fontSize: '9px', display: 'block', color: 'var(--accent-rose-heavy)', fontWeight: 600, marginTop: '2px' }}>
                    Rank ≤ 110% cutoff
                  </span>
                </div>
              </div>
            </div>

            {/* List Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Showing {predictionResults.length} Eligible Seats
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Sort:</span>
                <select 
                  className="select-field"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="rank-asc">Cutoff Rank (Low to High)</option>
                  <option value="rank-desc">Cutoff Rank (High to Low)</option>
                  <option value="chance-safe-first">Safe Bets First</option>
                </select>
              </div>
            </div>

            {/* Recommendations List */}
            <div className="recommendations-wrapper">
              {predictionResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={36} />
                  <span style={{ fontWeight: 600 }}>No Eligible Seats Found</span>
                  <span style={{ fontSize: '11px' }}>Try increasing rank bounds, changing the branch stream, or clearing city filters.</span>
                </div>
              ) : (
                predictionResults.map((item, index) => {
                  const saved = isSeatSaved(item.code, item.branch);
                  return (
                    <div key={`${item.code}-${item.branch}`} className={`match-card ${item.chance.type}`}>
                      <div className="match-details">
                        <div className="match-meta-badges">
                          <span className="meta-badge-city">{item.city}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Code: {item.code}</span>
                        </div>
                        <h4 className="match-college-title">{item.name.split(',')[0]}</h4>
                        <div className="match-branch-subtitle">{item.branch}</div>
                        <div className="match-cutoff-label" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                          <span>R3 Cutoff: <strong style={{ color: 'var(--text-primary)' }}>{item.cutoffR3 !== null ? item.cutoffR3.toLocaleString() : '-'}</strong></span>
                          <span style={{ color: 'var(--text-muted)' }}>|</span>
                          <span>R4 Cutoff: <strong style={{ color: 'var(--text-primary)' }}>{item.cutoffR4 !== null ? item.cutoffR4.toLocaleString() : '-'}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span className={`chance-pill ${item.chance.type}`}>{item.chance.label}</span>
                        <button
                          className={`btn ${saved ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', gap: '4px' }}
                          onClick={() => onAddPreference(item.name, item.code, item.branch, item.cutoffR3, item.cutoffR4)}
                          disabled={saved}
                        >
                          {saved ? (
                            <>
                              <Check size={12} />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus size={12} />
                              <span>Add Option</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
