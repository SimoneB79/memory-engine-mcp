import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type CreatePromptVersionResponse = {
    version?: number | undefined;
    deduplicated?: boolean | undefined;
};
/** @internal */
export declare const CreatePromptVersionResponse$inboundSchema: z.ZodType<CreatePromptVersionResponse, unknown>;
export declare function createPromptVersionResponseFromJSON(jsonString: string): SafeParseResult<CreatePromptVersionResponse, SDKValidationError>;
//# sourceMappingURL=createpromptversionresponse.d.ts.map