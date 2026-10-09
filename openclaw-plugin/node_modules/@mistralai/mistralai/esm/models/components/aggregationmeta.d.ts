import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type AggregationMeta = {
    fromTimestamp: Date;
    toTimestamp: Date;
    granularitySeconds?: number | null | undefined;
};
/** @internal */
export declare const AggregationMeta$inboundSchema: z.ZodType<AggregationMeta, unknown>;
export declare function aggregationMetaFromJSON(jsonString: string): SafeParseResult<AggregationMeta, SDKValidationError>;
//# sourceMappingURL=aggregationmeta.d.ts.map