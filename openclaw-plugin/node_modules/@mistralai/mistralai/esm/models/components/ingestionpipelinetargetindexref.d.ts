import * as z from "zod/v4";
export type IngestionPipelineTargetIndexRef = {
    type?: "vespa" | undefined;
    name: string;
};
/** @internal */
export type IngestionPipelineTargetIndexRef$Outbound = {
    type: "vespa";
    name: string;
};
/** @internal */
export declare const IngestionPipelineTargetIndexRef$outboundSchema: z.ZodType<IngestionPipelineTargetIndexRef$Outbound, IngestionPipelineTargetIndexRef>;
export declare function ingestionPipelineTargetIndexRefToJSON(ingestionPipelineTargetIndexRef: IngestionPipelineTargetIndexRef): string;
//# sourceMappingURL=ingestionpipelinetargetindexref.d.ts.map