import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type CreateSkillVersionResponse = {
    version?: number | undefined;
    deduplicated?: boolean | undefined;
};
/** @internal */
export declare const CreateSkillVersionResponse$inboundSchema: z.ZodType<CreateSkillVersionResponse, unknown>;
export declare function createSkillVersionResponseFromJSON(jsonString: string): SafeParseResult<CreateSkillVersionResponse, SDKValidationError>;
//# sourceMappingURL=createskillversionresponse.d.ts.map