import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PipelineConfig } from "./pipelineconfig.js";
export type PaginatedResultPipelineConfig = {
    results?: Array<PipelineConfig> | undefined;
    count: number;
    next?: string | null | undefined;
    previous?: string | null | undefined;
};
/** @internal */
export declare const PaginatedResultPipelineConfig$inboundSchema: z.ZodType<PaginatedResultPipelineConfig, unknown>;
export declare function paginatedResultPipelineConfigFromJSON(jsonString: string): SafeParseResult<PaginatedResultPipelineConfig, SDKValidationError>;
//# sourceMappingURL=paginatedresultpipelineconfig.d.ts.map