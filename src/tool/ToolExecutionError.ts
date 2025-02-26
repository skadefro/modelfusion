export class ToolExecutionError extends Error {
  readonly toolName: string;
  readonly input: unknown;
  readonly cause: unknown;

  constructor({
    message = "unknown error",
    toolName,
    input,
    cause,
  }: {
    toolName: string;
    input: unknown;
    message: string | undefined;
    cause: unknown | undefined;
  }) {
    super(`Error executing tool ${toolName}: ${message}`);

    this.name = "ToolExecutionError";
    this.toolName = toolName;
    this.input = input;
    this.cause = cause;
  }
}
