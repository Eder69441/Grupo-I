const Return = require("../models/Return");

async function getCashRefundSummary(cashSessionId, session = null) {
  const query = Return.find({
    cashSession: cashSessionId,
    refundMethod: "cash",
  });

  if (session) {
    query.session(session);
  }

  const returns = await query.lean();

  const totalCashRefunds =
    Math.round(returns.reduce((total, item) => total + item.total, 0) * 100) /
    100;

  return {
    cashRefundCount: returns.length,
    totalCashRefunds,
  };
}

module.exports = { getCashRefundSummary };
