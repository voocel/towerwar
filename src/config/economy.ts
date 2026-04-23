export const ECONOMY = {
  startingGold: 150,
  startingLives: 20,
  waveCompleteBonus: 40,
  killReward: 2,
  killRewardMarked: 5,   // when enemy dies with any mark
  sellRatio: 0.7,
  actHealLives: 5,       // restored on act transition, capped at startingLives
} as const;
