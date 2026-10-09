import * as z from "zod/v4";
import * as components from "../components/index.js";
export type AggregateTracesV1ObservabilityTracesAggregatePostRequest = {
    from?: Date | null | undefined;
    to?: Date | null | undefined;
    aggregationRequest: components.AggregationRequest;
};
/** @internal */
export type AggregateTracesV1ObservabilityTracesAggregatePostRequest$Outbound = {
    from?: string | null | undefined;
    to?: string | null | undefined;
    AggregationRequest: components.AggregationRequest$Outbound;
};
/** @internal */
export declare const AggregateTracesV1ObservabilityTracesAggregatePostRequest$outboundSchema: z.ZodType<AggregateTracesV1ObservabilityTracesAggregatePostRequest$Outbound, AggregateTracesV1ObservabilityTracesAggregatePostRequest>;
export declare function aggregateTracesV1ObservabilityTracesAggregatePostRequestToJSON(aggregateTracesV1ObservabilityTracesAggregatePostRequest: AggregateTracesV1ObservabilityTracesAggregatePostRequest): string;
//# sourceMappingURL=aggregatetracesv1observabilitytracesaggregatepost.d.ts.map