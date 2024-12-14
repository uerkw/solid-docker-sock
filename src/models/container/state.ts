interface State {
  Status: "running" | "restarting" | "stopped";
  Running: boolean;
  Paused: boolean;
  Restarting: boolean;
  OOMKilled: boolean;
  Dead: boolean;
  Pid: number;
  ExitCode: number;
  Error: string;
  StartedAt: string; // ISO 8601 date-time string
  FinishedAt: string; // ISO 8601 date-time string
}
