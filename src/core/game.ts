export interface Answer {
  _id?: string;
  ethAddress: string;
  answer: string;
  timesShown: number;
  trickPoints: number;
  createdAt: Date;
}

export interface Round {
  roundNumber: number;
  answer1: string;
  answer2: string;
  humanAnswerId: string;
  humanAnswerIsFirst: boolean;
}

export interface RoundResult {
  roundNumber: number;
  isCorrect: boolean;
  humanAnswerId: string;
  selectedAnswer: string;
}

export interface Submission {
  _id?: string;
  username: string;
  usernameOriginal: string;
  discordId: string;
  ethAddress: string;
  curiosity: string;
  isFollowingX: boolean;
  isDiscordMember: boolean;
  ip: string;
  timestamp: string;
  createdAt: Date;

  // Game fields
  hasPlayed: boolean;
  testStatus: "passed" | "failed" | null;
  correctAnswers: number;
  totalRounds: number;
  rounds: Round[];
  roundResults: RoundResult[];
  completedAt: Date | null;
}

export type TestStatus = "PASS" | "FAIL" | "PERFECT";
