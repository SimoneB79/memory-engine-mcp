import * as z from "zod/v4";
import * as components from "../components/index.js";
export type MetricsData = components.UpdateMetricsRequestDeploymentMetricsOnline | components.UpdateMetricsRequestDeploymentMetricsOffline;
export type UpdateIndexMetricsV1RagDeploymentsDeploymentIdMetricsPutRequest = {
    deploymentId: string;
    requestBody: components.UpdateMetricsRequestDeploymentMetricsOnline | components.UpdateMetricsRequestDeploymentMetricsOffline;
};
/** @internal */
export type MetricsData$Outbound = components.UpdateMetricsRequestDeploymentMetricsOnline$Outbound | components.UpdateMetricsRequestDeploymentMetricsOffline$Outbound;
/** @internal */
export declare const MetricsData$outboundSchema: z.ZodType<MetricsData$Outbound, MetricsData>;
export declare function metricsDataToJSON(metricsData: MetricsData): string;
/** @internal */
export type UpdateIndexMetricsV1RagDeploymentsDeploymentIdMetricsPutRequest$Outbound = {
    deployment_id: string;
    RequestBody: components.UpdateMetricsRequestDeploymentMetricsOnline$Outbound | components.UpdateMetricsRequestDeploymentMetricsOffline$Outbound;
};
/** @internal */
export declare const UpdateIndexMetricsV1RagDeploymentsDeploymentIdMetricsPutRequest$outboundSchema: z.ZodType<UpdateIndexMetricsV1RagDeploymentsDeploymentIdMetricsPutRequest$Outbound, UpdateIndexMetricsV1RagDeploymentsDeploymentIdMetricsPutRequest>;
export declare function updateIndexMetricsV1RagDeploymentsDeploymentIdMetricsPutRequestToJSON(updateIndexMetricsV1RagDeploymentsDeploymentIdMetricsPutRequest: UpdateIndexMetricsV1RagDeploymentsDeploymentIdMetricsPutRequest): string;
//# sourceMappingURL=updateindexmetricsv1ragdeploymentsdeploymentidmetricsput.d.ts.map