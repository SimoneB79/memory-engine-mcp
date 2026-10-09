import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { SkillAssetContent, SkillAssetContent$Outbound } from "./skillassetcontent.js";
/**
 * Versioned skill content.
 */
export type SkillDefinition = {
    /**
     * Model-facing trigger and usage description.
     */
    description?: string | undefined;
    /**
     * Skill body content.
     */
    body?: string | undefined;
    /**
     * Additional files available to the skill.
     */
    assets?: {
        [k: string]: SkillAssetContent;
    } | undefined;
};
/** @internal */
export declare const SkillDefinition$inboundSchema: z.ZodType<SkillDefinition, unknown>;
/** @internal */
export type SkillDefinition$Outbound = {
    description?: string | undefined;
    body?: string | undefined;
    assets?: {
        [k: string]: SkillAssetContent$Outbound;
    } | undefined;
};
/** @internal */
export declare const SkillDefinition$outboundSchema: z.ZodType<SkillDefinition$Outbound, SkillDefinition>;
export declare function skillDefinitionToJSON(skillDefinition: SkillDefinition): string;
export declare function skillDefinitionFromJSON(jsonString: string): SafeParseResult<SkillDefinition, SDKValidationError>;
//# sourceMappingURL=skilldefinition.d.ts.map