import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { SourceKind } from "./sourcekind.js";
export type PipelineConfigSelector = {
    sourceKind: SourceKind;
    filter?: string | null | undefined;
};
/** @internal */
export declare const PipelineConfigSelector$inboundSchema: z.ZodType<PipelineConfigSelector, unknown>;
/** @internal */
export type PipelineConfigSelector$Outbound = {
    source_kind: string;
    filter?: string | null | undefined;
};
/** @internal */
export declare const PipelineConfigSelector$outboundSchema: z.ZodType<PipelineConfigSelector$Outbound, PipelineConfigSelector>;
export declare function pipelineConfigSelectorToJSON(pipelineConfigSelector: PipelineConfigSelector): string;
export declare function pipelineConfigSelectorFromJSON(jsonString: string): SafeParseResult<PipelineConfigSelector, SDKValidationError>;
//# sourceMappingURL=pipelineconfigselector.d.ts.map