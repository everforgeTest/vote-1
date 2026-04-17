const nacl = require('tweetnacl');
const env = require('../Utils/env');
const { UpgradeService } = require('../Services/Common.Services/Upgrade.Service');

function isMaintainer(userPubKeyHex) {
  const expected = (env.MAINTAINER_PUBKEY || '').toLowerCase();
  if (!expected || expected.length === 0) return false;
  if (!userPubKeyHex) return false;
  return userPubKeyHex.toLowerCase() === expected;
}

class UpgradeController {
  constructor(message, userPubKey) {
    this.message = message;
    this.userPubKey = userPubKey;
    this.service = new UpgradeService(message);
  }

  async handleRequest() {
    try {
      const act = this.message.Action || this.message.action;
      if (act !== 'UpgradeContract') return { error: { message: 'Invalid action.' } };

      if (!isMaintainer(this.userPubKey)) {
        return { error: { code: 401, message: 'Unauthorized' } };
      }

      const data = this.message.data || {};
      const zipBase64 = data.zipBase64;
      const sigHex = data.zipSignatureHex;
      const version = data.version;
      const description = data.description || '';

      if (!zipBase64 || !sigHex || !version) {
        return { error: { code: 400, message: 'Missing fields: zipBase64, zipSignatureHex, version are required.' } };
      }

      const zipBuffer = Buffer.from(zipBase64, 'base64');
      const signature = Buffer.from(sigHex, 'hex');
      const pubKey = Buffer.from(this.userPubKey, 'hex');

      const verified = nacl.sign.detached.verify(new Uint8Array(zipBuffer), new Uint8Array(signature), new Uint8Array(pubKey));
      if (!verified) {
        return { error: { code: 401, message: 'Invalid signature' } };
      }

      this.message.data = { contentBuffer: zipBuffer, version, description };
      const res = await this.service.upgradeContract();
      return res;
    } catch (e) {
      return { error: { code: 500, message: e.message || 'Upgrade failed.' } };
    }
  }
}

module.exports = { UpgradeController };
