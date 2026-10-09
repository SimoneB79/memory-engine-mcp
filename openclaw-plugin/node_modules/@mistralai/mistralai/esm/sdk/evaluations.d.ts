import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Evaluations extends ClientSDK {
    /**
     * Create a worker pipeline configuration
     */
    createPipelineConfig(request: components.CreatePipelineConfigRequest, options?: RequestOptions): Promise<components.PipelineConfig>;
    /**
     * List worker pipeline configurations
     */
    listPipelineConfigs(request?: operations.ListPipelineConfigsV1ObservabilityPipelineConfigsGetRequest | undefined, options?: RequestOptions): Promise<components.PipelineConfigsResponse>;
    /**
     * Get a worker pipeline configuration
     */
    getPipelineConfig(request: operations.GetPipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdGetRequest, options?: RequestOptions): Promise<components.PipelineConfig>;
    /**
     * Replace a worker pipeline configuration
     */
    updatePipelineConfig(request: operations.UpdatePipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdPutRequest, options?: RequestOptions): Promise<components.PipelineConfig>;
    /**
     * Delete a worker pipeline configuration
     */
    deletePipelineConfig(request: operations.DeletePipelineConfigV1ObservabilityPipelineConfigsPipelineConfigIdDeleteRequest, options?: RequestOptions): Promise<void>;
}
//# sourceMappingURL=evaluations.d.ts.map