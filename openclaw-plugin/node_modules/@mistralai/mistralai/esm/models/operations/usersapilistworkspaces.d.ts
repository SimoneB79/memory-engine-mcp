import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type UsersApiListWorkspacesSecurity = {
    dashboardUserContextAuth: string;
};
export type UsersApiListWorkspacesRequest = {
    /**
     * Return only workspaces belonging to this organization.
     */
    organizationId?: string | null | undefined;
    /**
     * Number of workspaces to skip before returning results.
     */
    offset?: number | undefined;
    /**
     * Maximum number of workspaces to return.
     */
    limit?: number | undefined;
};
export type UsersApiListWorkspacesResponse = {
    result: components.ListWorkspacesResponse;
};
/** @internal */
export type UsersApiListWorkspacesSecurity$Outbound = {
    DashboardUserContextAuth: string;
};
/** @internal */
export declare const UsersApiListWorkspacesSecurity$outboundSchema: z.ZodType<UsersApiListWorkspacesSecurity$Outbound, UsersApiListWorkspacesSecurity>;
export declare function usersApiListWorkspacesSecurityToJSON(usersApiListWorkspacesSecurity: UsersApiListWorkspacesSecurity): string;
/** @internal */
export type UsersApiListWorkspacesRequest$Outbound = {
    organization_id?: string | null | undefined;
    offset: number;
    limit: number;
};
/** @internal */
export declare const UsersApiListWorkspacesRequest$outboundSchema: z.ZodType<UsersApiListWorkspacesRequest$Outbound, UsersApiListWorkspacesRequest>;
export declare function usersApiListWorkspacesRequestToJSON(usersApiListWorkspacesRequest: UsersApiListWorkspacesRequest): string;
/** @internal */
export declare const UsersApiListWorkspacesResponse$inboundSchema: z.ZodType<UsersApiListWorkspacesResponse, unknown>;
export declare function usersApiListWorkspacesResponseFromJSON(jsonString: string): SafeParseResult<UsersApiListWorkspacesResponse, SDKValidationError>;
//# sourceMappingURL=usersapilistworkspaces.d.ts.map