import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdatePromptVersionRequest = {
    /**
     * Notes for this version.
     */
    notes?: string | null | undefined;
    /**
     * Presence wrapper for a set of alias labels on update RPCs. As a message field it carries presence, so callers can distinguish "leave aliases unchanged" (field omitted) from "clear all aliases" (field set, empty ``values``).
     */
    aliases?: components.AliasList | undefined;
};
export type PromptsUpdateVersionMetadataRequest = {
    promptId: string;
    version: number;
    requestBody: UpdatePromptVersionRequest;
};
/** @internal */
export type UpdatePromptVersionRequest$Outbound = {
    notes?: string | null | undefined;
    aliases?: components.AliasList$Outbound | undefined;
};
/** @internal */
export declare const UpdatePromptVersionRequest$outboundSchema: z.ZodType<UpdatePromptVersionRequest$Outbound, UpdatePromptVersionRequest>;
export declare function updatePromptVersionRequestToJSON(updatePromptVersionRequest: UpdatePromptVersionRequest): string;
/** @internal */
export type PromptsUpdateVersionMetadataRequest$Outbound = {
    prompt_id: string;
    version: number;
    RequestBody: UpdatePromptVersionRequest$Outbound;
};
/** @internal */
export declare const PromptsUpdateVersionMetadataRequest$outboundSchema: z.ZodType<PromptsUpdateVersionMetadataRequest$Outbound, PromptsUpdateVersionMetadataRequest>;
export declare function promptsUpdateVersionMetadataRequestToJSON(promptsUpdateVersionMetadataRequest: PromptsUpdateVersionMetadataRequest): string;
//# sourceMappingURL=promptsupdateversionmetadata.d.ts.map