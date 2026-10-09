import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type DeletePromptResponse = {};
/** @internal */
export declare const DeletePromptResponse$inboundSchema: z.ZodType<DeletePromptResponse, unknown>;
export declare function deletePromptResponseFromJSON(jsonString: string): SafeParseResult<DeletePromptResponse, SDKValidationError>;
//# sourceMappingURL=deletepromptresponse.d.ts.map