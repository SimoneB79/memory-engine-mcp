import * as z from "zod/v4";
export type SkillsGetRequest = {
    skillId: string;
    version?: number | undefined;
    alias?: string | undefined;
    fields?: Array<string> | undefined;
};
/** @internal */
export type SkillsGetRequest$Outbound = {
    skill_id: string;
    version?: number | undefined;
    alias?: string | undefined;
    fields?: Array<string> | undefined;
};
/** @internal */
export declare const SkillsGetRequest$outboundSchema: z.ZodType<SkillsGetRequest$Outbound, SkillsGetRequest>;
export declare function skillsGetRequestToJSON(skillsGetRequest: SkillsGetRequest): string;
//# sourceMappingURL=skillsget.d.ts.map