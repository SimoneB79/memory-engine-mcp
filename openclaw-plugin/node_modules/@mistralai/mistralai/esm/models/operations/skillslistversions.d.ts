import * as z from "zod/v4";
export type SkillsListVersionsRequest = {
    skillId: string;
};
/** @internal */
export type SkillsListVersionsRequest$Outbound = {
    skill_id: string;
};
/** @internal */
export declare const SkillsListVersionsRequest$outboundSchema: z.ZodType<SkillsListVersionsRequest$Outbound, SkillsListVersionsRequest>;
export declare function skillsListVersionsRequestToJSON(skillsListVersionsRequest: SkillsListVersionsRequest): string;
//# sourceMappingURL=skillslistversions.d.ts.map