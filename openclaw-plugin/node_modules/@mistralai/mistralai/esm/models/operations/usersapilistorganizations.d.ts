import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type UsersApiListOrganizationsSecurity = {
    dashboardUserContextAuth: string;
};
export type UsersApiListOrganizationsRequest = {
    /**
     * Number of organizations to skip before returning results.
     */
    offset?: number | undefined;
    /**
     * Maximum number of organizations to return.
     */
    limit?: number | undefined;
};
export type UsersApiListOrganizationsResponse = {
    result: components.ListOrganizationsResponse;
};
/** @internal */
export type UsersApiListOrganizationsSecurity$Outbound = {
    DashboardUserContextAuth: string;
};
/** @internal */
export declare const UsersApiListOrganizationsSecurity$outboundSchema: z.ZodType<UsersApiListOrganizationsSecurity$Outbound, UsersApiListOrganizationsSecurity>;
export declare function usersApiListOrganizationsSecurityToJSON(usersApiListOrganizationsSecurity: UsersApiListOrganizationsSecurity): string;
/** @internal */
export type UsersApiListOrganizationsRequest$Outbound = {
    offset: number;
    limit: number;
};
/** @internal */
export declare const UsersApiListOrganizationsRequest$outboundSchema: z.ZodType<UsersApiListOrganizationsRequest$Outbound, UsersApiListOrganizationsRequest>;
export declare function usersApiListOrganizationsRequestToJSON(usersApiListOrganizationsRequest: UsersApiListOrganizationsRequest): string;
/** @internal */
export declare const UsersApiListOrganizationsResponse$inboundSchema: z.ZodType<UsersApiListOrganizationsResponse, unknown>;
export declare function usersApiListOrganizationsResponseFromJSON(jsonString: string): SafeParseResult<UsersApiListOrganizationsResponse, SDKValidationError>;
//# sourceMappingURL=usersapilistorganizations.d.ts.map