import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type WorkflowStreamError = {
    error: string;
    reason: string;
};
/** @internal */
export declare const WorkflowStreamError$inboundSchema: z.ZodType<WorkflowStreamError, unknown>;
/** @internal */
export type WorkflowStreamError$Outbound = {
    error: string;
    reason: string;
};
/** @internal */
export declare const WorkflowStreamError$outboundSchema: z.ZodType<WorkflowStreamError$Outbound, WorkflowStreamError>;
export declare function workflowStreamErrorToJSON(workflowStreamError: WorkflowStreamError): string;
export declare function workflowStreamErrorFromJSON(jsonString: string): SafeParseResult<WorkflowStreamError, SDKValidationError>;
//# sourceMappingURL=workflowstreamerror.d.ts.map