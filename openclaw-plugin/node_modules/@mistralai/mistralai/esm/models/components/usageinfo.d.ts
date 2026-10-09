import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type UsageInfo = {
    promptTokens?: number | undefined;
    completionTokens?: number | undefined;
    totalTokens?: number | undefined;
    promptAudioSeconds?: number | null | undefined;
    /**
     * The service tier at which the request was processed: standard or priority.
     */
    serviceTier?: string | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const UsageInfo$inboundSchema: z.ZodType<UsageInfo, unknown>;
/** @internal */
export type UsageInfo$Outbound = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_audio_seconds?: number | null | undefined;
    service_tier?: string | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const UsageInfo$outboundSchema: z.ZodType<UsageInfo$Outbound, UsageInfo>;
export declare function usageInfoToJSON(usageInfo: UsageInfo): string;
export declare function usageInfoFromJSON(jsonString: string): SafeParseResult<UsageInfo, SDKValidationError>;
//# sourceMappingURL=usageinfo.d.ts.map