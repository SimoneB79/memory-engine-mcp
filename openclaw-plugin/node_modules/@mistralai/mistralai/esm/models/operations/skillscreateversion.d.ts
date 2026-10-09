import * as z from "zod/v4";
import * as components from "../components/index.js";
export type CreateSkillVersionRequest = {
    /**
     * Versioned skill content.
     */
    definition: components.SkillDefinition;
    /**
     * Notes for this version.
     */
    notes?: string | null | undefined;
    /**
     * Aliases pointing to this version.
     */
    aliases?: Array<string> | undefined;
};
export type SkillsCreateVersionRequest = {
    skillId: string;
    requestBody: CreateSkillVersionRequest;
};
/** @internal */
export type CreateSkillVersionRequest$Outbound = {
    definition: components.SkillDefinition$Outbound;
    notes?: string | null | undefined;
    aliases?: Array<string> | undefined;
};
/** @internal */
export declare const CreateSkillVersionRequest$outboundSchema: z.ZodType<CreateSkillVersionRequest$Outbound, CreateSkillVersionRequest>;
export declare function createSkillVersionRequestToJSON(createSkillVersionRequest: CreateSkillVersionRequest): string;
/** @internal */
export type SkillsCreateVersionRequest$Outbound = {
    skill_id: string;
    RequestBody: CreateSkillVersionRequest$Outbound;
};
/** @internal */
export declare const SkillsCreateVersionRequest$outboundSchema: z.ZodType<SkillsCreateVersionRequest$Outbound, SkillsCreateVersionRequest>;
export declare function skillsCreateVersionRequestToJSON(skillsCreateVersionRequest: SkillsCreateVersionRequest): string;
//# sourceMappingURL=skillscreateversion.d.ts.map