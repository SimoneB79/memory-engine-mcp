import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ListPipelineConfigsV1ObservabilityPipelineConfigsGetRequest = {
    pipelineKind?: components.PipelineKind | null | undefined;
    group?: string | null | undefined;
    enabled?: boolean | null | undefined;
    pageSize?: number | undefined;
    page?: number | undefined;
    q?: string | null | undefined;
};
/** @internal */
export type ListPipelineConfigsV1ObservabilityPipelineConfigsGetRequest$Outbound = {
    pipeline_kind?: string | null | undefined;
    group?: string | null | undefined;
    enabled?: boolean | null | undefined;
    page_size: number;
    page: number;
    q?: string | null | undefined;
};
/** @internal */
export declare const ListPipelineConfigsV1ObservabilityPipelineConfigsGetRequest$outboundSchema: z.ZodType<ListPipelineConfigsV1ObservabilityPipelineConfigsGetRequest$Outbound, ListPipelineConfigsV1ObservabilityPipelineConfigsGetRequest>;
export declare function listPipelineConfigsV1ObservabilityPipelineConfigsGetRequestToJSON(listPipelineConfigsV1ObservabilityPipelineConfigsGetRequest: ListPipelineConfigsV1ObservabilityPipelineConfigsGetRequest): string;
//# sourceMappingURL=listpipelineconfigsv1observabilitypipelineconfigsget.d.ts.map