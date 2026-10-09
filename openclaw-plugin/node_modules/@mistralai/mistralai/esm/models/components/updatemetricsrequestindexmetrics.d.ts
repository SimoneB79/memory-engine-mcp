import * as z from "zod/v4";
export type UpdateMetricsRequestIndexMetrics = {
    name: string;
    documentCount: number;
};
/** @internal */
export type UpdateMetricsRequestIndexMetrics$Outbound = {
    name: string;
    document_count: number;
};
/** @internal */
export declare const UpdateMetricsRequestIndexMetrics$outboundSchema: z.ZodType<UpdateMetricsRequestIndexMetrics$Outbound, UpdateMetricsRequestIndexMetrics>;
export declare function updateMetricsRequestIndexMetricsToJSON(updateMetricsRequestIndexMetrics: UpdateMetricsRequestIndexMetrics): string;
//# sourceMappingURL=updatemetricsrequestindexmetrics.d.ts.map