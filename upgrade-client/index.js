const fs = require('fs');
const libsodium = require('libsodium-wrappers');
const ContractService = require('./contract-service');

// Usage:
// node index.js <contractUrl> <zipFilePath> <privateKeyHex> <version> <description>

(async () => {
  const contractUrl = process.argv[2];
  const filepath = process.argv[3];
  const privateKeyHex = process.argv[4];
  const version = process.argv[5];
  const description = process.argv[6] || '';

  if (!contractUrl || !filepath || !privateKeyHex || !version) {
    console.error('Usage: node index.js <contractUrl> <zipFilePath> <privateKeyHex> <version> <description>');
    process.exit(1);
  }

  await libsodium.ready;
  const sodium = libsodium;

  const zipBuffer = fs.readFileSync(filepath);

  const sk = Buffer.from(privateKeyHex, 'hex');
  let keypair;
  if (sk.length === 32) {
    keypair = sodium.crypto_sign_seed_keypair(sk);
  } else if (sk.length === 64) {
    // 64-byte secret key
    const pk = sk.slice(32);
    keypair = { privateKey: sk, publicKey: pk };
  } else {
    console.error('privateKeyHex must be 32-byte seed (64 hex) or 64-byte secret key (128 hex).');
    process.exit(1);
  }

  const hpKeypair = { privateKey: Buffer.from(keypair.privateKey), publicKey: Buffer.from(keypair.publicKey) };

  const signature = sodium.crypto_sign_detached(new Uint8Array(zipBuffer), new Uint8Array(hpKeypair.privateKey));
  const sigHex = Buffer.from(signature).toString('hex');
  const zipBase64 = zipBuffer.toString('base64');

  const svc = new ContractService([contractUrl], hpKeypair);
  const ok = await svc.init();
  if (!ok) process.exit(2);

  const submitData = {
    service: 'Upgrade',
    Action: 'UpgradeContract',
    data: {
      version: parseFloat(version),
      description: description,
      zipBase64: zipBase64,
      zipSignatureHex: sigHex
    }
  };

  try {
    const res = await svc.submitInput(submitData);
    console.log('Upgrade response:', res);
  } catch (e) {
    console.error('Upgrade failed:', e);
  } finally {
    process.exit();
  }
})();
