const HotPocket = require('hotpocket-js-client');
const bson = require('bson');

class ContractService {
  constructor(servers, keypair) {
    this.servers = servers;
    this.keypair = keypair;
    this.client = null;
    this.isConnected = false;
    this.promiseMap = new Map();
  }

  async init() {
    if (!this.client) {
      this.client = await HotPocket.createClient(this.servers, this.keypair, {
        protocol: HotPocket.protocols.bson
      });
    }

    this.client.on(HotPocket.events.disconnect, () => {
      this.isConnected = false;
      console.log('Disconnected');
    });

    this.client.on(HotPocket.events.connectionChange, (server, action) => {
      console.log(server + ' ' + action);
    });

    this.client.on(HotPocket.events.contractOutput, r => {
      r.outputs.forEach(o => {
        let out;
        try { out = bson.deserialize(o); } catch (e) { out = {}; }
        const pId = out.promiseId;
        if (out && out.error) this.promiseMap.get(pId)?.rejecter(out.error);
        else this.promiseMap.get(pId)?.resolver(out.success || out);
        this.promiseMap.delete(pId);
      });
    });

    if (!this.isConnected) {
      if (!(await this.client.connect())) {
        console.log('Connection failed.');
        return false;
      }
      console.log('HotPocket Connected.');
      this.isConnected = true;
    }

    return true;
  }

  submitInput(inp) {
    const promiseId = this._uid();
    const payload = bson.serialize({ promiseId, ...inp });

    this.client.submitContractInput(payload).then(input => {
      input?.submissionStatus.then(s => {
        if (s.status !== 'accepted') {
          console.log(`Ledger_Rejection: ${s.reason}`);
        }
      });
    });

    return new Promise((resolve, reject) => {
      this.promiseMap.set(promiseId, { resolver: resolve, rejecter: reject });
    });
  }

  async submitRead(inp) {
    const payload = bson.serialize(inp);
    const out = await this.client.submitContractReadRequest(payload);
    let res;
    try { res = bson.deserialize(out); } catch (e) { res = {}; }
    if (res.error) throw res.error;
    return res.success || res;
  }

  _uid() {
    return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  }
}

module.exports = ContractService;
