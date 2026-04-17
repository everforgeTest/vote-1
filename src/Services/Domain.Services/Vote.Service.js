const { Tables } = require('../../Constants/Tables');
const { SqliteDatabase } = require('../Common.Services/dbHandler');
const settings = require('../../settings.json').settings;

class VoteService {
  constructor(message) {
    this.message = message;
    this.db = new SqliteDatabase(settings.dbPath);
  }

  async createProposal(userPubKey) {
    const resObj = {};
    try {
      this.db.open();
      const data = this.message.data || {};
      if (!data.title || typeof data.title !== 'string') {
        throw new Error('Invalid title.');
      }
      const row = {
        Title: data.title,
        Description: data.description || '',
        CreatedBy: userPubKey,
        Status: 'OPEN'
      };
      const result = await this.db.insertValue(Tables.PROPOSAL, row);
      resObj.success = { proposalId: result.lastId };
      return resObj;
    } finally {
      this.db.close();
    }
  }

  async listProposals() {
    const resObj = {};
    try {
      this.db.open();
      const rows = await this.db.getValues(Tables.PROPOSAL, {});
      resObj.success = rows.map(r => ({
        id: r.Id,
        title: r.Title,
        description: r.Description,
        createdBy: r.CreatedBy,
        status: r.Status,
        createdOn: r.CreatedOn,
        lastUpdatedOn: r.LastUpdatedOn
      }));
      return resObj;
    } finally {
      this.db.close();
    }
  }

  async getProposal() {
    const resObj = {};
    try {
      this.db.open();
      const id = this.message.data && this.message.data.id;
      if (!id) throw new Error('Proposal id is required.');
      const p = await this.db.findById(Tables.PROPOSAL, id);
      if (!p) throw new Error('Proposal not found.');
      resObj.success = {
        id: p.Id,
        title: p.Title,
        description: p.Description,
        createdBy: p.CreatedBy,
        status: p.Status,
        createdOn: p.CreatedOn,
        lastUpdatedOn: p.LastUpdatedOn
      };
      return resObj;
    } finally {
      this.db.close();
    }
  }

  async castVote(userPubKey) {
    const resObj = {};
    try {
      this.db.open();
      const d = this.message.data || {};
      const proposalId = d.proposalId;
      const choice = (d.choice || '').toUpperCase();
      if (!proposalId) throw new Error('proposalId is required.');
      if (!['YES', 'NO'].includes(choice)) throw new Error('choice must be YES or NO.');

      const p = await this.db.findById(Tables.PROPOSAL, proposalId);
      if (!p) throw new Error('Proposal not found.');
      if (p.Status !== 'OPEN') throw new Error('Proposal is closed.');

      const vote = {
        ProposalId: proposalId,
        VoterPubKey: userPubKey,
        Choice: choice
      };

      try {
        const r = await this.db.insertValue(Tables.VOTE, vote);
        resObj.success = { voteId: r.lastId };
      } catch (e) {
        if (/UNIQUE/.test(String(e))) {
          throw new Error('You have already voted on this proposal.');
        }
        throw e;
      }

      return resObj;
    } finally {
      this.db.close();
    }
  }

  async getResults() {
    const resObj = {};
    try {
      this.db.open();
      const id = this.message.data && this.message.data.proposalId;
      if (!id) throw new Error('proposalId is required.');
      const p = await this.db.findById(Tables.PROPOSAL, id);
      if (!p) throw new Error('Proposal not found.');

      const rows = await this.db.runSelectQuery(
        `SELECT Choice, COUNT(*) AS Cnt FROM ${Tables.VOTE} WHERE ProposalId = ? GROUP BY Choice`,
        [id]
      );
      const counts = { YES: 0, NO: 0 };
      for (const r of rows) {
        counts[r.Choice] = r.Cnt;
      }
      resObj.success = { proposalId: id, counts, total: counts.YES + counts.NO };
      return resObj;
    } finally {
      this.db.close();
    }
  }

  async closeProposal(userPubKey) {
    const resObj = {};
    try {
      this.db.open();
      const id = this.message.data && this.message.data.id;
      if (!id) throw new Error('Proposal id is required.');
      const p = await this.db.findById(Tables.PROPOSAL, id);
      if (!p) throw new Error('Proposal not found.');
      if (p.CreatedBy !== userPubKey) throw new Error('Only the creator can close this proposal.');
      if (p.Status !== 'OPEN') throw new Error('Proposal already closed.');

      await this.db.updateValue(Tables.PROPOSAL, { Status: 'CLOSED' }, { Id: id });
      resObj.success = { id, status: 'CLOSED' };
      return resObj;
    } finally {
      this.db.close();
    }
  }
}

module.exports = { VoteService };
