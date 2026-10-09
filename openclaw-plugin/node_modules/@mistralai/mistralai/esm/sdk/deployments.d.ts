import { EventStream } from "../lib/event-streams.js";
import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Deployments extends ClientSDK {
    /**
     * List Deployments
     */
    listDeployments(request?: operations.ListDeploymentsV1WorkflowsDeploymentsGetRequest | undefined, options?: RequestOptions): Promise<components.DeploymentListResponse>;
    /**
     * Create Deployment
     */
    createDeployment(request: components.CreateDeploymentRequest, options?: RequestOptions): Promise<components.ManagedDeploymentResponse>;
    /**
     * Update Deployment
     */
    updateDeployment(request: operations.UpdateDeploymentV1WorkflowsDeploymentsNamePatchRequest, options?: RequestOptions): Promise<components.ManagedDeploymentResponse>;
    /**
     * Delete Deployment
     */
    deleteDeployment(request: operations.DeleteDeploymentV1WorkflowsDeploymentsNameDeleteRequest, options?: RequestOptions): Promise<components.ManagedDeploymentResponse>;
    /**
     * Get Deployment
     */
    getDeployment(request: operations.GetDeploymentV1WorkflowsDeploymentsNameGetRequest, options?: RequestOptions): Promise<components.DeploymentDetailResponse>;
    /**
     * Stop Deployment
     */
    stopDeployment(request: operations.StopDeploymentV1WorkflowsDeploymentsNameStopPostRequest, options?: RequestOptions): Promise<components.ManagedDeploymentResponse>;
    /**
     * Start Deployment
     */
    startDeployment(request: operations.StartDeploymentV1WorkflowsDeploymentsNameStartPostRequest, options?: RequestOptions): Promise<components.ManagedDeploymentResponse>;
    /**
     * Restart Deployment
     */
    restartDeployment(request: operations.RestartDeploymentV1WorkflowsDeploymentsNameRestartPostRequest, options?: RequestOptions): Promise<components.ManagedDeploymentResponse>;
    /**
     * List Deployment Workers
     */
    listDeploymentWorkers(request: operations.ListDeploymentWorkersV1WorkflowsDeploymentsNameWorkersGetRequest, options?: RequestOptions): Promise<components.DeploymentWorkerListResponse>;
    /**
     * Get Deployment Logs
     *
     * @remarks
     * Retrieve logs for a deployment (across all of its workers).
     *
     * Use `after`/`before`/`order` on the first request to set the time range and sort order; for
     * the next pages pass the `cursor` from the previous response (it remembers the range and order).
     */
    getDeploymentLogs(request: operations.GetDeploymentLogsRequest, options?: RequestOptions): Promise<components.DeploymentLogSearchResponse>;
    /**
     * Stream Deployment Logs
     *
     * @remarks
     * Stream logs for a deployment (all of its workers) via SSE.
     *
     * Resume cursor comes from the `Last-Event-ID` header or `last_event_id` query param (header wins)
     * and takes precedence over `after`; omit all to tail from the deployment start.
     */
    streamDeploymentLogs(request: operations.StreamDeploymentLogsRequest, options?: RequestOptions): Promise<EventStream<operations.StreamDeploymentLogsResponseBody>>;
}
//# sourceMappingURL=deployments.d.ts.map