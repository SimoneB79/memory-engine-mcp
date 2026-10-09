import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const PipelineKind: {
    readonly Detection: "detection";
    readonly Moderation: "moderation";
    readonly Judge: "judge";
    readonly Export: "export";
};
export type PipelineKind = OpenEnum<typeof PipelineKind>;
/** @internal */
export declare const PipelineKind$inboundSchema: z.ZodType<PipelineKind, unknown>;
/** @internal */
export declare const PipelineKind$outboundSchema: z.ZodType<string, PipelineKind>;
//# sourceMappingURL=pipelinekind.d.ts.map