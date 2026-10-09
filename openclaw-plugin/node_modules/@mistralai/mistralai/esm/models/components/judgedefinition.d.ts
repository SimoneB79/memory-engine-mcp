import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type JudgeDefinition = {
    model: string;
    prompt: string;
};
/** @internal */
export declare const JudgeDefinition$inboundSchema: z.ZodType<JudgeDefinition, unknown>;
/** @internal */
export type JudgeDefinition$Outbound = {
    model: string;
    prompt: string;
};
/** @internal */
export declare const JudgeDefinition$outboundSchema: z.ZodType<JudgeDefinition$Outbound, JudgeDefinition>;
export declare function judgeDefinitionToJSON(judgeDefinition: JudgeDefinition): string;
export declare function judgeDefinitionFromJSON(jsonString: string): SafeParseResult<JudgeDefinition, SDKValidationError>;
//# sourceMappingURL=judgedefinition.d.ts.map