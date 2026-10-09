import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
import * as components from "../components/index.js";
export declare const ConnectorUpdateCredentialsConsumerScope: {
    readonly User: "user";
    readonly Workspace: "workspace";
    readonly Organization: "organization";
};
export type ConnectorUpdateCredentialsConsumerScope = ClosedEnum<typeof ConnectorUpdateCredentialsConsumerScope>;
export type ConnectorUpdateCredentialsRequest = {
    connectorIdOrName: string;
    consumerScope: ConnectorUpdateCredentialsConsumerScope;
    credentialsCreateOrUpdate: components.CredentialsCreateOrUpdate;
};
/** @internal */
export declare const ConnectorUpdateCredentialsConsumerScope$outboundSchema: z.ZodEnum<typeof ConnectorUpdateCredentialsConsumerScope>;
/** @internal */
export type ConnectorUpdateCredentialsRequest$Outbound = {
    connector_id_or_name: string;
    consumer_scope: string;
    CredentialsCreateOrUpdate: components.CredentialsCreateOrUpdate$Outbound;
};
/** @internal */
export declare const ConnectorUpdateCredentialsRequest$outboundSchema: z.ZodType<ConnectorUpdateCredentialsRequest$Outbound, ConnectorUpdateCredentialsRequest>;
export declare function connectorUpdateCredentialsRequestToJSON(connectorUpdateCredentialsRequest: ConnectorUpdateCredentialsRequest): string;
//# sourceMappingURL=connectorupdatecredentials.d.ts.map