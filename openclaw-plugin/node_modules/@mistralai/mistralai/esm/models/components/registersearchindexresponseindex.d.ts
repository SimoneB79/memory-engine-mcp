import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type RegisterSearchIndexResponseIndex = {
    id: string;
};
/** @internal */
export declare const RegisterSearchIndexResponseIndex$inboundSchema: z.ZodType<RegisterSearchIndexResponseIndex, unknown>;
export declare function registerSearchIndexResponseIndexFromJSON(jsonString: string): SafeParseResult<RegisterSearchIndexResponseIndex, SDKValidationError>;
//# sourceMappingURL=registersearchindexresponseindex.d.ts.map