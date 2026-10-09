import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type MetricValue = number | number;
export type AggregationRow = {
    timeBucket?: Date | null | undefined;
    dimensions?: {
        [k: string]: any;
    } | undefined;
    metricName: string;
    metricValue?: number | number | null | undefined;
};
/** @internal */
export declare const MetricValue$inboundSchema: z.ZodType<MetricValue, unknown>;
export declare function metricValueFromJSON(jsonString: string): SafeParseResult<MetricValue, SDKValidationError>;
/** @internal */
export declare const AggregationRow$inboundSchema: z.ZodType<AggregationRow, unknown>;
export declare function aggregationRowFromJSON(jsonString: string): SafeParseResult<AggregationRow, SDKValidationError>;
//# sourceMappingURL=aggregationrow.d.ts.map