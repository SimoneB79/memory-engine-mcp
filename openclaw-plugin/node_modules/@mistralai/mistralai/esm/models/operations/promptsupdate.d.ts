import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdatePromptRequest = {
    /**
     * Display title.
     */
    title?: string | null | undefined;
    /**
     * Display description.
     */
    description?: string | null | undefined;
    sharingScope?: components.RegistrySharingScope | undefined;
    /**
     * Relation a subject holds on a shared registry object.
     */
    workspaceRelation?: components.ShareRelation | undefined;
};
export type PromptsUpdateRequest = {
    promptId: string;
    requestBody: UpdatePromptRequest;
};
/** @internal */
export type UpdatePromptRequest$Outbound = {
    title?: string | null | undefined;
    description?: string | null | undefined;
    sharingScope?: string | undefined;
    workspaceRelation?: string | undefined;
};
/** @internal */
export declare const UpdatePromptRequest$outboundSchema: z.ZodType<UpdatePromptRequest$Outbound, UpdatePromptRequest>;
export declare function updatePromptRequestToJSON(updatePromptRequest: UpdatePromptRequest): string;
/** @internal */
export type PromptsUpdateRequest$Outbound = {
    prompt_id: string;
    RequestBody: UpdatePromptRequest$Outbound;
};
/** @internal */
export declare const PromptsUpdateRequest$outboundSchema: z.ZodType<PromptsUpdateRequest$Outbound, PromptsUpdateRequest>;
export declare function promptsUpdateRequestToJSON(promptsUpdateRequest: PromptsUpdateRequest): string;
//# sourceMappingURL=promptsupdate.d.ts.map