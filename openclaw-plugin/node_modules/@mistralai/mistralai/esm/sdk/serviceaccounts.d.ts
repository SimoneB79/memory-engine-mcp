import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
import { PageIterator } from "../types/operations.js";
export declare class ServiceAccounts extends ClientSDK {
    /**
     * Create Service Account
     *
     * @remarks
     * Create a service account in a workspace. Requires the `create_service_account` permission.
     */
    create(request: components.CreateServiceAccountRequest, options?: RequestOptions): Promise<components.ServiceAccount>;
    /**
     * List Service Accounts
     *
     * @remarks
     * List the service accounts in a workspace, or across the organization.
     *
     * Scoped to a workspace, this requires the `see_all_workspace_service_accounts`
     * permission on it. Omitting the workspace lists the whole organization and requires
     * the organization-level `see_all_org_service_accounts` permission instead.
     */
    list(request: operations.ListServiceAccountsV1ServiceAccountsGetRequest, options?: RequestOptions): Promise<PageIterator<operations.ListServiceAccountsV1ServiceAccountsGetResponse, {
        offset: number;
    }>>;
    /**
     * List Assignable Service Account Roles
     *
     * @remarks
     * List the workspace roles that can be assigned to a service account.
     *
     * Requires the `see_all_workspace_service_accounts` permission.
     */
    listAssignableRoles(request: operations.ListAssignableServiceAccountRolesV1ServiceAccountsAssignableRolesGetRequest, options?: RequestOptions): Promise<components.ListAssignableServiceAccountRolesResponse>;
    /**
     * Get Service Account
     *
     * @remarks
     * Retrieve a service account.
     *
     * Requires the `see_all_workspace_service_accounts` permission.
     */
    get(request: operations.GetServiceAccountV1ServiceAccountsServiceAccountIdGetRequest, options?: RequestOptions): Promise<components.ServiceAccount>;
    /**
     * Update Service Account
     *
     * @remarks
     * Update a service account.
     *
     * Requires the `manage_any_workspace_service_account` permission.
     */
    update(request: operations.UpdateServiceAccountV1ServiceAccountsServiceAccountIdPatchRequest, options?: RequestOptions): Promise<components.ServiceAccount>;
    /**
     * Delete Service Account
     *
     * @remarks
     * Delete a service account.
     *
     * Requires the `manage_any_workspace_service_account` permission.
     */
    delete(request: operations.DeleteServiceAccountV1ServiceAccountsServiceAccountIdDeleteRequest, options?: RequestOptions): Promise<void>;
    /**
     * Set Service Account Roles
     *
     * @remarks
     * Replace the workspace roles assigned to a service account.
     *
     * Requires the `manage_any_workspace_service_account` permission.
     */
    setRoles(request: operations.SetServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesPutRequest, options?: RequestOptions): Promise<components.ListServiceAccountRolesResponse>;
    /**
     * List Service Account Roles
     *
     * @remarks
     * List the workspace roles assigned to a service account.
     *
     * Requires the `see_all_workspace_service_accounts` permission.
     */
    listRoles(request: operations.ListServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesGetRequest, options?: RequestOptions): Promise<components.ListServiceAccountRolesResponse>;
}
//# sourceMappingURL=serviceaccounts.d.ts.map