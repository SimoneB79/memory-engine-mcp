import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * A single workspace-role binding held by a service account.
 */
export type ServiceAccountRole = {
    roleId: string;
};
/** @internal */
export declare const ServiceAccountRole$inboundSchema: z.ZodType<ServiceAccountRole, unknown>;
export declare function serviceAccountRoleFromJSON(jsonString: string): SafeParseResult<ServiceAccountRole, SDKValidationError>;
//# sourceMappingURL=serviceaccountrole.d.ts.map