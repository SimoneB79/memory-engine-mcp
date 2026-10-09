import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * A workspace role that may be assigned to a service account.
 */
export type AssignableServiceAccountRole = {
    uuid: string;
    name: string;
    description: string;
    isCustomRole: boolean;
};
/** @internal */
export declare const AssignableServiceAccountRole$inboundSchema: z.ZodType<AssignableServiceAccountRole, unknown>;
export declare function assignableServiceAccountRoleFromJSON(jsonString: string): SafeParseResult<AssignableServiceAccountRole, SDKValidationError>;
//# sourceMappingURL=assignableserviceaccountrole.d.ts.map