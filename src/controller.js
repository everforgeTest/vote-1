const { VoteController } = require('./Controllers/Vote.Controller');
const { UpgradeController } = require('./Controllers/Upgrade.Controller');

class Controller {
  async handleRequest(user, message) {
    const service = message.Service || message.service;
    const action = message.Action || message.action;
    const userPubKey = user.publicKey || user.pubKey || '';

    let result = {};
    if (service === 'Vote') {
      const controller = new VoteController(message, userPubKey);
      result = await controller.handleRequest();
    } else if (service === 'Upgrade') {
      const controller = new UpgradeController(message, userPubKey);
      result = await controller.handleRequest();
    } else {
      result = { error: { message: 'Invalid service.' } };
    }

    await user.send(result);
  }
}

module.exports = { Controller };
