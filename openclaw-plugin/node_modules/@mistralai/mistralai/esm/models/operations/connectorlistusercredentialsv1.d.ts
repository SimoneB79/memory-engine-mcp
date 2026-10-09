import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorListUserCredentialsV1Request = {
    connectorIdOrName: string;
    authType?: components.OutboundAuthenticationType | null | undefined;
    fetchDefault?: boolean | undefined;
};
/** @internal */
export type ConnectorListUserCredentialsV1Request$Outbound = {
    connector_id_or_name: string;
    auth_type?: string | null | undefined;
    fetch_default: boolean;
};
/** @internal */
export declare const ConnectorListUserCredentialsV1Request$outboundSchema: z.ZodType<ConnectorListUserCredentialsV1Request$Outbound, ConnectorListUserCredentialsV1Request>;
export declare function connectorListUserCredentialsV1RequestToJSON(connectorListUserCredentialsV1Request: ConnectorListUserCredentialsV1Request): string;
//# sourceMappingURL=connectorlistusercredentialsv1.d.ts.map