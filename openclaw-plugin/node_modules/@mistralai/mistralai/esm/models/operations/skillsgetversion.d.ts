import * as z from "zod/v4";
export type SkillsGetVersionRequest = {
    skillId: string;
    version: number;
    fields?: Array<string> | undefined;
};
/** @internal */
export type SkillsGetVersionRequest$Outbound = {
    skill_id: string;
    version: number;
    fields?: Array<string> | undefined;
};
/** @internal */
export declare const SkillsGetVersionRequest$outboundSchema: z.ZodType<SkillsGetVersionRequest$Outbound, SkillsGetVersionRequest>;
export declare function skillsGetVersionRequestToJSON(skillsGetVersionRequest: SkillsGetVersionRequest): string;
//# sourceMappingURL=skillsgetversion.d.ts.map