import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type PipelineConfigHeader = {
    value?: string | null | undefined;
};
/** @internal */
export declare const PipelineConfigHeader$inboundSchema: z.ZodType<PipelineConfigHeader, unknown>;
/** @internal */
export type PipelineConfigHeader$Outbound = {
    value?: string | null | undefined;
};
/** @internal */
export declare const PipelineConfigHeader$outboundSchema: z.ZodType<PipelineConfigHeader$Outbound, PipelineConfigHeader>;
export declare function pipelineConfigHeaderToJSON(pipelineConfigHeader: PipelineConfigHeader): string;
export declare function pipelineConfigHeaderFromJSON(jsonString: string): SafeParseResult<PipelineConfigHeader, SDKValidationError>;
//# sourceMappingURL=pipelineconfigheader.d.ts.map