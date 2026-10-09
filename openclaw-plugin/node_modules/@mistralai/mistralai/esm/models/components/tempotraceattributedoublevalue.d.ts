import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type TempoTraceAttributeDoubleValue = {
    /**
     * The floating point value of the attribute
     */
    doubleValue: number;
};
/** @internal */
export declare const TempoTraceAttributeDoubleValue$inboundSchema: z.ZodType<TempoTraceAttributeDoubleValue, unknown>;
export declare function tempoTraceAttributeDoubleValueFromJSON(jsonString: string): SafeParseResult<TempoTraceAttributeDoubleValue, SDKValidationError>;
//# sourceMappingURL=tempotraceattributedoublevalue.d.ts.map