import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type DetectionPattern = {
    name: string;
    regex: string;
    category: string;
    confidence: string;
};
/** @internal */
export declare const DetectionPattern$inboundSchema: z.ZodType<DetectionPattern, unknown>;
/** @internal */
export type DetectionPattern$Outbound = {
    name: string;
    regex: string;
    category: string;
    confidence: string;
};
/** @internal */
export declare const DetectionPattern$outboundSchema: z.ZodType<DetectionPattern$Outbound, DetectionPattern>;
export declare function detectionPatternToJSON(detectionPattern: DetectionPattern): string;
export declare function detectionPatternFromJSON(jsonString: string): SafeParseResult<DetectionPattern, SDKValidationError>;
//# sourceMappingURL=detectionpattern.d.ts.map