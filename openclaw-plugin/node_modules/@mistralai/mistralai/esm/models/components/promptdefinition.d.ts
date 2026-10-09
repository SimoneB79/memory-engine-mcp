import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PromptVariable, PromptVariable$Outbound } from "./promptvariable.js";
/**
 * Versioned prompt content.
 */
export type PromptDefinition = {
    /**
     * Prompt template content.
     */
    content: string;
    /**
     * Variables used by the prompt.
     */
    variables?: Array<PromptVariable> | undefined;
};
/** @internal */
export declare const PromptDefinition$inboundSchema: z.ZodType<PromptDefinition, unknown>;
/** @internal */
export type PromptDefinition$Outbound = {
    content: string;
    variables?: Array<PromptVariable$Outbound> | undefined;
};
/** @internal */
export declare const PromptDefinition$outboundSchema: z.ZodType<PromptDefinition$Outbound, PromptDefinition>;
export declare function promptDefinitionToJSON(promptDefinition: PromptDefinition): string;
export declare function promptDefinitionFromJSON(jsonString: string): SafeParseResult<PromptDefinition, SDKValidationError>;
//# sourceMappingURL=promptdefinition.d.ts.map