import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ModerationDefinition = {
    model?: string | undefined;
    targetAttributes?: Array<string> | undefined;
};
/** @internal */
export declare const ModerationDefinition$inboundSchema: z.ZodType<ModerationDefinition, unknown>;
/** @internal */
export type ModerationDefinition$Outbound = {
    model: string;
    target_attributes?: Array<string> | undefined;
};
/** @internal */
export declare const ModerationDefinition$outboundSchema: z.ZodType<ModerationDefinition$Outbound, ModerationDefinition>;
export declare function moderationDefinitionToJSON(moderationDefinition: ModerationDefinition): string;
export declare function moderationDefinitionFromJSON(jsonString: string): SafeParseResult<ModerationDefinition, SDKValidationError>;
//# sourceMappingURL=moderationdefinition.d.ts.map