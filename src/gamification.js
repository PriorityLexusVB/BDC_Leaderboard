 codex/summarize-call-center-gamification-features-b0d3sd
const SECONDS_PER_MINUTE = 60;
const QUICK_RESPONSE_THRESHOLD_SECONDS = 30;
const QUICK_RESPONSE_BONUS_POINTS = 5;
const SCORE_PERCENTAGE_DIVISOR = 10;
const OPPORTUNITY_BONUS_POINTS = 10;


 main
function computePoints(payload) {
  let points = 0;
  const call = payload.call || {};
  const scored = payload.scored_call || {};

  if (typeof call.duration === 'number') {
 codex/summarize-call-center-gamification-features-b0d3sd
    points += Math.floor(call.duration / SECONDS_PER_MINUTE);
  }
  if (
    typeof call.response_time === 'number' &&
    call.response_time < QUICK_RESPONSE_THRESHOLD_SECONDS
  ) {
    points += QUICK_RESPONSE_BONUS_POINTS;
  }
  if (typeof scored.percentage === 'number') {
    points += Math.round(scored.percentage / SCORE_PERCENTAGE_DIVISOR);
  }
  if (scored.opportunity) {
    points += OPPORTUNITY_BONUS_POINTS;

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
 main
  }
  return points;
}

module.exports = { computePoints };
