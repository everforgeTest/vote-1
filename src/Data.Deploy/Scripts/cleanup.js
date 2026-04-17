const fs = require('fs');
const settings = require('../../settings.json').settings;
//from git
(function cleanup() {
  try {
    if (fs.existsSync(settings.dbPath)) {
      fs.unlinkSync(settings.dbPath);
      console.log('Removed database file:', settings.dbPath);
    }
  } catch (e) {
    console.error('Cleanup error:', e.message);
  }
})();
