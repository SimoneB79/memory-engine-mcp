import * as z from "zod/v4";
export type PromptsGetRequest = {
    promptId: string;
    version?: number | undefined;
    alias?: string | undefined;
    fields?: Array<string> | undefined;
};
/** @internal */
export type PromptsGetRequest$Outbound = {
    prompt_id: string;
    version?: number | undefined;
    alias?: string | undefined;
    fields?: Array<string> | undefined;
};
/** @internal */
export declare const PromptsGetRequest$outboundSchema: z.ZodType<PromptsGetRequest$Outbound, PromptsGetRequest>;
export declare function promptsGetRequestToJSON(promptsGetRequest: PromptsGetRequest): string;
//# sourceMappingURL=promptsget.d.ts.map