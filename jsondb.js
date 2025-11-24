const fs = require('fs');
const path = require('path');

class JsonDB {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.saveInterval = options.saveInterval || 5000; // 5 seconds default
    this.timer = null;
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Load existing data
    this.data = this.load();
    
    // Setup periodic save
    this.startAutoSave();
    
    // Save on exit
    this.setupExitHandlers();
  }
  
  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        const content = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(content);
      } catch (e) {
        console.error(`Error loading ${this.filePath}:`, e.message);
        return {};
      }
    }
    return {};
  }
  
  save() {
    try {
      const tmpPath = this.filePath + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2));
      fs.renameSync(tmpPath, this.filePath);
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
    this.save();
  }
  
  // Close DB and cleanup
  close() {
    this.stopAutoSave();
    this.save();
  }
}

module.exports = JsonDB;
