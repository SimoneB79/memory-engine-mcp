import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { SkillDefinition } from "./skilldefinition.js";
export type SkillVersion = {
    version?: number | undefined;
    /**
     * Versioned skill content.
     */
    definition?: SkillDefinition | undefined;
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
export declare const SkillVersion$inboundSchema: z.ZodType<SkillVersion, unknown>;
export declare function skillVersionFromJSON(jsonString: string): SafeParseResult<SkillVersion, SDKValidationError>;
//# sourceMappingURL=skillversion.d.ts.map