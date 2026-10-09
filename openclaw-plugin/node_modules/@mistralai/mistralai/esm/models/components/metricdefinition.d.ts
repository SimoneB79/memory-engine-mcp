import * as z from "zod/v4";
import { MetricAggregation } from "./metricaggregation.js";
export type MetricDefinition = {
    measure: string;
    aggregation: MetricAggregation;
};
/** @internal */
export type MetricDefinition$Outbound = {
    measure: string;
    aggregation: string;
};
/** @internal */
export declare const MetricDefinition$outboundSchema: z.ZodType<MetricDefinition$Outbound, MetricDefinition>;
export declare function metricDefinitionToJSON(metricDefinition: MetricDefinition): string;
//# sourceMappingURL=metricdefinition.d.ts.map