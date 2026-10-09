import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ExecutionTraceInfoResponse = {
    /**
     * The ID of the trace, if available
     */
    otelTraceId?: string | null | undefined;
    /**
     * Whether trace data is available in the trace backend for this execution
     */
    hasTraceData: boolean;
};
/** @internal */
export declare const ExecutionTraceInfoResponse$inboundSchema: z.ZodType<ExecutionTraceInfoResponse, unknown>;
export declare function executionTraceInfoResponseFromJSON(jsonString: string): SafeParseResult<ExecutionTraceInfoResponse, SDKValidationError>;
//# sourceMappingURL=executiontraceinforesponse.d.ts.map