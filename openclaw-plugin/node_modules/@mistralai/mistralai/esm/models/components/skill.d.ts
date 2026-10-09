import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { RegistrySharingScope } from "./registrysharingscope.js";
import { SkillDefinition } from "./skilldefinition.js";
export type Skill = {
    id?: string | undefined;
    /**
     * Stable object name.
     */
    name?: string | undefined;
    /**
     * Versioned skill content.
     */
    definition?: SkillDefinition | undefined;
    version?: number | undefined;
    /**
     * Notes for this version.
     */
    notes?: string | undefined;
    /**
     * Aliases pointing to this version.
     */
    aliases?: Array<string> | undefined;
    sharingScope?: RegistrySharingScope | undefined;
    /**
     * RFC 3339 timestamp.
     */
    createdAt?: Date | undefined;
    /**
     * RFC 3339 timestamp.
     */
    updatedAt?: Date | undefined;
    /**
     * Latest version number.
     */
    latestVersion?: number | undefined;
};
/** @internal */
export declare const Skill$inboundSchema: z.ZodType<Skill, unknown>;
export declare function skillFromJSON(jsonString: string): SafeParseResult<Skill, SDKValidationError>;
//# sourceMappingURL=skill.d.ts.map