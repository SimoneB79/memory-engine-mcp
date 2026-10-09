import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AggregationMeta } from "./aggregationmeta.js";
import { AggregationRow } from "./aggregationrow.js";
export type Aggregation = {
    data: Array<AggregationRow>;
    meta: AggregationMeta;
};
/** @internal */
export declare const Aggregation$inboundSchema: z.ZodType<Aggregation, unknown>;
export declare function aggregationFromJSON(jsonString: string): SafeParseResult<Aggregation, SDKValidationError>;
//# sourceMappingURL=aggregation.d.ts.map