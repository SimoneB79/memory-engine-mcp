import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type UserIdentityOrganization = {
    id: string;
    name: string;
};
/** @internal */
export declare const UserIdentityOrganization$inboundSchema: z.ZodType<UserIdentityOrganization, unknown>;
export declare function userIdentityOrganizationFromJSON(jsonString: string): SafeParseResult<UserIdentityOrganization, SDKValidationError>;
//# sourceMappingURL=useridentityorganization.d.ts.map