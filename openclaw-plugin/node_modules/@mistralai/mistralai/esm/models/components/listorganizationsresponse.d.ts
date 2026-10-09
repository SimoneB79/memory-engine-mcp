import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { UserOrganization } from "./userorganization.js";
export type ListOrganizationsResponse = {
    /**
     * The organizations the authenticated user is a member of.
     */
    organizations: Array<UserOrganization>;
};
/** @internal */
export declare const ListOrganizationsResponse$inboundSchema: z.ZodType<ListOrganizationsResponse, unknown>;
export declare function listOrganizationsResponseFromJSON(jsonString: string): SafeParseResult<ListOrganizationsResponse, SDKValidationError>;
//# sourceMappingURL=listorganizationsresponse.d.ts.map