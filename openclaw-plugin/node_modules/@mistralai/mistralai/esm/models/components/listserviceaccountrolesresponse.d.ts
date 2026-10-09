import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ServiceAccountRole } from "./serviceaccountrole.js";
export type ListServiceAccountRolesResponse = {
    items: Array<ServiceAccountRole>;
};
/** @internal */
export declare const ListServiceAccountRolesResponse$inboundSchema: z.ZodType<ListServiceAccountRolesResponse, unknown>;
export declare function listServiceAccountRolesResponseFromJSON(jsonString: string): SafeParseResult<ListServiceAccountRolesResponse, SDKValidationError>;
//# sourceMappingURL=listserviceaccountrolesresponse.d.ts.map