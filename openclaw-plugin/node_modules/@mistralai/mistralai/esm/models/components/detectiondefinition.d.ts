import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DetectionPattern, DetectionPattern$Outbound } from "./detectionpattern.js";
export type DetectionDefinition = {
    targetAttributes: Array<string>;
    patterns: Array<DetectionPattern>;
};
/** @internal */
export declare const DetectionDefinition$inboundSchema: z.ZodType<DetectionDefinition, unknown>;
/** @internal */
export type DetectionDefinition$Outbound = {
    target_attributes: Array<string>;
    patterns: Array<DetectionPattern$Outbound>;
};
/** @internal */
export declare const DetectionDefinition$outboundSchema: z.ZodType<DetectionDefinition$Outbound, DetectionDefinition>;
export declare function detectionDefinitionToJSON(detectionDefinition: DetectionDefinition): string;
export declare function detectionDefinitionFromJSON(jsonString: string): SafeParseResult<DetectionDefinition, SDKValidationError>;
//# sourceMappingURL=detectiondefinition.d.ts.map