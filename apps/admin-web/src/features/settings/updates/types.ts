export type UpdateCommitInfo = {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  date: string;
};

export type UpdateStatus = {
  repoRoot: string;
  remoteName: string;
  remoteUrl: string;
  branch: string;
  upstream: string | null;
  currentHash: string;
  currentShortHash: string;
  currentVersion: string;
  remoteHash: string | null;
  remoteShortHash: string | null;
  behindBy: number;
  aheadBy: number;
  updateAvailable: boolean;
  dirty: boolean;
  dirtySummary: string[];
  commits: UpdateCommitInfo[];
  checkedAt: string;
  lastFetchOk: boolean;
  message: string;
};

export type ApplyUpdateResult = {
  success: true;
  previousHash: string;
  currentHash: string;
  currentShortHash: string;
  currentVersion: string;
  pulledCommits: number;
  postUpdateScheduled: boolean;
  message: string;
};
