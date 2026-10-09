import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
import { PageIterator } from "../types/operations.js";
export declare class Users extends ClientSDK {
    /**
     * Get Identity
     */
    getIdentity(security: operations.UsersApiGetIdentitySecurity, options?: RequestOptions): Promise<components.UserIdentity>;
    /**
     * List Organizations
     *
     * @remarks
     * List every organization the authenticated user is a member of.
     *
     * Identity-only: the caller need not have selected an organization, so this
     * reads only the user and never scopes by the active org.
     */
    listOrganizations(security: operations.UsersApiListOrganizationsSecurity, request?: operations.UsersApiListOrganizationsRequest | undefined, options?: RequestOptions): Promise<PageIterator<operations.UsersApiListOrganizationsResponse, {
        offset: number;
    }>>;
    /**
     * List Workspaces
     *
     * @remarks
     * List every workspace the authenticated user is a member of, across all
     * their organizations, each tagged with the organization it belongs to.
     */
    listWorkspaces(security: operations.UsersApiListWorkspacesSecurity, request?: operations.UsersApiListWorkspacesRequest | undefined, options?: RequestOptions): Promise<PageIterator<operations.UsersApiListWorkspacesResponse, {
        offset: number;
    }>>;
}
//# sourceMappingURL=users.d.ts.map