import * as z from "zod/v4";
import { PipelineConfigDefinition, PipelineConfigDefinition$Outbound } from "./pipelineconfigdefinition.js";
import { PipelineConfigSelector, PipelineConfigSelector$Outbound } from "./pipelineconfigselector.js";
import { PipelineKind } from "./pipelinekind.js";
export type UpdatePipelineConfigRequest = {
    pipelineKind: PipelineKind;
    description?: string | null | undefined;
    selectors: Array<PipelineConfigSelector>;
    slug?: string | null | undefined;
    group?: string | null | undefined;
    definition: PipelineConfigDefinition;
    name: string;
    enabled: boolean;
};
/** @internal */
export type UpdatePipelineConfigRequest$Outbound = {
    pipeline_kind: string;
    description?: string | null | undefined;
    selectors: Array<PipelineConfigSelector$Outbound>;
    slug?: string | null | undefined;
    group?: string | null | undefined;
    definition: PipelineConfigDefinition$Outbound;
    name: string;
    enabled: boolean;
};
/** @internal */
export declare const UpdatePipelineConfigRequest$outboundSchema: z.ZodType<UpdatePipelineConfigRequest$Outbound, UpdatePipelineConfigRequest>;
export declare function updatePipelineConfigRequestToJSON(updatePipelineConfigRequest: UpdatePipelineConfigRequest): string;
//# sourceMappingURL=updatepipelineconfigrequest.d.ts.map