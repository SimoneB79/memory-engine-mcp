import * as z from "zod/v4";
import * as components from "../components/index.js";
export type AggregateSpansV1ObservabilitySpansAggregatePostRequest = {
    from?: Date | null | undefined;
    to?: Date | null | undefined;
    aggregationRequest: components.AggregationRequest;
};
/** @internal */
export type AggregateSpansV1ObservabilitySpansAggregatePostRequest$Outbound = {
    from?: string | null | undefined;
    to?: string | null | undefined;
    AggregationRequest: components.AggregationRequest$Outbound;
};
/** @internal */
export declare const AggregateSpansV1ObservabilitySpansAggregatePostRequest$outboundSchema: z.ZodType<AggregateSpansV1ObservabilitySpansAggregatePostRequest$Outbound, AggregateSpansV1ObservabilitySpansAggregatePostRequest>;
export declare function aggregateSpansV1ObservabilitySpansAggregatePostRequestToJSON(aggregateSpansV1ObservabilitySpansAggregatePostRequest: AggregateSpansV1ObservabilitySpansAggregatePostRequest): string;
//# sourceMappingURL=aggregatespansv1observabilityspansaggregatepost.d.ts.map