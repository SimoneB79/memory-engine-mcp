import * as z from "zod/v4";
export type PromptsDeleteRequest = {
    promptId: string;
};
/** @internal */
export type PromptsDeleteRequest$Outbound = {
    prompt_id: string;
};
/** @internal */
export declare const PromptsDeleteRequest$outboundSchema: z.ZodType<PromptsDeleteRequest$Outbound, PromptsDeleteRequest>;
export declare function promptsDeleteRequestToJSON(promptsDeleteRequest: PromptsDeleteRequest): string;
//# sourceMappingURL=promptsdelete.d.ts.map