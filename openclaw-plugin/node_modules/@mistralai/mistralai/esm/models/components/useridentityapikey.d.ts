import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type UserIdentityApiKey = {
    id: string;
    name: string | null;
};
/** @internal */
export declare const UserIdentityApiKey$inboundSchema: z.ZodType<UserIdentityApiKey, unknown>;
export declare function userIdentityApiKeyFromJSON(jsonString: string): SafeParseResult<UserIdentityApiKey, SDKValidationError>;
//# sourceMappingURL=useridentityapikey.d.ts.map