import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
/**
 * Filter by worker activity. active=only active, inactive=only inactive, None=no filter
 */
export declare const WorkerStatus: {
    readonly Active: "active";
    readonly Inactive: "inactive";
};
/**
 * Filter by worker activity. active=only active, inactive=only inactive, None=no filter
 */
export type WorkerStatus = ClosedEnum<typeof WorkerStatus>;
export type ListDeploymentWorkersV1WorkflowsDeploymentsNameWorkersGetRequest = {
    name: string;
    /**
     * Filter by worker activity. active=only active, inactive=only inactive, None=no filter
     */
    workerStatus?: WorkerStatus | null | undefined;
    /**
     * Maximum number of workers to return
     */
    limit?: number | undefined;
    /**
     * Cursor from a previous response's `next_cursor`. Resend `worker_status` unchanged alongside it.
     */
    cursor?: string | null | undefined;
};
/** @internal */
export declare const WorkerStatus$outboundSchema: z.ZodEnum<typeof WorkerStatus>;
/** @internal */
export type ListDeploymentWorkersV1WorkflowsDeploymentsNameWorkersGetRequest$Outbound = {
    name: string;
    worker_status?: string | null | undefined;
    limit: number;
    cursor?: string | null | undefined;
};
/** @internal */
export declare const ListDeploymentWorkersV1WorkflowsDeploymentsNameWorkersGetRequest$outboundSchema: z.ZodType<ListDeploymentWorkersV1WorkflowsDeploymentsNameWorkersGetRequest$Outbound, ListDeploymentWorkersV1WorkflowsDeploymentsNameWorkersGetRequest>;
export declare function listDeploymentWorkersV1WorkflowsDeploymentsNameWorkersGetRequestToJSON(listDeploymentWorkersV1WorkflowsDeploymentsNameWorkersGetRequest: ListDeploymentWorkersV1WorkflowsDeploymentsNameWorkersGetRequest): string;
//# sourceMappingURL=listdeploymentworkersv1workflowsdeploymentsnameworkersget.d.ts.map