const HotPocket = require('hotpocket-js-client');

async function runVoteTest() {
  const userKeyPair = await HotPocket.generateKeys();
  const client = await HotPocket.createClient(['ws://localhost:8081'], userKeyPair);
  if (!await client.connect()) throw new Error('Connection failed.');

  // Create proposal
  const createPayload = { Service: 'Vote', Action: 'CreateProposal', data: { title: 'Prop A', description: 'Test prop' } };
  const createRes = await client.submitContractReadRequest(Buffer.from(JSON.stringify(createPayload)));
  const createObj = JSON.parse(createRes.toString());
  if (createObj.error) throw new Error('CreateProposal failed: ' + JSON.stringify(createObj));
  const proposalId = createObj.success.proposalId;

  // List proposals
  const listPayload = { Service: 'Vote', Action: 'ListProposals' };
  const listRes = await client.submitContractReadRequest(Buffer.from(JSON.stringify(listPayload)));
  const listObj = JSON.parse(listRes.toString());
  if (listObj.error) throw new Error('ListProposals failed: ' + JSON.stringify(listObj));
  if (!Array.isArray(listObj.success) || listObj.success.length === 0) throw new Error('No proposals returned.');

  // Cast vote YES
  const votePayload = { Service: 'Vote', Action: 'CastVote', data: { proposalId: proposalId, choice: 'YES' } };
  const voteRes = await client.submitContractReadRequest(Buffer.from(JSON.stringify(votePayload)));
  const voteObj = JSON.parse(voteRes.toString());
  if (voteObj.error) throw new Error('CastVote failed: ' + JSON.stringify(voteObj));

  // Get results
  const resPayload = { Service: 'Vote', Action: 'GetResults', data: { proposalId: proposalId } };
  const resultsRes = await client.submitContractReadRequest(Buffer.from(JSON.stringify(resPayload)));
  const resultsObj = JSON.parse(resultsRes.toString());
  if (resultsObj.error) throw new Error('GetResults failed: ' + JSON.stringify(resultsObj));
  if (resultsObj.success.counts.YES < 1) throw new Error('YES votes should be at least 1.');

  // Close proposal
  const closePayload = { Service: 'Vote', Action: 'CloseProposal', data: { id: proposalId } };
  const closeRes = await client.submitContractReadRequest(Buffer.from(JSON.stringify(closePayload)));
  const closeObj = JSON.parse(closeRes.toString());
  if (closeObj.error) throw new Error('CloseProposal failed: ' + JSON.stringify(closeObj));

  client.disconnect();
  return true;
}

module.exports = { runVoteTest };
