import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PaginatedResultPipelineConfig } from "./paginatedresultpipelineconfig.js";
export type PipelineConfigsResponse = {
    pipelineConfigs: PaginatedResultPipelineConfig;
};
/** @internal */
export declare const PipelineConfigsResponse$inboundSchema: z.ZodType<PipelineConfigsResponse, unknown>;
export declare function pipelineConfigsResponseFromJSON(jsonString: string): SafeParseResult<PipelineConfigsResponse, SDKValidationError>;
//# sourceMappingURL=pipelineconfigsresponse.d.ts.map