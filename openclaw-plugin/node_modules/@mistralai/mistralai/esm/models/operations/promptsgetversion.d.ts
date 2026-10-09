import * as z from "zod/v4";
export type PromptsGetVersionRequest = {
    promptId: string;
    version: number;
    fields?: Array<string> | undefined;
};
/** @internal */
export type PromptsGetVersionRequest$Outbound = {
    prompt_id: string;
    version: number;
    fields?: Array<string> | undefined;
};
/** @internal */
export declare const PromptsGetVersionRequest$outboundSchema: z.ZodType<PromptsGetVersionRequest$Outbound, PromptsGetVersionRequest>;
export declare function promptsGetVersionRequestToJSON(promptsGetVersionRequest: PromptsGetVersionRequest): string;
//# sourceMappingURL=promptsgetversion.d.ts.map