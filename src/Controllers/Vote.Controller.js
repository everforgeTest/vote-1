const { VoteService } = require('../Services/Domain.Services/Vote.Service');

class VoteController {
  constructor(message, userPubKey) {
    this.message = message;
    this.userPubKey = userPubKey;
    this.service = new VoteService(message);
  }

  async handleRequest() {
    try {
      const act = this.message.Action || this.message.action;
      switch (act) {
        case 'CreateProposal':
          return await this.service.createProposal(this.userPubKey);
        case 'ListProposals':
          return await this.service.listProposals();
        case 'GetProposal':
          return await this.service.getProposal();
        case 'CastVote':
          return await this.service.castVote(this.userPubKey);
        case 'GetResults':
          return await this.service.getResults();
        case 'CloseProposal':
          return await this.service.closeProposal(this.userPubKey);
        default:
          return { error: { message: 'Invalid action.' } };
      }
    } catch (error) {
      return { error: { message: typeof error === 'string' ? error : error.message || 'Error' } };
    }
  }
}

module.exports = { VoteController };
