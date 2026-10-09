import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
/**
 * First-page sort order: 'asc' (oldest first) or 'desc'. Ignored when `cursor` is set.
 */
export declare const GetDeploymentLogsOrder: {
    readonly Asc: "asc";
    readonly Desc: "desc";
};
/**
 * First-page sort order: 'asc' (oldest first) or 'desc'. Ignored when `cursor` is set.
 */
export type GetDeploymentLogsOrder = ClosedEnum<typeof GetDeploymentLogsOrder>;
export type GetDeploymentLogsRequest = {
    name: string;
    /**
     * Filter logs by worker name
     */
    workerName?: string | null | undefined;
    /**
     * Filter logs by workflow name
     */
    workflowName?: string | null | undefined;
    /**
     * Only return logs at or after this timestamp
     */
    after?: Date | null | undefined;
    /**
     * Only return logs before this timestamp
     */
    before?: Date | null | undefined;
    /**
     * First-page sort order: 'asc' (oldest first) or 'desc'. Ignored when `cursor` is set.
     */
    order?: GetDeploymentLogsOrder | undefined;
    /**
     * Pagination cursor from a previous response's `next_cursor`; carries the window and order
     */
    cursor?: string | null | undefined;
    /**
     * Maximum number of logs to return
     */
    limit?: number | undefined;
};
/** @internal */
export declare const GetDeploymentLogsOrder$outboundSchema: z.ZodEnum<typeof GetDeploymentLogsOrder>;
/** @internal */
export type GetDeploymentLogsRequest$Outbound = {
    name: string;
    worker_name?: string | null | undefined;
    workflow_name?: string | null | undefined;
    after?: string | null | undefined;
    before?: string | null | undefined;
    order: string;
    cursor?: string | null | undefined;
    limit: number;
};
/** @internal */
export declare const GetDeploymentLogsRequest$outboundSchema: z.ZodType<GetDeploymentLogsRequest$Outbound, GetDeploymentLogsRequest>;
export declare function getDeploymentLogsRequestToJSON(getDeploymentLogsRequest: GetDeploymentLogsRequest): string;
//# sourceMappingURL=getdeploymentlogs.d.ts.map