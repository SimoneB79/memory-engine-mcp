import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { CustomTaskInProgressAttributesResponse } from "./customtaskinprogressattributesresponse.js";
/**
 * Emitted during custom task execution to report progress.
 *
 * @remarks
 *
 * This event supports streaming updates via JSON or JSON Patch payloads,
 * enabling real-time progress tracking for long-running tasks.
 */
export type CustomTaskInProgressResponse = {
    /**
     * Unique identifier for this event instance.
     */
    eventId: string;
    /**
     * Unix timestamp in nanoseconds when the event was created.
     */
    eventTimestamp: number;
    /**
     * Execution ID of the root workflow that initiated this execution chain.
     */
    rootWorkflowExecId: string;
    /**
     * Execution ID of the parent workflow that initiated this execution. If this is a root workflow, this field is not set.
     */
    parentWorkflowExecId: string | null;
    /**
     * Run ID of the execution this run continued from. Non-null for continue-as-new runs.
     */
    continuedRunId: string | null;
    /**
     * Run ID of the first execution in this workflow chain. Equals workflow_run_id on fresh starts and resets (chain anchor resets on reset); differs on CAN and Retry runs where it stays anchored to the original first run.
     */
    firstExecutionRunId: string | null;
    /**
     * Temporal schedule ID that triggered this execution, if any.
     */
    scheduleId: string | null;
    /**
     * Execution ID of the workflow that emitted this event.
     */
    workflowExecId: string;
    /**
     * Run ID of the workflow execution. Changes on continue-as-new while workflow_exec_id stays the same.
     */
    workflowRunId: string;
    /**
     * The registered name of the workflow that emitted this event.
     */
    workflowName: string;
    /**
     * Event type discriminator.
     */
    eventType: "CUSTOM_TASK_IN_PROGRESS";
    /**
     * Attributes for custom task in-progress events with streaming updates.
     */
    attributes: CustomTaskInProgressAttributesResponse;
};
/** @internal */
export declare const CustomTaskInProgressResponse$inboundSchema: z.ZodType<CustomTaskInProgressResponse, unknown>;
export declare function customTaskInProgressResponseFromJSON(jsonString: string): SafeParseResult<CustomTaskInProgressResponse, SDKValidationError>;
//# sourceMappingURL=customtaskinprogressresponse.d.ts.map