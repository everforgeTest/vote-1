const fs = require('fs');
//git
//ev
function loadEnv() {
  const env = {};
  try {
    const res = fs.readFileSync('.env', 'utf8');
    res.split(/\
?\
/).forEach((line) => {
      if (!line || /^\s*#/.test(line)) return;
      const idx = line.indexOf('=');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (!key) return;
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        env[key] = val.slice(1, -1);
      } else {
        env[key] = val;
      }
    });
  } catch (e) {
    // no .env file; ignore
  }
  return env;
}

module.exports = loadEnv();
