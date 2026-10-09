import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AssignableServiceAccountRole } from "./assignableserviceaccountrole.js";
export type ListAssignableServiceAccountRolesResponse = {
    items: Array<AssignableServiceAccountRole>;
};
/** @internal */
export declare const ListAssignableServiceAccountRolesResponse$inboundSchema: z.ZodType<ListAssignableServiceAccountRolesResponse, unknown>;
export declare function listAssignableServiceAccountRolesResponseFromJSON(jsonString: string): SafeParseResult<ListAssignableServiceAccountRolesResponse, SDKValidationError>;
//# sourceMappingURL=listassignableserviceaccountrolesresponse.d.ts.map