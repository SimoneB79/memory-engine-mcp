import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Connectors extends ClientSDK {
    /**
     * Create a new connector.
     *
     * @remarks
     * Create a new MCP or HTTP connector. You can customize its visibility, URL, and auth type.
     */
    create(request: operations.ConnectorCreateV1Payload, options?: RequestOptions): Promise<components.Connector>;
    /**
     * List all connectors.
     *
     * @remarks
     * List all your custom connectors with keyset pagination and filters.
     */
    list(request?: operations.ConnectorListV1Request | undefined, options?: RequestOptions): Promise<components.PaginatedConnectors>;
    /**
     * Get the auth URL for a connector.
     *
     * @remarks
     * Get the OAuth2 authorization URL for a connector to initiate user authentication.
     */
    getAuthUrl(request: operations.ConnectorGetAuthUrlV1Request, options?: RequestOptions): Promise<components.AuthUrlResponse>;
    /**
     * Share a private connector to the current workspace.
     *
     * @remarks
     * Transfers ownership of a private user-owned connector to the current workspace, making it available to all workspace members. The creator can later revert this via the unshare endpoint. Any authentication flows that rely on the original owner's identity (e.g. OAuth on-behalf-of) will be affected and must be reconfigured after sharing. Only the connector's creator can call this endpoint. Requires the ShareConnectorToWorkspace workspace permission.
     */
    share(request: operations.ConnectorShareV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Unshare a connector from the current workspace.
     *
     * @remarks
     * Reverts a workspace-shared connector back to a private, creator-owned connector. Workspace-scoped connections and other members' connections are removed; the creator's own connection is preserved. Only the connector's creator can call this endpoint. Requires the ShareConnectorToWorkspace workspace permission.
     */
    unshare(request: operations.ConnectorUnshareV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Share a connector to the current organization.
     *
     * @remarks
     * Transfers ownership of a private user-owned connector to the current organization, making it available to all organization members. The creator can later revert this via the unshare endpoint. Any authentication flows that rely on the original owner's identity (e.g. OAuth on-behalf-of) will be affected and must be reconfigured after sharing. Requires the ShareConnectorToOrg organization permission.
     */
    shareToOrganization(request: operations.ConnectorShareToOrganizationV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Unshare a connector from the current organization.
     *
     * @remarks
     * Reverts an organization-shared connector back to a private, creator-owned connector. Organization-scoped connections and other members' connections are removed; the creator's own connection is preserved. Requires the ShareConnectorToOrg organization permission.
     */
    unshareFromOrganization(request: operations.ConnectorUnshareFromOrganizationV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Activate a connector for the given consumer (organization, workspace, user).
     *
     * @remarks
     * Enable a connector for the consumer.
     */
    activateForConsumer(request: operations.ConnectorActivateForConsumerV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Deactivate a connector for the current consumer (at organization, workspace or user level).
     *
     * @remarks
     * Disable a connector for the calling consumer only.
     */
    deactivateForConsumer(request: operations.ConnectorDeactivateForConsumerV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Call Connector Tool
     *
     * @remarks
     * Call a tool on an MCP connector.
     */
    callTool(request: operations.ConnectorCallToolV1Request, options?: RequestOptions): Promise<components.ConnectorToolCallResponse>;
    /**
     * List tools for a connector.
     *
     * @remarks
     * List all tools available for an MCP connector.
     */
    listTools(request: operations.ConnectorListToolsV1Request, options?: RequestOptions): Promise<operations.ResponseConnectorListToolsV1>;
    /**
     * Get authentication methods for a connector.
     *
     * @remarks
     * Get the authentication schema for a connector. Returns the list of supported authentication methods and their required headers.
     */
    getAuthenticationMethods(request: operations.ConnectorGetAuthenticationMethodsV1Request, options?: RequestOptions): Promise<Array<components.PublicAuthenticationMethod>>;
    /**
     * List organization credentials for a connector.
     *
     * @remarks
     * List all credentials configured at the organization level for a given connector.
     */
    listOrganizationCredentials(request: operations.ConnectorListOrganizationCredentialsV1Request, options?: RequestOptions): Promise<components.CredentialsResponse>;
    /**
     * List workspace credentials for a connector.
     *
     * @remarks
     * List all credentials configured at the workspace level for a given connector.
     */
    listWorkspaceCredentials(request: operations.ConnectorListWorkspaceCredentialsV1Request, options?: RequestOptions): Promise<components.CredentialsResponse>;
    /**
     * List user credentials for a connector.
     *
     * @remarks
     * List all credentials configured at the user level for a given connector.
     */
    listUserCredentials(request: operations.ConnectorListUserCredentialsV1Request, options?: RequestOptions): Promise<components.CredentialsResponse>;
    /**
     * Delete all user credentials for a connector.
     *
     * @remarks
     * Delete all credentials configured at the user level for a given connector.
     */
    deleteAllUserCredentials(request: operations.ConnectorDeleteAllUserCredentialsV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Create consumer credentials for a connector.
     *
     * @remarks
     * Create consumer credentials for a given connector and consumer scope (organization, workspace, user)
     */
    createCredentials(request: operations.ConnectorCreateCredentialsV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Create or update consumer credentials for a connector.
     *
     * @remarks
     * Create or update consumer credentials for a given connector.
     */
    updateCredentials(request: operations.ConnectorUpdateCredentialsRequest, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Delete organization credentials for a connector.
     *
     * @remarks
     * Delete credentials at the organization level for a given connector.
     */
    deleteOrganizationCredentials(request: operations.ConnectorDeleteOrganizationCredentialsV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Delete workspace credentials for a connector.
     *
     * @remarks
     * Delete credentials at the workspace level for a given connector.
     */
    deleteWorkspaceCredentials(request: operations.ConnectorDeleteWorkspaceCredentialsV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Delete user credentials for a connector.
     *
     * @remarks
     * Delete credentials at the user level for a given connector.
     */
    deleteUserCredentials(request: operations.ConnectorDeleteUserCredentialsV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Get a connector.
     *
     * @remarks
     * Get a connector by its ID or name.
     */
    get(request: operations.ConnectorGetV1Request, options?: RequestOptions): Promise<components.Connector>;
    /**
     * Update a connector.
     *
     * @remarks
     * Update a connector by its ID.
     */
    update(request: operations.ConnectorUpdateV1Request, options?: RequestOptions): Promise<components.Connector>;
    /**
     * Delete a connector.
     *
     * @remarks
     * Delete a connector by its ID.
     */
    delete(request: operations.ConnectorDeleteV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
}
//# sourceMappingURL=connectors.d.ts.map