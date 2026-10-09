import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class SearchIndexes extends ClientSDK {
    /**
     * Get Deployment Summaries
     *
     * @remarks
     * Fetch all indexes available to a user
     */
    getDeploymentSummaries(options?: RequestOptions): Promise<components.GetDeploymentSummariesResponse>;
    /**
     * Register (or re-register) a search index
     */
    registerDeployment(request: components.RegisterDeploymentRequestDeployment, options?: RequestOptions): Promise<components.RegisterSearchIndexResponseIndex>;
    /**
     * Unregister Deployment
     *
     * @remarks
     * Delete all information about a deployment
     */
    unregisterDeployment(request: operations.UnregisterDeploymentV1RagDeploymentsDeploymentIdDeleteRequest, options?: RequestOptions): Promise<any>;
    /**
     * Update Index Metrics
     *
     * @remarks
     * Update the metrics for a given index
     */
    updateIndexMetrics(request: operations.UpdateIndexMetricsV1RagDeploymentsDeploymentIdMetricsPutRequest, options?: RequestOptions): Promise<any>;
}
//# sourceMappingURL=searchindexes.d.ts.map