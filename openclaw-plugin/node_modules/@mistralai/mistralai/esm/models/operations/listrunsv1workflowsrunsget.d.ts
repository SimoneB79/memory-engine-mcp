import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Filter by workflow status
 */
export type ListRunsV1WorkflowsRunsGetStatus = components.WorkflowExecutionStatus | Array<components.WorkflowExecutionStatus>;
/**
 * Field to sort by
 */
export declare const SortBy: {
    readonly StartTime: "start_time";
    readonly EndTime: "end_time";
};
/**
 * Field to sort by
 */
export type SortBy = ClosedEnum<typeof SortBy>;
/**
 * Sort direction
 */
export declare const ListRunsV1WorkflowsRunsGetOrder: {
    readonly Asc: "asc";
    readonly Desc: "desc";
};
/**
 * Sort direction
 */
export type ListRunsV1WorkflowsRunsGetOrder = ClosedEnum<typeof ListRunsV1WorkflowsRunsGetOrder>;
export type ListRunsV1WorkflowsRunsGetRequest = {
    /**
     * Filter by workflow name or id
     */
    workflowIdentifier?: string | null | undefined;
    /**
     * Filter by root execution id; returns the whole execution tree (the root and all its descendant sub-workflows).
     */
    rootExecutionId?: string | null | undefined;
    /**
     * Search by workflow name, display name, or ID
     */
    search?: string | null | undefined;
    /**
     * Filter by workflow status
     */
    status?: components.WorkflowExecutionStatus | Array<components.WorkflowExecutionStatus> | null | undefined;
    /**
     * Filter by deployment name
     */
    deploymentName?: string | null | undefined;
    /**
     * Field to sort by
     */
    sortBy?: SortBy | null | undefined;
    /**
     * Sort direction
     */
    order?: ListRunsV1WorkflowsRunsGetOrder | undefined;
    /**
     * Include runs with start_time >= value
     */
    startTimeAfter?: Date | null | undefined;
    /**
     * Include runs with start_time <= value
     */
    startTimeBefore?: Date | null | undefined;
    /**
     * Include runs with end_time >= value. Running executions (no end_time) are excluded; use the status filter to include them.
     */
    endTimeAfter?: Date | null | undefined;
    /**
     * Include runs with end_time <= value. Running executions (no end_time) are excluded; use the status filter to include them.
     */
    endTimeBefore?: Date | null | undefined;
    /**
     * Filter by user id. Use 'current' to filter by the authenticated user
     */
    userId?: string | null | undefined;
    /**
     * Filter to runs of workflows tagged with all listed tags (AND).
     */
    workflowTags?: Array<string> | null | undefined;
    /**
     * Include runs of internal/technical workflows (e.g. parallel-execution)
     */
    includeInternal?: boolean | undefined;
    /**
     * Number of items per page
     */
    pageSize?: number | undefined;
    /**
     * Token for the next page of results
     */
    nextPageToken?: string | null | undefined;
    /**
     * Filter executions by search key as repeated 'key:value' entries. Each entry matches an exact key and a similar value; multiple entries are AND'd together (max 3).
     */
    searchKey?: Array<string> | null | undefined;
};
export type ListRunsV1WorkflowsRunsGetResponse = {
    result: components.WorkflowExecutionListResponse;
};
/** @internal */
export type ListRunsV1WorkflowsRunsGetStatus$Outbound = string | Array<string>;
/** @internal */
export declare const ListRunsV1WorkflowsRunsGetStatus$outboundSchema: z.ZodType<ListRunsV1WorkflowsRunsGetStatus$Outbound, ListRunsV1WorkflowsRunsGetStatus>;
export declare function listRunsV1WorkflowsRunsGetStatusToJSON(listRunsV1WorkflowsRunsGetStatus: ListRunsV1WorkflowsRunsGetStatus): string;
/** @internal */
export declare const SortBy$outboundSchema: z.ZodEnum<typeof SortBy>;
/** @internal */
export declare const ListRunsV1WorkflowsRunsGetOrder$outboundSchema: z.ZodEnum<typeof ListRunsV1WorkflowsRunsGetOrder>;
/** @internal */
export type ListRunsV1WorkflowsRunsGetRequest$Outbound = {
    workflow_identifier?: string | null | undefined;
    root_execution_id?: string | null | undefined;
    search?: string | null | undefined;
    status?: string | Array<string> | null | undefined;
    deployment_name?: string | null | undefined;
    sort_by?: string | null | undefined;
    order: string;
    start_time_after?: string | null | undefined;
    start_time_before?: string | null | undefined;
    end_time_after?: string | null | undefined;
    end_time_before?: string | null | undefined;
    user_id?: string | null | undefined;
    workflow_tags?: Array<string> | null | undefined;
    include_internal: boolean;
    page_size: number;
    next_page_token?: string | null | undefined;
    search_key?: Array<string> | null | undefined;
};
/** @internal */
export declare const ListRunsV1WorkflowsRunsGetRequest$outboundSchema: z.ZodType<ListRunsV1WorkflowsRunsGetRequest$Outbound, ListRunsV1WorkflowsRunsGetRequest>;
export declare function listRunsV1WorkflowsRunsGetRequestToJSON(listRunsV1WorkflowsRunsGetRequest: ListRunsV1WorkflowsRunsGetRequest): string;
/** @internal */
export declare const ListRunsV1WorkflowsRunsGetResponse$inboundSchema: z.ZodType<ListRunsV1WorkflowsRunsGetResponse, unknown>;
export declare function listRunsV1WorkflowsRunsGetResponseFromJSON(jsonString: string): SafeParseResult<ListRunsV1WorkflowsRunsGetResponse, SDKValidationError>;
//# sourceMappingURL=listrunsv1workflowsrunsget.d.ts.map