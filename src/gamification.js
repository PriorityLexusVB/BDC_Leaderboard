function computePoints(payload) {
  let points = 0;
  const call = payload.call || {};
  const scored = payload.scored_call || {};

  if (typeof call.duration === 'number') {
    points += Math.floor(call.duration / 60); // 1 point per minute
  }
  if (typeof call.response_time === 'number' && call.response_time < 30) {
    points += 5; // quick response bonus
  }
  if (typeof scored.percentage === 'number') {
    points += Math.round(scored.percentage / 10); // 0-10 points
  }
  if (scored.opportunity) {
    points += 10; // sales opportunity bonus
  }
  return points;
}

module.exports = { computePoints };
