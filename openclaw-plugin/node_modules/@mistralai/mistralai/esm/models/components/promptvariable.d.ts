import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type PromptVariable = {
    /**
     * Stable object name.
     */
    name?: string | undefined;
};
/** @internal */
export declare const PromptVariable$inboundSchema: z.ZodType<PromptVariable, unknown>;
/** @internal */
export type PromptVariable$Outbound = {
    name?: string | undefined;
};
/** @internal */
export declare const PromptVariable$outboundSchema: z.ZodType<PromptVariable$Outbound, PromptVariable>;
export declare function promptVariableToJSON(promptVariable: PromptVariable): string;
export declare function promptVariableFromJSON(jsonString: string): SafeParseResult<PromptVariable, SDKValidationError>;
//# sourceMappingURL=promptvariable.d.ts.map