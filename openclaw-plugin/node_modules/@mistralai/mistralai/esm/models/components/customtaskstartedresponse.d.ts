import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { CustomTaskStartedAttributesResponse } from "./customtaskstartedattributesresponse.js";
/**
 * Emitted when a custom task begins execution.
 *
 * @remarks
 *
 * Custom tasks represent user-defined units of work within a workflow,
 * such as LLM calls, API requests, or data processing steps.
 */
export type CustomTaskStartedResponse = {
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
    eventType: "CUSTOM_TASK_STARTED";
    /**
     * Attributes for custom task started events.
     */
    attributes: CustomTaskStartedAttributesResponse;
};
/** @internal */
export declare const CustomTaskStartedResponse$inboundSchema: z.ZodType<CustomTaskStartedResponse, unknown>;
export declare function customTaskStartedResponseFromJSON(jsonString: string): SafeParseResult<CustomTaskStartedResponse, SDKValidationError>;
//# sourceMappingURL=customtaskstartedresponse.d.ts.map