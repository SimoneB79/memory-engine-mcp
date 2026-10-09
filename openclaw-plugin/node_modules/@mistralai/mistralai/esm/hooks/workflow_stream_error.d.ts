import { AfterSuccessContext, AfterSuccessHook, Awaitable } from "./types.js";
export type StreamDisconnectReason = "read_error" | "stream_error" | "internal_error";
export declare class StreamDisconnectedError extends Error {
    readonly reason: StreamDisconnectReason;
    readonly error: string;
    constructor(options: {
        reason: StreamDisconnectReason;
        error: string;
    });
}
export declare class WorkflowStreamErrorHook implements AfterSuccessHook {
    afterSuccess(hookCtx: AfterSuccessContext, response: Response): Awaitable<Response>;
}
//# sourceMappingURL=workflow_stream_error.d.ts.map