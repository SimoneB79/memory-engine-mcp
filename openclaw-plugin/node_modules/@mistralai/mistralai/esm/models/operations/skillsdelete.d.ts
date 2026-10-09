import * as z from "zod/v4";
export type SkillsDeleteRequest = {
    skillId: string;
};
/** @internal */
export type SkillsDeleteRequest$Outbound = {
    skill_id: string;
};
/** @internal */
export declare const SkillsDeleteRequest$outboundSchema: z.ZodType<SkillsDeleteRequest$Outbound, SkillsDeleteRequest>;
export declare function skillsDeleteRequestToJSON(skillsDeleteRequest: SkillsDeleteRequest): string;
//# sourceMappingURL=skillsdelete.d.ts.map