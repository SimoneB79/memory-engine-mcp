import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type StreamV1WorkflowsExecutionsExecutionIdStreamGetRequest = {
    executionId: string;
    eventSource?: components.EventSource | null | undefined;
    lastEventId?: string | null | undefined;
};
export type StreamV1WorkflowsExecutionsExecutionIdStreamGetData = components.StreamEventSsePayload | components.WorkflowStreamError;
/**
 * Stream of Server-Sent Events (SSE)
 */
export type StreamV1WorkflowsExecutionsExecutionIdStreamGetResponseBody = {
    /**
     * SSE event name. `error` indicates the stream failed after HTTP 200.
     */
    event?: string | undefined;
    data?: components.StreamEventSsePayload | components.WorkflowStreamError | undefined;
    id?: string | undefined;
    retry?: number | undefined;
};
/** @internal */
export type StreamV1WorkflowsExecutionsExecutionIdStreamGetRequest$Outbound = {
    execution_id: string;
    event_source?: string | null | undefined;
    last_event_id?: string | null | undefined;
};
/** @internal */
export declare const StreamV1WorkflowsExecutionsExecutionIdStreamGetRequest$outboundSchema: z.ZodType<StreamV1WorkflowsExecutionsExecutionIdStreamGetRequest$Outbound, StreamV1WorkflowsExecutionsExecutionIdStreamGetRequest>;
export declare function streamV1WorkflowsExecutionsExecutionIdStreamGetRequestToJSON(streamV1WorkflowsExecutionsExecutionIdStreamGetRequest: StreamV1WorkflowsExecutionsExecutionIdStreamGetRequest): string;
/** @internal */
export declare const StreamV1WorkflowsExecutionsExecutionIdStreamGetData$inboundSchema: z.ZodType<StreamV1WorkflowsExecutionsExecutionIdStreamGetData, unknown>;
export declare function streamV1WorkflowsExecutionsExecutionIdStreamGetDataFromJSON(jsonString: string): SafeParseResult<StreamV1WorkflowsExecutionsExecutionIdStreamGetData, SDKValidationError>;
/** @internal */
export declare const StreamV1WorkflowsExecutionsExecutionIdStreamGetResponseBody$inboundSchema: z.ZodType<StreamV1WorkflowsExecutionsExecutionIdStreamGetResponseBody, unknown>;
export declare function streamV1WorkflowsExecutionsExecutionIdStreamGetResponseBodyFromJSON(jsonString: string): SafeParseResult<StreamV1WorkflowsExecutionsExecutionIdStreamGetResponseBody, SDKValidationError>;
//# sourceMappingURL=streamv1workflowsexecutionsexecutionidstreamget.d.ts.map