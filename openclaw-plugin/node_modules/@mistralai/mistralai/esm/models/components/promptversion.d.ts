import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PromptDefinition } from "./promptdefinition.js";
export type PromptVersion = {
    version?: number | undefined;
    /**
     * Versioned prompt content.
     */
    definition?: PromptDefinition | undefined;
    /**
     * Notes for this version.
     */
    notes?: string | undefined;
    /**
     * Aliases pointing to this version.
     */
    aliases?: Array<string> | undefined;
    /**
     * RFC 3339 timestamp.
     */
    createdAt?: Date | undefined;
};
/** @internal */
export declare const PromptVersion$inboundSchema: z.ZodType<PromptVersion, unknown>;
export declare function promptVersionFromJSON(jsonString: string): SafeParseResult<PromptVersion, SDKValidationError>;
//# sourceMappingURL=promptversion.d.ts.map