import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const PipelineConfigScope: {
    readonly Workspace: "workspace";
    readonly Shared: "shared";
};
export type PipelineConfigScope = OpenEnum<typeof PipelineConfigScope>;
/** @internal */
export declare const PipelineConfigScope$inboundSchema: z.ZodType<PipelineConfigScope, unknown>;
//# sourceMappingURL=pipelineconfigscope.d.ts.map