import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
import * as components from "../components/index.js";
/**
 * Field to sort by. When omitted, active and managed deployments are grouped first, then sorted by created_at. When set, results are sorted purely by the specified field with no grouping.
 */
export declare const ListDeploymentsV1WorkflowsDeploymentsGetOrderBy: {
    readonly UpdatedAt: "updated_at";
    readonly CreatedAt: "created_at";
};
/**
 * Field to sort by. When omitted, active and managed deployments are grouped first, then sorted by created_at. When set, results are sorted purely by the specified field with no grouping.
 */
export type ListDeploymentsV1WorkflowsDeploymentsGetOrderBy = ClosedEnum<typeof ListDeploymentsV1WorkflowsDeploymentsGetOrderBy>;
/**
 * Sort direction. Applied to order_by when set, or within each activity group when omitted.
 */
export declare const ListDeploymentsV1WorkflowsDeploymentsGetOrder: {
    readonly Asc: "asc";
    readonly Desc: "desc";
};
/**
 * Sort direction. Applied to order_by when set, or within each activity group when omitted.
 */
export type ListDeploymentsV1WorkflowsDeploymentsGetOrder = ClosedEnum<typeof ListDeploymentsV1WorkflowsDeploymentsGetOrder>;
export type ListDeploymentsV1WorkflowsDeploymentsGetRequest = {
    activeOnly?: boolean | undefined;
    /**
     * Filter deployments by hardened status
     */
    isHardened?: boolean | null | undefined;
    workflowName?: string | null | undefined;
    /**
     * Filter deployments by creator's user id
     */
    createdBy?: string | null | undefined;
    /**
     * Filter deployments with at least one worker on any of these location types (OR)
     */
    locationTypes?: Array<components.LocationType> | null | undefined;
    /**
     * Filter deployments by name or ID prefix
     */
    search?: string | null | undefined;
    /**
     * Field to sort by. When omitted, active and managed deployments are grouped first, then sorted by created_at. When set, results are sorted purely by the specified field with no grouping.
     */
    orderBy?: ListDeploymentsV1WorkflowsDeploymentsGetOrderBy | null | undefined;
    /**
     * Sort direction. Applied to order_by when set, or within each activity group when omitted.
     */
    order?: ListDeploymentsV1WorkflowsDeploymentsGetOrder | undefined;
    /**
     * Maximum number of deployments to return
     */
    limit?: number | null | undefined;
    /**
     * Cursor from a previous response for pagination
     */
    cursor?: string | null | undefined;
    /**
     * Workspace ID to scope the request to. Defaults to the caller's context.
     */
    workspaceId?: string | null | undefined;
};
/** @internal */
export declare const ListDeploymentsV1WorkflowsDeploymentsGetOrderBy$outboundSchema: z.ZodEnum<typeof ListDeploymentsV1WorkflowsDeploymentsGetOrderBy>;
/** @internal */
export declare const ListDeploymentsV1WorkflowsDeploymentsGetOrder$outboundSchema: z.ZodEnum<typeof ListDeploymentsV1WorkflowsDeploymentsGetOrder>;
/** @internal */
export type ListDeploymentsV1WorkflowsDeploymentsGetRequest$Outbound = {
    active_only: boolean;
    is_hardened?: boolean | null | undefined;
    workflow_name?: string | null | undefined;
    created_by?: string | null | undefined;
    location_types?: Array<string> | null | undefined;
    search?: string | null | undefined;
    order_by?: string | null | undefined;
    order: string;
    limit?: number | null | undefined;
    cursor?: string | null | undefined;
    workspace_id?: string | null | undefined;
};
/** @internal */
export declare const ListDeploymentsV1WorkflowsDeploymentsGetRequest$outboundSchema: z.ZodType<ListDeploymentsV1WorkflowsDeploymentsGetRequest$Outbound, ListDeploymentsV1WorkflowsDeploymentsGetRequest>;
export declare function listDeploymentsV1WorkflowsDeploymentsGetRequestToJSON(listDeploymentsV1WorkflowsDeploymentsGetRequest: ListDeploymentsV1WorkflowsDeploymentsGetRequest): string;
//# sourceMappingURL=listdeploymentsv1workflowsdeploymentsget.d.ts.map