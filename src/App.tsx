import { useState, useEffect } from 'react';
import { fetchSCIs, fetchSitesWithSCIs, type SCI, type Site } from './firebase';
import './App.css';

type ViewMode = 'classic' | 'elegant' | 'opus';

function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [scis, setSCIs] = useState<SCI[]>([]);
  const [selectedSCI, setSelectedSCI] = useState<SCI | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('elegant');

  // Load sites on mount
  useEffect(() => {
    fetchSitesWithSCIs()
      .then(sites => {
        setSites(sites);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch sites:', err);
        setLoading(false);
      });
  }, []);

  // Load SCIs when site changes
  useEffect(() => {
    if (selectedSite) {
      setLoading(true);
      fetchSCIs(selectedSite.id)
        .then(scis => {
          setSCIs(scis);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch SCIs:', err);
          setLoading(false);
        });
    }
  }, [selectedSite]);

  const filteredSCIs = scis.filter(sci =>
    sci.section?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !selectedSite) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading SCI Viewer...</p>
      </div>
    );
  }

  // Site Selection View
  if (!selectedSite) {
    return (
      <div className="site-selection">
        <header>
          <h1>SCI Viewer</h1>
          <p>Standard Cleaning Instructions</p>
        </header>
        <div className="sites-grid">
          {sites.map(site => (
            <button
              key={site.id}
              className="site-card"
              onClick={() => setSelectedSite(site)}
            >
              <h2>{site.name}</h2>
              <span className="badge">{site.count} SCIs</span>
            </button>
          ))}
        </div>
        <footer>
          <p>Powered by ACS Content Engine</p>
        </footer>
      </div>
    );
  }

  // Document View
  if (selectedSCI) {
    return (
      <DocumentView
        sci={selectedSCI}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onBack={() => setSelectedSCI(null)}
        siteName={selectedSite.name}
      />
    );
  }

  // List View
  return (
    <div className="list-view">
      <header>
        <button className="back-btn" onClick={() => { setSelectedSite(null); setSCIs([]); }}>
          ← Sites
        </button>
        <h1>{selectedSite.name}</h1>
        <span className="badge">{scis.length} SCIs</span>
      </header>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search cleaning instructions..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : (
        <div className="sci-list">
          {filteredSCIs.map(sci => (
            <button
              key={sci.id}
              className="sci-card"
              onClick={() => setSelectedSCI(sci)}
            >
              <h3>{sci.section?.title}</h3>
              <div className="sci-meta">
                <span>{sci.section?.documentMetadata?.documentId || sci.section?.sectionId}</span>
                <span>{(sci.section?.stepGroups || []).reduce((sum, g) => sum + (g.steps?.length || 0), 0)} steps</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Document View Component
function DocumentView({
  sci,
  viewMode,
  setViewMode,
  onBack,
  siteName
}: {
  sci: SCI;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onBack: () => void;
  siteName: string;
}) {
  const section = sci.section;
  const chemicals = section?.chemicals || [];
  const stepGroups = section?.stepGroups || [];
  const images = section?.images || [];
  const keyInspectionPoints = section?.keyInspectionPoints || [];
  const colourCodes = section?.colourCodes || [];
  const applicationEquipment = section?.applicationEquipment || [];

  const colorHexMap: Record<string, string> = {
    'yellow': '#FCD34D', 'green': '#4ADE80', 'blue': '#60A5FA',
    'red': '#F87171', 'orange': '#FB923C', 'purple': '#C084FC',
    'white': '#F1F5F9', 'black': '#334155', 'pink': '#F472B6',
  };

  return (
    <div className={`document-view ${viewMode}`}>
      <header>
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>{section?.title}</h1>
        <div className="view-modes">
          {(['classic', 'elegant', 'opus'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              className={viewMode === mode ? 'active' : ''}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="document-content">
        {/* Document Header */}
        <div className="doc-header">
          <div className="doc-title">
            <h2>Standard Cleaning Procedures</h2>
            <h3>{siteName}</h3>
          </div>
          <div className="doc-meta">
            <div><strong>Document No:</strong> {section?.documentMetadata?.documentId || section?.sectionId}</div>
            <div><strong>Amendment:</strong> {section?.documentMetadata?.revision || '00'}</div>
            <div><strong>Effective:</strong> {section?.documentMetadata?.effectiveDate || '-'}</div>
          </div>
        </div>

        {/* Equipment Title */}
        <div className="equipment-title">
          <h2>{section?.title}</h2>
          <p>{section?.description || 'Production Areas'}</p>
        </div>

        {/* Main Content */}
        <div className="main-grid">
          {/* Left Column */}
          <div className="left-column">
            {/* Chemicals */}
            {chemicals.length > 0 && (
              <div className="section chemicals">
                <h4>Chemicals</h4>
                <table>
                  <thead>
                    <tr><th>Chemical</th><th>Use Ratio</th></tr>
                  </thead>
                  <tbody>
                    {chemicals.map((c, i) => (
                      <tr key={i}>
                        <td>{c.name}</td>
                        <td>{c.useRatio || c.hotRatio || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Info Fields */}
            <div className="section info-fields">
              <div><strong>Frequency:</strong> {section?.frequency || 'Monthly (Or refer to MCS)'}</div>
              <div><strong>Responsibility:</strong> {section?.responsibility || 'ACS Hygiene Operator'}</div>
            </div>

            {/* Key Inspection Points */}
            {(images.length > 0 || keyInspectionPoints.length > 0) && (
              <div className="section inspection">
                <h4>Key Inspection Points</h4>
                {images.slice(0, 2).map((img, i) => (
                  img.url && <img key={i} src={img.url} alt={img.caption || 'Inspection'} />
                ))}
                {keyInspectionPoints.length > 0 && (
                  <ul>
                    {keyInspectionPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* PPE */}
            <div className="section ppe">
              <h4>PPE Requirements & Safety</h4>
              <div className="ppe-icons">
                <span title="Safety Boots">🥾</span>
                <span title="Apron">🥼</span>
                <span title="Goggles">🥽</span>
                <span title="Gloves">🧤</span>
                <span title="Hair Cover">👒</span>
                <span title="Face Mask">😷</span>
              </div>
              <p className="ppe-note">Ensure correct and complete PPE is worn before any cleaning operation.</p>
            </div>

            {/* Colour Codes */}
            {colourCodes.length > 0 && (
              <div className="section colour-codes">
                <h4>Colour Code</h4>
                <div className="codes-grid">
                  {colourCodes.map((cc, i) => (
                    <span key={i} style={{ color: colorHexMap[cc.colour?.toLowerCase()] || '#333' }}>
                      <strong>{cc.colour}</strong> – {cc.meaning}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Application Equipment */}
            {applicationEquipment.length > 0 && (
              <div className="section equipment">
                <h4>Application Equipment</h4>
                <p>{applicationEquipment.join(', ')}</p>
              </div>
            )}

            {/* Cleaning Instructions */}
            <div className="section instructions">
              <h4>Cleaning Instructions</h4>
              {stepGroups.map((group, gi) => (
                <div key={gi} className="step-group">
                  <h5>{group.title} {group.frequency && `(${group.frequency})`}</h5>
                  <ol>
                    {group.steps?.map((step, si) => (
                      <li key={si}>{step.action}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="doc-footer">
          <div><strong>Issued By:</strong> ACS QA Department</div>
          <div><strong>Approved By:</strong> {siteName}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
