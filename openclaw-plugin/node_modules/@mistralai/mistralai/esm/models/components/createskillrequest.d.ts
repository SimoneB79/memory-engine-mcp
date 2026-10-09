import * as z from "zod/v4";
import { RegistrySharingScope } from "./registrysharingscope.js";
import { ShareRelation } from "./sharerelation.js";
import { SkillDefinition, SkillDefinition$Outbound } from "./skilldefinition.js";
export type CreateSkillRequest = {
    /**
     * Stable object name.
     */
    name: string;
    /**
     * Versioned skill content.
     */
    definition: SkillDefinition;
    /**
     * Notes for this version.
     */
    notes?: string | null | undefined;
    sharingScope?: RegistrySharingScope | undefined;
    /**
     * Aliases pointing to this version.
     */
    aliases?: Array<string> | undefined;
    /**
     * Relation a subject holds on a shared registry object.
     */
    workspaceRelation?: ShareRelation | undefined;
};
/** @internal */
export type CreateSkillRequest$Outbound = {
    name: string;
    definition: SkillDefinition$Outbound;
    notes?: string | null | undefined;
    sharingScope?: string | undefined;
    aliases?: Array<string> | undefined;
    workspaceRelation?: string | undefined;
};
/** @internal */
export declare const CreateSkillRequest$outboundSchema: z.ZodType<CreateSkillRequest$Outbound, CreateSkillRequest>;
export declare function createSkillRequestToJSON(createSkillRequest: CreateSkillRequest): string;
//# sourceMappingURL=createskillrequest.d.ts.map