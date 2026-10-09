import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdateSkillRequest = {
    sharingScope?: components.RegistrySharingScope | undefined;
    /**
     * Relation a subject holds on a shared registry object.
     */
    workspaceRelation?: components.ShareRelation | undefined;
};
export type SkillsUpdateRequest = {
    skillId: string;
    requestBody: UpdateSkillRequest;
};
/** @internal */
export type UpdateSkillRequest$Outbound = {
    sharingScope?: string | undefined;
    workspaceRelation?: string | undefined;
};
/** @internal */
export declare const UpdateSkillRequest$outboundSchema: z.ZodType<UpdateSkillRequest$Outbound, UpdateSkillRequest>;
export declare function updateSkillRequestToJSON(updateSkillRequest: UpdateSkillRequest): string;
/** @internal */
export type SkillsUpdateRequest$Outbound = {
    skill_id: string;
    RequestBody: UpdateSkillRequest$Outbound;
};
/** @internal */
export declare const SkillsUpdateRequest$outboundSchema: z.ZodType<SkillsUpdateRequest$Outbound, SkillsUpdateRequest>;
export declare function skillsUpdateRequestToJSON(skillsUpdateRequest: SkillsUpdateRequest): string;
//# sourceMappingURL=skillsupdate.d.ts.map