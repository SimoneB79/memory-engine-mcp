import * as z from "zod/v4";
import { UpdateMetricsRequestIndexMetrics, UpdateMetricsRequestIndexMetrics$Outbound } from "./updatemetricsrequestindexmetrics.js";
export type UpdateMetricsRequestDeploymentMetricsOnline = {
    status: "online";
    documentCount: number;
    indexMetrics: Array<UpdateMetricsRequestIndexMetrics>;
};
/** @internal */
export type UpdateMetricsRequestDeploymentMetricsOnline$Outbound = {
    status: "online";
    document_count: number;
    index_metrics: Array<UpdateMetricsRequestIndexMetrics$Outbound>;
};
/** @internal */
export declare const UpdateMetricsRequestDeploymentMetricsOnline$outboundSchema: z.ZodType<UpdateMetricsRequestDeploymentMetricsOnline$Outbound, UpdateMetricsRequestDeploymentMetricsOnline>;
export declare function updateMetricsRequestDeploymentMetricsOnlineToJSON(updateMetricsRequestDeploymentMetricsOnline: UpdateMetricsRequestDeploymentMetricsOnline): string;
//# sourceMappingURL=updatemetricsrequestdeploymentmetricsonline.d.ts.map