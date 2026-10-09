const fs = require('fs');
const path = require('path');

class JsonDB {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.backupPath = filePath + '.bak';
    this.saveInterval = options.saveInterval || 5000; // 5 seconds default
    this.timer = null;
    this._hasLoadedData = false;
    
    // Ensure directory exists
    this.dir = path.dirname(filePath);
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
    
    // Load existing data
    this.data = this.load();
    
    // Setup periodic save
    this.startAutoSave();
    
    // Save on exit
    this.setupExitHandlers();
  }
  
  /**
   * Try to parse a JSON file, returning null on failure.
   */
  _tryLoadFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content || !content.trim()) return null;
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }
  
  load() {
    // Try primary file first
    const primary = this._tryLoadFile(this.filePath);
    if (primary !== null) {
      this._hasLoadedData = true;
      return primary;
    }
    
    // Primary is missing or corrupted — try backup
    const backup = this._tryLoadFile(this.backupPath);
    if (backup !== null) {
      console.warn(`Primary DB corrupted or missing, restored from backup: ${this.backupPath}`);
      this._hasLoadedData = true;
      return backup;
    }
    
    // Neither file exists or both are corrupted
    if (fs.existsSync(this.filePath) || fs.existsSync(this.backupPath)) {
      // Files exist but are unreadable — don't silently return empty
      console.error(
        `CRITICAL: Both ${this.filePath} and ${this.backupPath} are corrupted. ` +
        `Refusing to overwrite — inspect and recover manually. Starting with empty data (auto-save disabled until first explicit flush or save).`
      );
      this._hasLoadedData = false;
      return {};
    }
    
    // Fresh start — no files existed at all
    this._hasLoadedData = true;
    return {};
  }
  
  /**
   * Sync a file descriptor to ensure data reaches physical disk.
   */
  _fsyncFile(filePath) {
    const fd = fs.openSync(filePath, 'r');
    try {
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  }
  
  /**
   * Sync the directory to make rename/link operations durable.
   */
  _fsyncDir() {
    try {
      const fd = fs.openSync(this.dir, 'r');
      try {
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
    } catch (e) {
      // Some platforms don't support fsync on directories — best effort
    }
  }
  
  save() {
    // Guard: don't overwrite existing data with empty object if load failed
    if (!this._hasLoadedData && Object.keys(this.data).length === 0) {
      return;
    }
    
    try {
      const tmpPath = this.filePath + '.tmp';
      const json = JSON.stringify(this.data, null, 2);
      
      // Write to temp file and fsync to ensure data reaches disk
      fs.writeFileSync(tmpPath, json);
      this._fsyncFile(tmpPath);
      
      // Rotate current file to backup before replacing
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupPath);
        this._fsyncFile(this.backupPath);
      }
      
      // Atomic rename
      fs.renameSync(tmpPath, this.filePath);
      
      // Sync directory to make the rename durable
      this._fsyncDir();
    } catch (e) {
      console.error(`Error saving ${this.filePath}:`, e.message);
    }
  }
  
  startAutoSave() {
    this.timer = setInterval(() => {
      this.save();
    }, this.saveInterval);
  }
  
  stopAutoSave() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  setupExitHandlers() {
    const cleanup = () => {
      this.stopAutoSave();
      this.save();
    };
    
    process.on('exit', cleanup);
    process.on('SIGINT', () => {
      cleanup();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      cleanup();
      process.exit(0);
    });
  }
  
  // Force immediate save
  flush() {
    this._hasLoadedData = true;
    this.save();
  }
  
  // Close DB and cleanup
  close() {
    this.stopAutoSave();
    this.save();
  }
}

module.exports = JsonDB;
