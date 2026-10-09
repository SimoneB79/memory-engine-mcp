import * as z from "zod/v4";
import { PipelineConfigDefinition, PipelineConfigDefinition$Outbound } from "./pipelineconfigdefinition.js";
import { PipelineConfigSelector, PipelineConfigSelector$Outbound } from "./pipelineconfigselector.js";
import { PipelineKind } from "./pipelinekind.js";
export type CreatePipelineConfigRequest = {
    pipelineKind: PipelineKind;
    description?: string | null | undefined;
    selectors: Array<PipelineConfigSelector>;
    slug?: string | null | undefined;
    group?: string | null | undefined;
    definition: PipelineConfigDefinition;
    name: string;
    enabled?: boolean | undefined;
};
/** @internal */
export type CreatePipelineConfigRequest$Outbound = {
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
export declare const CreatePipelineConfigRequest$outboundSchema: z.ZodType<CreatePipelineConfigRequest$Outbound, CreatePipelineConfigRequest>;
export declare function createPipelineConfigRequestToJSON(createPipelineConfigRequest: CreatePipelineConfigRequest): string;
//# sourceMappingURL=createpipelineconfigrequest.d.ts.map