import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Spreadsheet from './components/Spreadsheet';
import Predictor from './components/Predictor';
import Visualizer from './components/Visualizer';
import PreferenceList from './components/PreferenceList';
import { Grid3X3, Compass, BarChart3, ListChecks, CheckCircle2, X } from 'lucide-react';
import './App.css';

// Import cutoff baseline data
import cutoffData from './data/cutoff.json';

export default function App() {
  // 1. Theme state (synced with localStorage)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('karnsheet-theme');
    if (saved) return saved;
    return 'light'; // Default to light mode
  });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('karnsheet-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 2. Mutable Cutoff Data state (deep cloned from cutoff.json)
  const [currentData, setCurrentData] = useState(() => {
    const savedData = localStorage.getItem('karnsheet-data-v2');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.length > 0 && parsed[0].ranks) {
          const firstRank = Object.values(parsed[0].ranks)[0];
          if (firstRank && typeof firstRank === 'object' && ('r3' in firstRank || 'r4' in firstRank)) {
            return parsed;
          }
        }
      } catch (e) {
        console.error("Error reading saved data state, reverting to baseline", e);
      }
    }
    return JSON.parse(JSON.stringify(cutoffData));
  });

  // Sync current data to localStorage when changed
  useEffect(() => {
    localStorage.setItem('karnsheet-data-v2', JSON.stringify(currentData));
  }, [currentData]);

  // 3. Saved Preference Counseling List state (synced with localStorage)
  const [savedPreferences, setSavedPreferences] = useState(() => {
    const saved = localStorage.getItem('karnsheet-preferences-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === 0) return [];
        if ('cutoffR3' in parsed[0] || 'cutoffR4' in parsed[0]) {
          return parsed;
        }
      } catch (e) {
        console.error("Error reading saved preferences", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('karnsheet-preferences-v2', JSON.stringify(savedPreferences));
  }, [savedPreferences]);

  // 4. Tab Navigation State
  const [activeTab, setActiveTab] = useState('sheet'); // sheet, predictor, visualizer, saved

  // 5. Tactical Modal Notification State
  const [modalState, setModalState] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const showNotification = (message, type = 'success') => {
    setModalState({ show: true, message, type });
    // Auto close after 2.5 seconds
    setTimeout(() => {
      setModalState(prev => ({ ...prev, show: false }));
    }, 2500);
  };

  // Handler: Edit cell cutoff value
  const handleCellEdit = (collegeCode, branchName, roundType, newValue) => {
    setCurrentData(prevData => {
      return prevData.map(college => {
        if (college.code === collegeCode) {
          const currentRankObj = college.ranks[branchName] || { r3: null, r4: null };
          const updatedRanks = { 
            ...college.ranks, 
            [branchName]: {
              ...currentRankObj,
              [roundType]: newValue
            }
          };
          return { ...college, ranks: updatedRanks };
        }
        return college;
      });
    });
  };

  // Handler: Move row indices (Weightage reordering)
  const handleRowMove = (fromIndex, toIndex) => {
    if (fromIndex < 0 || fromIndex >= currentData.length || toIndex < 0 || toIndex >= currentData.length) return;
    
    setCurrentData(prevData => {
      const copy = [...prevData];
      const temp = copy[fromIndex];
      copy[fromIndex] = copy[toIndex];
      copy[toIndex] = temp;
      return copy;
    });
  };

  // Handler: Add to saved counseling choices
  const handleAddPreference = (collegeName, collegeCode, branchName, cutoffR3, cutoffR4) => {
    // Check duplication
    const duplicate = savedPreferences.some(pref => pref.code === collegeCode && pref.branch === branchName);
    if (duplicate) {
      showNotification("Option already included in your preference list!", "error");
      return;
    }

    const newPref = {
      name: collegeName,
      code: collegeCode,
      branch: branchName,
      cutoffR3: cutoffR3,
      cutoffR4: cutoffR4
    };

    setSavedPreferences(prev => [...prev, newPref]);
    showNotification(`Added ${branchName.split(' - ')[0]} at ${collegeName.split(',')[0]} successfully!`);
  };

  // Handler: Reorder preferences
  const handlePreferenceMove = (fromIndex, toIndex) => {
    if (fromIndex < 0 || fromIndex >= savedPreferences.length || toIndex < 0 || toIndex >= savedPreferences.length) return;
    
    setSavedPreferences(prev => {
      const copy = [...prev];
      const temp = copy[fromIndex];
      copy[fromIndex] = copy[toIndex];
      copy[toIndex] = temp;
      return copy;
    });
  };

  // Handler: Delete preference
  const handlePreferenceDelete = (index) => {
    const deletedItem = savedPreferences[index];
    setSavedPreferences(prev => prev.filter((_, idx) => idx !== index));
    showNotification(`Removed ${deletedItem.branch.split(' - ')[0]} option.`, 'success');
  };

  // Handler: Clear all choice entry entries
  const handleClearAllPreferences = () => {
    if (window.confirm("Are you sure you want to clear your entire preference list? This action cannot be undone.")) {
      setSavedPreferences([]);
      showNotification("Successfully cleared all counseling preferences.");
    }
  };

  // Handler: Revert customized ranks to COMEDK original baseline values
  const handleResetData = () => {
    if (window.confirm("This will revert all customized ranks in your grid back to the original Round 3 & 4 COMEDK cutoff baseline values. Continue?")) {
      setCurrentData(JSON.parse(JSON.stringify(cutoffData)));
      showNotification("Data reset to official Round 3 & 4 cutoffs baseline!");
    }
  };

  return (
    <div className="app-container">
      {/* Dynamic Animated Liquid Glass Blobs */}
      <div className="liquid-blob blob-1"></div>
      <div className="liquid-blob blob-2"></div>
      <div className="liquid-blob blob-3"></div>
      
      {/* Brand Header & Quick Metrics */}
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        currentData={currentData} 
      />

      {/* Main Container */}
      <main className="main-content">
        
        {/* Premium Project Guide & Instructions Banner */}
        <div className="glass-card" style={{ padding: '24px 30px', borderLeft: '6px solid var(--accent-emerald)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge-tag badge-tag-gov" style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald-heavy)', fontWeight: 800 }}>COMEDK Round 3 & 4 GM Cutoffs</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Verified counseling database & planner tools</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Release v1.0.2</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '32px' }}>
            <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                About KarnSheet 2026
              </h2>
              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                KarnSheet is a premium, interactive decision portal built for engineering candidates. It houses the verified Round 3 & Round 4 closing ranks for COMEDK General Merit (GM) admissions. Rather than struggling with massive, static PDFs, KarnSheet lets you model custom rank adjustments, forecast dynamic admissions eligibility, and construct a priority-based sequencing list ready to submit.
              </p>
            </div>
            <div style={{ flex: '1.5 1 450px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                How to Use the Portal
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald-heavy)', fontWeight: 800, borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>1</div>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    <strong>Spreadsheet Grid</strong>: Explore all colleges and branches. **Double-click any rank cell** or use the Formula Bar to input custom scenarios to test hypotheticals.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--accent-sky-light)', color: 'var(--accent-sky-heavy)', fontWeight: 800, borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>2</div>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    <strong>Admissions Forecast</strong>: Enter your target rank to immediately compute and categorize matching seats into **Safe**, **Realistic Target**, and **Ambitious Dream** lists.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--accent-amber-light)', color: 'var(--accent-amber-heavy)', fontWeight: 800, borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>3</div>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    <strong>Choice Entry Builder</strong>: Add choices to build your custom counseling sequence. Reorder your priorities, refine the sequence, and export the list as a portal-ready CSV!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Toolbar */}
        <div className="navigation-bar">
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'sheet' ? 'active' : ''}`}
              onClick={() => setActiveTab('sheet')}
            >
              <Grid3X3 size={16} />
              <span>Spreadsheet Grid</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'predictor' ? 'active' : ''}`}
              onClick={() => setActiveTab('predictor')}
            >
              <Compass size={16} />
              <span>Admissions Forecast</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'visualizer' ? 'active' : ''}`}
              onClick={() => setActiveTab('visualizer')}
            >
              <BarChart3 size={16} />
              <span>Data Visualizer</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <ListChecks size={16} />
              <span>Choice Entry Builder ({savedPreferences.length})</span>
            </button>
          </div>
          
          <div className="toolbar-container" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <span>Round 3 & 4 COMEDK General Merit (GM) Ranks</span>
          </div>
        </div>

        {/* Tab Content Wrappers (Kept mounted in DOM to preserve all local filters, inputs, and predicted results when switching tabs) */}
        <div style={{ display: activeTab === 'sheet' ? 'block' : 'none' }}>
          <Spreadsheet 
            currentData={currentData} 
            originalData={cutoffData}
            onCellEdit={handleCellEdit}
            onRowMove={handleRowMove}
            onAddPreference={handleAddPreference}
            savedPreferences={savedPreferences}
            resetData={handleResetData}
          />
        </div>

        <div style={{ display: activeTab === 'predictor' ? 'block' : 'none' }}>
          <Predictor 
            currentData={currentData}
            onAddPreference={handleAddPreference}
            savedPreferences={savedPreferences}
          />
        </div>

        <div style={{ display: activeTab === 'visualizer' ? 'block' : 'none' }}>
          <Visualizer 
            currentData={currentData}
          />
        </div>

        <div style={{ display: activeTab === 'saved' ? 'block' : 'none' }}>
          <PreferenceList 
            savedPreferences={savedPreferences}
            onPreferenceMove={handlePreferenceMove}
            onPreferenceDelete={handlePreferenceDelete}
            onClearAll={handleClearAllPreferences}
          />
        </div>

      </main>

      {/* Modal/Toast success overlay notification */}
      {modalState.show && (
        <div className="modal-overlay" onClick={() => setModalState(prev => ({ ...prev, show: false }))}>
          <div className="modal-card" style={{ maxWidth: '340px', padding: '20px' }}>
            <div className={modalState.type === 'success' ? 'modal-icon-success' : 'modal-icon-error'}>
              <CheckCircle2 size={36} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginTop: '8px' }}>
              {modalState.message}
            </p>
          </div>
        </div>
      )}

      {/* App Footer */}
      <footer className="app-footer">
        <p className="footer-bold">KarnSheet 2026</p>
        <p>Verified Round 3 & 4 COMEDK Admissions Cutoff & Interactive Counseling Decision Matrix.</p>
        <p style={{ fontSize: '9.5px', marginTop: '6px', color: 'var(--text-muted)' }}>
          Powered by React 18+ & Vite. Clean custom styles, no third-party tracking, fully local calculations.
        </p>
      </footer>

    </div>
  );
}
