import * as z from "zod/v4";
export type UpdateMetricsRequestDeploymentMetricsOffline = {
    status: "offline";
    clearMetrics?: boolean | undefined;
};
/** @internal */
export type UpdateMetricsRequestDeploymentMetricsOffline$Outbound = {
    status: "offline";
    clear_metrics: boolean;
};
/** @internal */
export declare const UpdateMetricsRequestDeploymentMetricsOffline$outboundSchema: z.ZodType<UpdateMetricsRequestDeploymentMetricsOffline$Outbound, UpdateMetricsRequestDeploymentMetricsOffline>;
export declare function updateMetricsRequestDeploymentMetricsOfflineToJSON(updateMetricsRequestDeploymentMetricsOffline: UpdateMetricsRequestDeploymentMetricsOffline): string;
//# sourceMappingURL=updatemetricsrequestdeploymentmetricsoffline.d.ts.map