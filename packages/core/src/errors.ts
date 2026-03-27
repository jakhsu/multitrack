export class MultitrackError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(`[@multitrack] ${code}: ${message}`);
    this.code = code;
    this.name = "MultitrackError";
  }
}

export function stepNotFound(name: string): MultitrackError {
  return new MultitrackError(
    "STEP_NOT_FOUND",
    `Step "${name}" not found in resolved steps. Check that the step name matches your config.`,
  );
}

export function emptyConfig(): MultitrackError {
  return new MultitrackError(
    "EMPTY_CONFIG",
    "No step configurations provided. Pass at least one StepConfig to create a timeline.",
  );
}

export function duplicateStepName(name: string): MultitrackError {
  return new MultitrackError(
    "DUPLICATE_STEP_NAME",
    `Step name "${name}" is used more than once. Non-buffer step names must be unique.`,
  );
}
