import React from 'react';
import Papa from 'papaparse';
import { ListChecks, ArrowUp, ArrowDown, Trash2, Download, AlertCircle, Info } from 'lucide-react';

export default function PreferenceList({ 
  savedPreferences, 
  onPreferenceMove, 
  onPreferenceDelete,
  onClearAll 
}) {
  
  // Handle CSV Export via PapaParse
  const handleExportCSV = () => {
    if (savedPreferences.length === 0) return;

    const formattedData = savedPreferences.map((pref, idx) => ({
      "Preference Number": idx + 1,
      "College Code": pref.code,
      "College Name": pref.name,
      "Branch": pref.branch,
      "Closing Cutoff Rank": pref.cutoff
    }));

    const csvContent = Papa.unparse(formattedData);
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "karnsheet_comedk_counseling_preferences_2026.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card">
      <div className="panel-title" style={{ justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ListChecks size={20} style={{ color: 'var(--accent-emerald)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Preference List & Choice Entry Builder</h2>
        </div>

        {savedPreferences.length > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--accent-rose-heavy)' }} 
              onClick={onClearAll}
            >
              Clear All Choices
            </button>
            <button 
              className="btn btn-primary" 
              style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', gap: '6px' }}
              onClick={handleExportCSV}
            >
              <Download size={12} />
              <span>Export to CSV</span>
            </button>
          </div>
        )}
      </div>

      <div className="pref-instructions">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Info size={20} style={{ color: 'var(--accent-emerald-heavy)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Choice Reordering Protocol</strong>: The COMEDK counseling software evaluates seat allocations in strict top-down sequential order. Place your highest-priority dream colleges at the top. Use the Up/Down swap controls to tweak your strategy.
          </div>
        </div>
      </div>

      {savedPreferences.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <ListChecks size={64} style={{ color: 'var(--text-muted)', strokeWidth: 1 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Your Preference List is Empty</h3>
          <p style={{ maxWidth: '450px', fontSize: '12.5px' }}>
            You haven't saved any counseling choices yet. Go to the <strong>Spreadsheet Grid</strong> or <strong>Admissions Forecast</strong> tabs and click the <strong>Save to Preference List</strong> buttons on colleges that interest you!
          </p>
        </div>
      ) : (
        <div className="pref-list-container">
          {savedPreferences.map((pref, index) => (
            <div key={`${pref.code}-${pref.branch}`} className="pref-item">
              
              {/* Order Index Badge */}
              <div className="pref-rank-badge">
                {index + 1}
              </div>

              {/* Main Content */}
              <div className="pref-body">
                <div className="pref-college">
                  {pref.name.split(',')[0]}
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '8px' }}>
                    Code: {pref.code}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="pref-branch">{pref.branch}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>|</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Cutoff: <strong style={{ color: 'var(--text-primary)' }}>{pref.cutoff.toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="pref-controls">
                {/* Reordering Controls */}
                <button 
                  className="pref-swap-btn" 
                  disabled={index === 0}
                  onClick={() => onPreferenceMove(index, index - 1)}
                  title="Move Preference Up"
                >
                  <ArrowUp size={12} />
                </button>
                <button 
                  className="pref-swap-btn" 
                  disabled={index === savedPreferences.length - 1}
                  onClick={() => onPreferenceMove(index, index + 1)}
                  title="Move Preference Down"
                >
                  <ArrowDown size={12} />
                </button>

                <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>

                {/* Delete option */}
                <button 
                  className="pref-delete-btn" 
                  onClick={() => onPreferenceDelete(index)}
                  title="Remove from choices"
                >
                  <Trash2 size={14} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
