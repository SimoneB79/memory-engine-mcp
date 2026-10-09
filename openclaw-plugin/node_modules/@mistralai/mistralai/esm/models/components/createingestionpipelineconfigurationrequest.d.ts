import * as z from "zod/v4";
import { IngestionPipelineTargetIndexRef, IngestionPipelineTargetIndexRef$Outbound } from "./ingestionpipelinetargetindexref.js";
export type CreateIngestionPipelineConfigurationRequest = {
    name: string;
    pipelineComposition?: {
        [k: string]: string;
    } | null | undefined;
    targetIndexes?: Array<IngestionPipelineTargetIndexRef> | null | undefined;
};
/** @internal */
export type CreateIngestionPipelineConfigurationRequest$Outbound = {
    name: string;
    pipeline_composition?: {
        [k: string]: string;
    } | null | undefined;
    target_indexes?: Array<IngestionPipelineTargetIndexRef$Outbound> | null | undefined;
};
/** @internal */
export declare const CreateIngestionPipelineConfigurationRequest$outboundSchema: z.ZodType<CreateIngestionPipelineConfigurationRequest$Outbound, CreateIngestionPipelineConfigurationRequest>;
export declare function createIngestionPipelineConfigurationRequestToJSON(createIngestionPipelineConfigurationRequest: CreateIngestionPipelineConfigurationRequest): string;
//# sourceMappingURL=createingestionpipelineconfigurationrequest.d.ts.map