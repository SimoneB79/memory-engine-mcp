import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type DeleteSkillResponse = {};
/** @internal */
export declare const DeleteSkillResponse$inboundSchema: z.ZodType<DeleteSkillResponse, unknown>;
export declare function deleteSkillResponseFromJSON(jsonString: string): SafeParseResult<DeleteSkillResponse, SDKValidationError>;
//# sourceMappingURL=deleteskillresponse.d.ts.map