const fs = require('fs');
const settings = require('../../settings.json').settings;
const { SqliteDatabase } = require('./dbHandler');
const { Tables } = require('../../Constants/Tables');

class UpgradeService {
  constructor(message) {
    this.message = message;
    this.db = new SqliteDatabase(settings.dbPath);
  }

  async upgradeContract() {
    const resObj = {};
    try {
      const zipBuffer = this.message.data.contentBuffer;
      const incomingVersion = parseFloat(this.message.data.version);
      const description = this.message.data.description || '';

      if (!Number.isFinite(incomingVersion)) {
        return { error: { code: 400, message: 'Invalid version.' } };
      }

      this.db.open();
      let row = await this.db.getLastRecord(Tables.CONTRACTVERSION);
      const currentVersion = row ? parseFloat(row.Version) : 1.0;
      if (!(incomingVersion > currentVersion)) {
        return { error: { code: 403, message: 'Contract version must be greater than current version.' } };
      }

      fs.writeFileSync(settings.newContractZipFileName, zipBuffer);

      const shellScriptContent = `#!/bin/bash\
\
! command -v unzip &>/dev/null && apt-get update && apt-get install --no-install-recommends -y unzip\
\
zip_file=\"${settings.newContractZipFileName}\"\
\
unzip -o -d ./ \"$zip_file\" >>/dev/null\
\
rm \"$zip_file\" >>/dev/null\
`;
      fs.writeFileSync(settings.postExecutionScriptName, shellScriptContent);
      fs.chmodSync(settings.postExecutionScriptName, 0o777);

      await this.db.insertValue(Tables.CONTRACTVERSION, {
        Version: incomingVersion,
        Description: description
      });

      resObj.success = { message: 'Contract upgraded', version: incomingVersion };
      return resObj;
    } catch (e) {
      return { error: { code: 500, message: e.message || 'Failed to upgrade contract.' } };
    } finally {
      this.db.close();
    }
  }
}

module.exports = { UpgradeService };
