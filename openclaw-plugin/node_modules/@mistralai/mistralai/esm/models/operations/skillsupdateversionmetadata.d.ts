import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdateSkillVersionRequest = {
    /**
     * Notes for this version.
     */
    notes?: string | null | undefined;
    /**
     * Presence wrapper for a set of alias labels on update RPCs. As a message field it carries presence, so callers can distinguish "leave aliases unchanged" (field omitted) from "clear all aliases" (field set, empty ``values``).
     */
    aliases?: components.AliasList | undefined;
};
export type SkillsUpdateVersionMetadataRequest = {
    skillId: string;
    version: number;
    requestBody: UpdateSkillVersionRequest;
};
/** @internal */
export type UpdateSkillVersionRequest$Outbound = {
    notes?: string | null | undefined;
    aliases?: components.AliasList$Outbound | undefined;
};
/** @internal */
export declare const UpdateSkillVersionRequest$outboundSchema: z.ZodType<UpdateSkillVersionRequest$Outbound, UpdateSkillVersionRequest>;
export declare function updateSkillVersionRequestToJSON(updateSkillVersionRequest: UpdateSkillVersionRequest): string;
/** @internal */
export type SkillsUpdateVersionMetadataRequest$Outbound = {
    skill_id: string;
    version: number;
    RequestBody: UpdateSkillVersionRequest$Outbound;
};
/** @internal */
export declare const SkillsUpdateVersionMetadataRequest$outboundSchema: z.ZodType<SkillsUpdateVersionMetadataRequest$Outbound, SkillsUpdateVersionMetadataRequest>;
export declare function skillsUpdateVersionMetadataRequestToJSON(skillsUpdateVersionMetadataRequest: SkillsUpdateVersionMetadataRequest): string;
//# sourceMappingURL=skillsupdateversionmetadata.d.ts.map