import React, { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowUp, ArrowDown, Plus, HelpCircle, Check, RotateCcw, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

export default function Spreadsheet({ 
  currentData, 
  originalData,
  onCellEdit, 
  onRowMove, 
  onAddPreference, 
  savedPreferences,
  resetData 
}) {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCities, setSelectedCities] = useState(() => {
    const uniqueCities = new Set();
    currentData.forEach(c => {
      if (c.city) uniqueCities.add(c.city);
    });
    return Array.from(uniqueCities).sort();
  });
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  
  // Spreadsheet Selection State
  const [selectedCell, setSelectedCell] = useState(null); // { collegeCode, branch }
  const [editingCell, setEditingCell] = useState(null); // { collegeCode, branch }
  const [editValue, setEditValue] = useState('');
  const [formulaValue, setFormulaValue] = useState('');

  // Column Visibility Panel State
  const [showColFilter, setShowColFilter] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({});

  // Dynamic Cities List
  const cities = useMemo(() => {
    const uniqueCities = new Set();
    currentData.forEach(c => {
      if (c.city) uniqueCities.add(c.city);
    });
    return Array.from(uniqueCities).sort();
  }, [currentData]);

  // Dynamic Branches List (all unique branches sorted alphabetically)
  const allBranches = useMemo(() => {
    const branchSet = new Set();
    currentData.forEach(c => {
      if (c.ranks) {
        Object.keys(c.ranks).forEach(b => branchSet.add(b));
      }
    });
    return Array.from(branchSet).sort();
  }, [currentData]);

  // Initial column visibility setup
  useEffect(() => {
    if (allBranches.length > 0 && Object.keys(columnVisibility).length === 0) {
      // By default, make top branches visible (e.g. CS, IS, AI, CD, CY) or first 10 branches to avoid horizontal bloat
      const initialVis = {};
      allBranches.forEach((b, index) => {
        // Show top CS and EC branches by default, hide others initially to keep view clean, but allow user to toggle
        const isCommonBranch = b.startsWith('CS') || b.startsWith('IS') || b.startsWith('EC') || b.startsWith('AI') || b.startsWith('AD');
        initialVis[b] = isCommonBranch || index < 6;
      });
      setColumnVisibility(initialVis);
    }
  }, [allBranches]);

  // Handle Preset Selections
  const applyPreset = (presetType) => {
    const updated = { ...columnVisibility };
    allBranches.forEach(b => {
      if (presetType === 'all') {
        updated[b] = true;
      } else if (presetType === 'none') {
        updated[b] = false;
      } else if (presetType === 'cs_it') {
        // CS, IS, AI, CD, CY, AD, CI, IC etc.
        const code = b.split(' - ')[0];
        const isCsIt = ['CS', 'IS', 'AI', 'CD', 'CY', 'AD', 'CI', 'IC', 'CB', 'CE', 'CG'].some(p => code === p || b.toLowerCase().includes('computer') || b.toLowerCase().includes('artificial') || b.toLowerCase().includes('information') || b.toLowerCase().includes('data'));
        updated[b] = isCsIt;
      } else if (presetType === 'ece_allied') {
        // EC, EI, ET, VL, VLS, ECV
        const code = b.split(' - ')[0];
        const isEce = ['EC', 'EI', 'ET', 'VL', 'VLS', 'ECV', 'EE'].some(p => code === p || b.toLowerCase().includes('electronics') || b.toLowerCase().includes('telecommunic') || b.toLowerCase().includes('instrumentation') || b.toLowerCase().includes('vlsi'));
        updated[b] = isEce;
      } else if (presetType === 'core') {
        // ME, CV, CH, BT, MT
        const code = b.split(' - ')[0];
        const isCore = ['ME', 'CV', 'CH', 'BT', 'MT', 'AE', 'AS', 'AU'].some(p => code === p || b.toLowerCase().includes('mechanical') || b.toLowerCase().includes('civil') || b.toLowerCase().includes('chemical') || b.toLowerCase().includes('bio') || b.toLowerCase().includes('mechatronics') || b.toLowerCase().includes('aeronautical') || b.toLowerCase().includes('aerospace'));
        updated[b] = isCore;
      }
    });
    setColumnVisibility(updated);
  };

  // Find college details by code
  const selectedCollegeObj = useMemo(() => {
    if (!selectedCell) return null;
    return currentData.find(c => c.code === selectedCell.collegeCode);
  }, [selectedCell, currentData]);

  // Synchronize Formula values when selection changes
  useEffect(() => {
    if (selectedCell && selectedCollegeObj) {
      const val = selectedCollegeObj.ranks[selectedCell.branch] || '';
      setFormulaValue(val);
      setEditValue(val);
    } else {
      setFormulaValue('');
      setEditValue('');
    }
  }, [selectedCell, selectedCollegeObj]);

  // Handle cell click selection
  const handleCellClick = (collegeCode, branch) => {
    setSelectedCell({ collegeCode, branch });
    setEditingCell(null);
  };

  // Handle cell double click editing
  const handleCellDoubleClick = (collegeCode, branch) => {
    setSelectedCell({ collegeCode, branch });
    setEditingCell({ collegeCode, branch });
    const college = currentData.find(c => c.code === collegeCode);
    const val = college ? college.ranks[branch] || '' : '';
    setEditValue(val);
  };

  // Save inline cell edit
  const saveInlineEdit = () => {
    if (editingCell) {
      const numVal = editValue === '' ? null : parseInt(editValue, 10);
      if (numVal === null || !isNaN(numVal)) {
        onCellEdit(editingCell.collegeCode, editingCell.branch, numVal);
      }
      setEditingCell(null);
    }
  };

  // Save formula bar edit
  const saveFormulaEdit = (val) => {
    setFormulaValue(val);
    if (selectedCell) {
      const numVal = val === '' ? null : parseInt(val, 10);
      if (numVal === null || !isNaN(numVal)) {
        onCellEdit(selectedCell.collegeCode, selectedCell.branch, numVal);
      }
    }
  };

  // Filter colleges based on Search and City array
  const filteredColleges = useMemo(() => {
    return currentData.map((c, index) => ({ ...c, originalIndex: index }))
      .filter(college => {
        const matchesSearch = 
          college.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          college.code.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCity = selectedCities.includes(college.city);
        
        return matchesSearch && matchesCity;
      });
  }, [currentData, searchTerm, selectedCities]);

  // Check if a preference is already saved
  const isSeatSaved = (collegeCode, branch) => {
    return savedPreferences.some(pref => pref.code === collegeCode && pref.branch === branch);
  };

  // Render Visible Columns list
  const visibleBranches = allBranches.filter(b => columnVisibility[b]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. Global Filter Dashboard */}
      <div className="glass-card" style={{ overflow: 'visible', zIndex: 100 }}>
        <div className="grid-filter-toolbar">
          <div className="filters-group">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search College Name or Code..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="multiselect-container" style={{ width: '240px', position: 'relative', overflow: 'visible', zIndex: 110 }}>
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
                style={{ padding: '8px 12px', fontSize: '13px' }}
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
                <div className="multiselect-dropdown" style={{ top: '100%', left: 0, right: 0 }}>
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
                          <label key={c} className="multiselect-option" style={{ padding: '6px 8px' }}>
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

          <div className="toolbar-container">
            <button 
              className={`btn btn-secondary ${showColFilter ? 'btn-active-emerald' : ''}`}
              onClick={() => setShowColFilter(!showColFilter)}
            >
              <SlidersHorizontal size={14} />
              <span>Course Filter ({visibleBranches.length}/{allBranches.length})</span>
            </button>
            <button 
              className="btn btn-secondary"
              onClick={resetData}
              title="Revert all customized ranks to COMEDK original baseline values"
            >
              <RotateCcw size={14} />
              <span>Reset Baseline Data</span>
            </button>
          </div>
        </div>

        {/* 2. Column Visibility Checklist panel */}
        {showColFilter && (
          <div className="column-filter-panel" style={{ marginTop: '16px' }}>
            <div className="column-panel-header">
              <h4 style={{ fontSize: '13px', fontWeight: 700 }}>Toggle Course Columns</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => applyPreset('all')}>All</button>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => applyPreset('none')}>Clear</button>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => applyPreset('cs_it')}>CS / Computing</button>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => applyPreset('ece_allied')}>ECE / Electrical</button>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => applyPreset('core')}>Core Allied</button>
              </div>
            </div>
            
            <div className="column-checkbox-grid">
              {allBranches.map(branch => {
                const parts = branch.split(' - ');
                const code = parts[0];
                const name = parts[1] || parts[0];
                return (
                  <label key={branch} className="checkbox-label">
                    <input 
                      type="checkbox" 
                      className="checkbox-input"
                      checked={!!columnVisibility[branch]} 
                      onChange={(e) => setColumnVisibility({
                        ...columnVisibility,
                        [branch]: e.target.checked
                      })}
                    />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '12px' }} title={branch}>
                      {name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Formula Bar */}
      <div className="formula-bar">
        <div className="formula-label">Formula Bar</div>
        <div className="formula-coord">
          {selectedCell ? `${selectedCell.branch.split(' - ')[0]} : ${selectedCell.collegeCode}` : 'None'}
        </div>
        <div className="formula-fx">fx</div>
        <input 
          type="text" 
          className="formula-input"
          placeholder={selectedCell ? "Enter cutoff rank value..." : "Select any cell in the table to display and edit its value"}
          disabled={!selectedCell}
          value={formulaValue}
          onChange={(e) => saveFormulaEdit(e.target.value)}
        />
        
        {/* Save seat to preference list button */}
        {selectedCell && selectedCollegeObj && selectedCollegeObj.ranks[selectedCell.branch] && (
          <button 
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', gap: '4px' }}
            onClick={() => {
              const rank = selectedCollegeObj.ranks[selectedCell.branch];
              onAddPreference(selectedCollegeObj.name, selectedCell.collegeCode, selectedCell.branch, rank);
            }}
            disabled={isSeatSaved(selectedCell.collegeCode, selectedCell.branch)}
          >
            {isSeatSaved(selectedCell.collegeCode, selectedCell.branch) ? (
              <>
                <Check size={12} />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Plus size={12} />
                <span>Save to Preference List</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 4. Spreadsheet View Table */}
      <div className="spreadsheet-wrapper">
        <div className="spreadsheet-scroll">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                {/* Index Column */}
                <th className="spreadsheet-th spreadsheet-th-sticky" style={{ minWidth: '60px', left: 0, zIndex: 30, textAlign: 'center' }}>
                  #
                </th>
                
                {/* College Info Columns */}
                <th className="spreadsheet-th" style={{ minWidth: '100px', left: '60px', position: 'sticky', zIndex: 25, borderRight: '2px solid var(--border-heavy)' }}>
                  Code
                </th>
                <th className="spreadsheet-th" style={{ minWidth: '350px' }}>
                  College Name & Location
                </th>
                
                {/* Visible Branch Columns */}
                {visibleBranches.map(branch => (
                  <th key={branch} className="spreadsheet-th" style={{ minWidth: '120px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800 }}>{branch.split(' - ')[0]}</div>
                    <div style={{ fontSize: '8px', fontWeight: 500, textTransform: 'none', color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {branch.split(' - ')[1] || ''}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {filteredColleges.length === 0 ? (
                <tr>
                  <td colSpan={visibleBranches.length + 3} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No colleges match your search criteria. Try removing search text or changing the city filter.
                  </td>
                </tr>
              ) : (
                filteredColleges.map((college, displayIndex) => {
                  const actualIndex = college.originalIndex;
                  return (
                    <tr key={college.code} className="spreadsheet-tr">
                      {/* Static Row Index Column */}
                      <td className="spreadsheet-td spreadsheet-td-sticky" style={{ left: 0, textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {actualIndex + 1}
                      </td>
                      
                      {/* College Code */}
                      <td className="spreadsheet-td" style={{ fontWeight: 800, color: 'var(--accent-emerald-heavy)', left: '60px', position: 'sticky', background: 'var(--bg-secondary)', borderRight: '2px solid var(--border-heavy)', zIndex: 7 }}>
                        {college.code}
                      </td>
                      
                      {/* College Name & City */}
                      <td className="spreadsheet-td" style={{ whiteSpace: 'normal', minWidth: '350px' }}>
                        <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                          {college.name.split(',')[0]}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <span>{college.city}</span>
                          <span>•</span>
                          <span style={{ fontWeight: 600 }}>{college.category}</span>
                        </div>
                      </td>
                      
                      {/* Visible Branch Cells */}
                      {visibleBranches.map(branch => {
                        const rankVal = college.ranks[branch];
                        const isSelected = selectedCell && selectedCell.collegeCode === college.code && selectedCell.branch === branch;
                        const isEditing = editingCell && editingCell.collegeCode === college.code && editingCell.branch === branch;
                        
                        // Heatmap cell styling based on rank thresholds (Green is highly competitive, lighter/faded is easier)
                        let heatStyle = {};
                        if (rankVal) {
                          if (rankVal < 10000) {
                            heatStyle = { backgroundColor: 'rgba(5, 150, 105, 0.12)', color: 'var(--accent-emerald-heavy)' };
                          } else if (rankVal < 30000) {
                            heatStyle = { backgroundColor: 'rgba(2, 132, 199, 0.08)', color: 'var(--accent-sky-heavy)' };
                          } else if (rankVal < 60000) {
                            heatStyle = { backgroundColor: 'rgba(217, 119, 6, 0.06)', color: 'var(--accent-amber-heavy)' };
                          } else {
                            heatStyle = { backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' };
                          }
                        }

                        return (
                          <td 
                            key={branch}
                            onClick={() => handleCellClick(college.code, branch)}
                            onDoubleClick={() => handleCellDoubleClick(college.code, branch)}
                            className={`spreadsheet-td spreadsheet-td-number heatmap-cell ${isSelected ? 'selected' : ''}`}
                            style={heatStyle}
                          >
                            {isEditing ? (
                              <input 
                                type="number"
                                className="cell-inline-input"
                                value={editValue}
                                autoFocus
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                              />
                            ) : (
                              rankVal ? rankVal.toLocaleString() : '-'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', padding: '0 8px' }}>
        <HelpCircle size={14} />
        <span>Double-click any rank cell to edit inline. Ranks are GM cutoff scores. Select any cell and click "Save to Preference List" to build your counseling priority list.</span>
      </div>
    </div>
  );
}
