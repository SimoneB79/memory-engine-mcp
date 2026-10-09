import * as z from "zod/v4";
export type PromptsListVersionsRequest = {
    promptId: string;
};
/** @internal */
export type PromptsListVersionsRequest$Outbound = {
    prompt_id: string;
};
/** @internal */
export declare const PromptsListVersionsRequest$outboundSchema: z.ZodType<PromptsListVersionsRequest$Outbound, PromptsListVersionsRequest>;
export declare function promptsListVersionsRequestToJSON(promptsListVersionsRequest: PromptsListVersionsRequest): string;
//# sourceMappingURL=promptslistversions.d.ts.map