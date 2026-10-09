import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorListOrganizationCredentialsV1Request = {
    connectorIdOrName: string;
    authType?: components.OutboundAuthenticationType | null | undefined;
    fetchDefault?: boolean | undefined;
};
/** @internal */
export type ConnectorListOrganizationCredentialsV1Request$Outbound = {
    connector_id_or_name: string;
    auth_type?: string | null | undefined;
    fetch_default: boolean;
};
/** @internal */
export declare const ConnectorListOrganizationCredentialsV1Request$outboundSchema: z.ZodType<ConnectorListOrganizationCredentialsV1Request$Outbound, ConnectorListOrganizationCredentialsV1Request>;
export declare function connectorListOrganizationCredentialsV1RequestToJSON(connectorListOrganizationCredentialsV1Request: ConnectorListOrganizationCredentialsV1Request): string;
//# sourceMappingURL=connectorlistorganizationcredentialsv1.d.ts.map