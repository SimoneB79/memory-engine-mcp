import * as z from "zod/v4";
export type GetPipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdGetRequest = {
    pipelineConfigId: string;
};
/** @internal */
export type GetPipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdGetRequest$Outbound = {
    pipeline_config_id: string;
};
/** @internal */
export declare const GetPipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdGetRequest$outboundSchema: z.ZodType<GetPipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdGetRequest$Outbound, GetPipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdGetRequest>;
export declare function getPipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdGetRequestToJSON(getPipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdGetRequest: GetPipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdGetRequest): string;
//# sourceMappingURL=getpipelineconfigv1observabilitypipelineconfigspipelineconfigidget.d.ts.map