const { computePoints } = require('../src/gamification');

describe('computePoints edge cases', () => {
  test('returns 0 when no fields are provided', () => {
    expect(computePoints({})).toBe(0);
  });

  test('handles boundary values for duration, response time and score', () => {
    const insideThreshold = {
      call: { duration: 60, response_time: 29 },
      scored_call: { percentage: 55 },
    };
    expect(computePoints(insideThreshold)).toBe(1 + 5 + 6);

    const atThreshold = {
      call: { duration: 59, response_time: 30 },
      scored_call: { percentage: 54 },
    };
    expect(computePoints(atThreshold)).toBe(5);
  });

  test('adds opportunity bonus when flag is true', () => {
    expect(computePoints({ scored_call: { opportunity: true } })).toBe(10);
    expect(computePoints({ scored_call: { opportunity: false } })).toBe(0);
  });
});
