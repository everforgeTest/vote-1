function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg + ` | Expected: ${b}, Got: ${a}`);
}

function assertSuccessResponse(res, msg) {
  if (!res || res.error) throw new Error(msg + ' | ' + JSON.stringify(res));
}

function assertErrorResponse(res, msg) {
  if (!res || !res.error) throw new Error(msg + ' | ' + JSON.stringify(res));
}

module.exports = { assertEqual, assertSuccessResponse, assertErrorResponse };
