import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type StreamDeploymentLogsRequest = {
    name: string;
    /**
     * Filter logs by worker name
     */
    workerName?: string | null | undefined;
    /**
     * Filter logs by workflow name
     */
    workflowName?: string | null | undefined;
    /**
     * Start a fresh stream at this timestamp (ignored when resuming via last_event_id)
     */
    after?: Date | null | undefined;
    /**
     * Resume from this cursor (a prior response's SSE id)
     */
    lastEventId?: string | null | undefined;
};
export declare const StreamDeploymentLogsEvent: {
    readonly Log: "log";
    readonly Error: "error";
};
export type StreamDeploymentLogsEvent = OpenEnum<typeof StreamDeploymentLogsEvent>;
export type StreamDeploymentLogsData = components.DeploymentLogRecord | components.StreamError;
/**
 * Stream of Server-Sent Events (SSE): `log` events carry a DeploymentLogRecord; `error` events carry a StreamError payload.
 */
export type StreamDeploymentLogsResponseBody = {
    event?: StreamDeploymentLogsEvent | undefined;
    id?: string | undefined;
    data?: components.DeploymentLogRecord | components.StreamError | undefined;
};
/** @internal */
export type StreamDeploymentLogsRequest$Outbound = {
    name: string;
    worker_name?: string | null | undefined;
    workflow_name?: string | null | undefined;
    after?: string | null | undefined;
    last_event_id?: string | null | undefined;
};
/** @internal */
export declare const StreamDeploymentLogsRequest$outboundSchema: z.ZodType<StreamDeploymentLogsRequest$Outbound, StreamDeploymentLogsRequest>;
export declare function streamDeploymentLogsRequestToJSON(streamDeploymentLogsRequest: StreamDeploymentLogsRequest): string;
/** @internal */
export declare const StreamDeploymentLogsEvent$inboundSchema: z.ZodType<StreamDeploymentLogsEvent, unknown>;
/** @internal */
export declare const StreamDeploymentLogsData$inboundSchema: z.ZodType<StreamDeploymentLogsData, unknown>;
export declare function streamDeploymentLogsDataFromJSON(jsonString: string): SafeParseResult<StreamDeploymentLogsData, SDKValidationError>;
/** @internal */
export declare const StreamDeploymentLogsResponseBody$inboundSchema: z.ZodType<StreamDeploymentLogsResponseBody, unknown>;
export declare function streamDeploymentLogsResponseBodyFromJSON(jsonString: string): SafeParseResult<StreamDeploymentLogsResponseBody, SDKValidationError>;
//# sourceMappingURL=streamdeploymentlogs.d.ts.map