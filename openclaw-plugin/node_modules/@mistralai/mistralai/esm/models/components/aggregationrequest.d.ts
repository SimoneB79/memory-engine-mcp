import * as z from "zod/v4";
import { MetricDefinition, MetricDefinition$Outbound } from "./metricdefinition.js";
import { OrderByClause, OrderByClause$Outbound } from "./orderbyclause.js";
import { TimeDimension, TimeDimension$Outbound } from "./timedimension.js";
export type AggregationRequest = {
    metric: MetricDefinition;
    dimensions?: Array<string> | undefined;
    timeDimension?: TimeDimension | null | undefined;
    searchExpression?: string | null | undefined;
    orderBy?: Array<OrderByClause> | null | undefined;
    limit?: number | undefined;
};
/** @internal */
export type AggregationRequest$Outbound = {
    metric: MetricDefinition$Outbound;
    dimensions?: Array<string> | undefined;
    time_dimension?: TimeDimension$Outbound | null | undefined;
    search_expression?: string | null | undefined;
    order_by?: Array<OrderByClause$Outbound> | null | undefined;
    limit: number;
};
/** @internal */
export declare const AggregationRequest$outboundSchema: z.ZodType<AggregationRequest$Outbound, AggregationRequest>;
export declare function aggregationRequestToJSON(aggregationRequest: AggregationRequest): string;
//# sourceMappingURL=aggregationrequest.d.ts.map