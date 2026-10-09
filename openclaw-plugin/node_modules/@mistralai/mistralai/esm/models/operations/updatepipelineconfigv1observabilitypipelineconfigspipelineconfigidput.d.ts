import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdatePipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdPutRequest = {
    pipelineConfigId: string;
    updatePipelineConfigRequest: components.UpdatePipelineConfigRequest;
};
/** @internal */
export type UpdatePipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdPutRequest$Outbound = {
    pipeline_config_id: string;
    UpdatePipelineConfigRequest: components.UpdatePipelineConfigRequest$Outbound;
};
/** @internal */
export declare const UpdatePipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdPutRequest$outboundSchema: z.ZodType<UpdatePipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdPutRequest$Outbound, UpdatePipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdPutRequest>;
export declare function updatePipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdPutRequestToJSON(updatePipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdPutRequest: UpdatePipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdPutRequest): string;
//# sourceMappingURL=updatepipelineconfigv1observabilitypipelineconfigspipelineconfigidput.d.ts.map