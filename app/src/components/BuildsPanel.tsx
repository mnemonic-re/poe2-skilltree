import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { serializeBuild, deserializeBuild, type BuildStateInfo } from "../lib/buildSerializer";
import type { Tag } from "../lib/buildState";

interface SavedBuild {
  id: string;
  name: string;
  version: "0.4" | "0.5";
  stateString: string;
  className: string;
  points: number;
}

interface Props {
  version: "0.4" | "0.5";
  setVersion: (v: "0.4" | "0.5") => void;
  build: {
    selectedClass: number | null;
    selectedAsc: string | null;
    mode: Tag;
    alloc: Map<string, Tag>;
    ascAlloc: Set<string>;
    baseBudget: number;
  };
  classes: Array<{ name: string }>;
  onLoadBuild: (v: "0.4" | "0.5", build: BuildStateInfo) => void;
}

function BuildsPanel({ version, setVersion, build, classes, onLoadBuild }: Props) {
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const [buildName, setBuildName] = useState("");
  const [importCode, setImportCode] = useState("");
  const [shareFeedback, setShareFeedback] = useState(false);
  const [importError, setImportError] = useState("");

  // Load builds from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("poe2_saved_builds");
      if (stored) {
        setSavedBuilds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved builds from localStorage", e);
    }
  }, []);

  // Save builds to localStorage
  const saveToStorage = (builds: SavedBuild[]) => {
    try {
      localStorage.setItem("poe2_saved_builds", JSON.stringify(builds));
      setSavedBuilds(builds);
    } catch (e) {
      console.error("Failed to save builds to localStorage", e);
    }
  };

  // Get active class name
  const activeClassName =
    build.selectedClass !== null && classes[build.selectedClass]
      ? classes[build.selectedClass].name
      : "No Class";

  const totalPoints = build.alloc.size + build.ascAlloc.size;

  const handleSaveBuild = () => {
    const name = buildName.trim() || `Build ${activeClassName} (${version})`;
    const stateString = serializeBuild(version, build);
    
    const newBuild: SavedBuild = {
      id: Date.now().toString(),
      name,
      version,
      stateString,
      className: activeClassName,
      points: totalPoints,
    };

    // Check if a build with same name exists, overwrite if so, otherwise append
    const existingIndex = savedBuilds.findIndex((b) => b.name.toLowerCase() === name.toLowerCase() && b.version === version);
    let updatedBuilds;
    if (existingIndex > -1) {
      updatedBuilds = [...savedBuilds];
      updatedBuilds[existingIndex] = {
        ...updatedBuilds[existingIndex],
        stateString,
        className: activeClassName,
        points: totalPoints,
      };
    } else {
      updatedBuilds = [newBuild, ...savedBuilds];
    }

    saveToStorage(updatedBuilds);
    setBuildName("");
  };

  const handleDeleteBuild = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedBuilds.filter((b) => b.id !== id);
    saveToStorage(updated);
  };

  const handleLoadBuild = (saved: SavedBuild) => {
    const deserialized = deserializeBuild(saved.stateString);
    if (deserialized) {
      onLoadBuild(deserialized.version, deserialized.build);
    }
  };

  const handleCopyShare = () => {
    const code = serializeBuild(version, build);
    if (!code) return;
    const url = `${window.location.origin}${window.location.pathname}#build=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    });
  };

  const handleImport = () => {
    setImportError("");
    let codeToImport = importCode.trim();
    if (!codeToImport) return;

    // Check if they pasted a full URL
    if (codeToImport.includes("#build=")) {
      const parts = codeToImport.split("#build=");
      codeToImport = parts[parts.length - 1];
    } else if (codeToImport.includes("#build-")) {
      const parts = codeToImport.split("#build-");
      codeToImport = parts[parts.length - 1];
    } else if (codeToImport.includes("?build=")) {
      const parts = codeToImport.split("?build=");
      codeToImport = parts[parts.length - 1];
    }

    const deserialized = deserializeBuild(codeToImport);
    if (deserialized) {
      onLoadBuild(deserialized.version, deserialized.build);
      setImportCode("");
    } else {
      setImportError("Invalid build link or code.");
    }
  };

  return (
    <motion.div
      className="panel builds-panel"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="panel__title">Build Manager</div>

      {/* Share / Export */}
      <div className="builds-section">
        <button className="btn-primary" onClick={handleCopyShare}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {shareFeedback ? "Copied Link!" : "Share Build"}
        </button>
      </div>

      {/* Save Build Form */}
      <div className="builds-section save-form">
        <input
          type="text"
          placeholder={`Name current build...`}
          value={buildName}
          onChange={(e) => setBuildName(e.target.value)}
          maxLength={30}
        />
        <button onClick={handleSaveBuild} disabled={build.selectedClass === null}>
          Save
        </button>
      </div>

      {/* List of Saved Builds */}
      <div className="builds-list-container">
        <div className="builds-subtitle">Saved Builds ({savedBuilds.length})</div>
        {savedBuilds.length === 0 ? (
          <div className="builds-empty">No builds saved yet.</div>
        ) : (
          <div className="builds-list">
            {savedBuilds.map((b) => (
              <div key={b.id} className="builds-row" onClick={() => handleLoadBuild(b)}>
                <div className="builds-row__info">
                  <div className="builds-row__name">{b.name}</div>
                  <div className="builds-row__meta">
                    <span className="builds-row__version">v{b.version}</span>
                    <span className="builds-row__class">{b.className}</span>
                    <span className="builds-row__points">{b.points} pts</span>
                  </div>
                </div>
                <button className="builds-row__delete" onClick={(e) => handleDeleteBuild(b.id, e)} title="Delete build">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Build */}
      <div className="builds-section import-form">
        <div className="builds-subtitle" style={{ marginTop: 0 }}>Import Build</div>
        <div className="import-row">
          <input
            type="text"
            placeholder="Paste code or URL..."
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
          />
          <button onClick={handleImport}>Import</button>
        </div>
        {importError && <div className="import-error">{importError}</div>}
      </div>
    </motion.div>
  );
}

export default memo(BuildsPanel);
