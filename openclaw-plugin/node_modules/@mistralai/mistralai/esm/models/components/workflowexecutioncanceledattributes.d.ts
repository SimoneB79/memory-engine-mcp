import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Attributes for workflow execution canceled events.
 */
export type WorkflowExecutionCanceledAttributes = {
    /**
     * Unique identifier for the task within the workflow execution.
     */
    taskId: string;
    /**
     * Optional reason provided for the cancellation.
     */
    reason?: string | null | undefined;
    /**
     * Workflow retry attempt number. 1 on first run and CAN; >1 on workflow-level retries.
     */
    attempt: number;
};
/** @internal */
export declare const WorkflowExecutionCanceledAttributes$inboundSchema: z.ZodType<WorkflowExecutionCanceledAttributes, unknown>;
export declare function workflowExecutionCanceledAttributesFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionCanceledAttributes, SDKValidationError>;
//# sourceMappingURL=workflowexecutioncanceledattributes.d.ts.map