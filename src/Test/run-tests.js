const { runVoteTest } = require('./TestCases/VoteTest');

(async () => {
  try {
    console.log('Running VoteTest...');
    await runVoteTest();
    console.log('VoteTest passed.');
    process.exit(0);
  } catch (e) {
    console.error('Tests failed:', e.message);
    process.exit(1);
  }
})();
