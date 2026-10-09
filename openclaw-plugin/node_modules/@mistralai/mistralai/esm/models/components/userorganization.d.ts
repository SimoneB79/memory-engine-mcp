import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type UserOrganization = {
    /**
     * The organization's unique identifier.
     */
    id: string;
    /**
     * The organization's display name.
     */
    name: string;
};
/** @internal */
export declare const UserOrganization$inboundSchema: z.ZodType<UserOrganization, unknown>;
export declare function userOrganizationFromJSON(jsonString: string): SafeParseResult<UserOrganization, SDKValidationError>;
//# sourceMappingURL=userorganization.d.ts.map