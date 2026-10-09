import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const MetricAggregation: {
    readonly Count: "count";
    readonly CountDistinct: "count_distinct";
    readonly Sum: "sum";
    readonly Avg: "avg";
    readonly Min: "min";
    readonly Max: "max";
    readonly P50: "p50";
    readonly P90: "p90";
    readonly P95: "p95";
    readonly P99: "p99";
};
export type MetricAggregation = OpenEnum<typeof MetricAggregation>;
/** @internal */
export declare const MetricAggregation$inboundSchema: z.ZodType<MetricAggregation, unknown>;
/** @internal */
export declare const MetricAggregation$outboundSchema: z.ZodType<string, MetricAggregation>;
//# sourceMappingURL=metricaggregation.d.ts.map