import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
import * as components from "../components/index.js";
export declare const JobsApiRoutesBatchGetBatchJobsOrderBy: {
    readonly Created: "created";
    readonly MinusCreated: "-created";
};
export type JobsApiRoutesBatchGetBatchJobsOrderBy = ClosedEnum<typeof JobsApiRoutesBatchGetBatchJobsOrderBy>;
export type JobsApiRoutesBatchGetBatchJobsRequest = {
    page?: number | undefined;
    pageSize?: number | undefined;
    model?: string | null | undefined;
    agentId?: string | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    createdAfter?: Date | null | undefined;
    createdByMe?: boolean | undefined;
    status?: Array<components.BatchJobStatus> | null | undefined;
    orderBy?: JobsApiRoutesBatchGetBatchJobsOrderBy | undefined;
};
/** @internal */
export declare const JobsApiRoutesBatchGetBatchJobsOrderBy$outboundSchema: z.ZodEnum<typeof JobsApiRoutesBatchGetBatchJobsOrderBy>;
/** @internal */
export type JobsApiRoutesBatchGetBatchJobsRequest$Outbound = {
    page: number;
    page_size: number;
    model?: string | null | undefined;
    agent_id?: string | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    created_after?: string | null | undefined;
    created_by_me: boolean;
    status?: Array<string> | null | undefined;
    order_by: string;
};
/** @internal */
export declare const JobsApiRoutesBatchGetBatchJobsRequest$outboundSchema: z.ZodType<JobsApiRoutesBatchGetBatchJobsRequest$Outbound, JobsApiRoutesBatchGetBatchJobsRequest>;
export declare function jobsApiRoutesBatchGetBatchJobsRequestToJSON(jobsApiRoutesBatchGetBatchJobsRequest: JobsApiRoutesBatchGetBatchJobsRequest): string;
//# sourceMappingURL=jobsapiroutesbatchgetbatchjobs.d.ts.map