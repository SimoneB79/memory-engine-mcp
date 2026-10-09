import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DetectionDefinition, DetectionDefinition$Outbound } from "./detectiondefinition.js";
import { ExportDefinition, ExportDefinition$Outbound } from "./exportdefinition.js";
import { JudgeDefinition, JudgeDefinition$Outbound } from "./judgedefinition.js";
import { ModerationDefinition, ModerationDefinition$Outbound } from "./moderationdefinition.js";
export type PipelineConfigDefinition = DetectionDefinition | JudgeDefinition | ExportDefinition | ModerationDefinition;
/** @internal */
export declare const PipelineConfigDefinition$inboundSchema: z.ZodType<PipelineConfigDefinition, unknown>;
/** @internal */
export type PipelineConfigDefinition$Outbound = DetectionDefinition$Outbound | JudgeDefinition$Outbound | ExportDefinition$Outbound | ModerationDefinition$Outbound;
/** @internal */
export declare const PipelineConfigDefinition$outboundSchema: z.ZodType<PipelineConfigDefinition$Outbound, PipelineConfigDefinition>;
export declare function pipelineConfigDefinitionToJSON(pipelineConfigDefinition: PipelineConfigDefinition): string;
export declare function pipelineConfigDefinitionFromJSON(jsonString: string): SafeParseResult<PipelineConfigDefinition, SDKValidationError>;
//# sourceMappingURL=pipelineconfigdefinition.d.ts.map