import * as z from "zod/v4";
import * as components from "../components/index.js";
export type CreatePromptVersionRequest = {
    /**
     * Versioned prompt content.
     */
    definition: components.PromptDefinition;
    /**
     * Notes for this version.
     */
    notes?: string | null | undefined;
    /**
     * Aliases pointing to this version.
     */
    aliases?: Array<string> | undefined;
};
export type PromptsCreateVersionRequest = {
    promptId: string;
    requestBody: CreatePromptVersionRequest;
};
/** @internal */
export type CreatePromptVersionRequest$Outbound = {
    definition: components.PromptDefinition$Outbound;
    notes?: string | null | undefined;
    aliases?: Array<string> | undefined;
};
/** @internal */
export declare const CreatePromptVersionRequest$outboundSchema: z.ZodType<CreatePromptVersionRequest$Outbound, CreatePromptVersionRequest>;
export declare function createPromptVersionRequestToJSON(createPromptVersionRequest: CreatePromptVersionRequest): string;
/** @internal */
export type PromptsCreateVersionRequest$Outbound = {
    prompt_id: string;
    RequestBody: CreatePromptVersionRequest$Outbound;
};
/** @internal */
export declare const PromptsCreateVersionRequest$outboundSchema: z.ZodType<PromptsCreateVersionRequest$Outbound, PromptsCreateVersionRequest>;
export declare function promptsCreateVersionRequestToJSON(promptsCreateVersionRequest: PromptsCreateVersionRequest): string;
//# sourceMappingURL=promptscreateversion.d.ts.map