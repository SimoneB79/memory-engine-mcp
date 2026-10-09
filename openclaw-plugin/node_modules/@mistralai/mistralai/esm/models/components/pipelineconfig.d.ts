import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PipelineConfigDefinition } from "./pipelineconfigdefinition.js";
import { PipelineConfigScope } from "./pipelineconfigscope.js";
import { PipelineConfigSelector } from "./pipelineconfigselector.js";
import { PipelineKind } from "./pipelinekind.js";
export type PipelineConfig = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    scope: PipelineConfigScope;
    workspaceId: string;
    name: string;
    description?: string | null | undefined;
    slug?: string | null | undefined;
    group?: string | null | undefined;
    pipelineKind: PipelineKind;
    selectors: Array<PipelineConfigSelector>;
    enabled: boolean;
    definitionHash: string;
    definition: PipelineConfigDefinition;
};
/** @internal */
export declare const PipelineConfig$inboundSchema: z.ZodType<PipelineConfig, unknown>;
export declare function pipelineConfigFromJSON(jsonString: string): SafeParseResult<PipelineConfig, SDKValidationError>;
//# sourceMappingURL=pipelineconfig.d.ts.map