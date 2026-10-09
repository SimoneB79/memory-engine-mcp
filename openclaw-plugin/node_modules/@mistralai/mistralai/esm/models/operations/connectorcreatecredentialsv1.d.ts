import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
import * as components from "../components/index.js";
export declare const ConnectorCreateCredentialsV1ConsumerScope: {
    readonly User: "user";
    readonly Workspace: "workspace";
    readonly Organization: "organization";
};
export type ConnectorCreateCredentialsV1ConsumerScope = ClosedEnum<typeof ConnectorCreateCredentialsV1ConsumerScope>;
export type ConnectorCreateCredentialsV1Request = {
    connectorIdOrName: string;
    consumerScope: ConnectorCreateCredentialsV1ConsumerScope;
    credentialsCreateOrUpdate: components.CredentialsCreateOrUpdate;
};
/** @internal */
export declare const ConnectorCreateCredentialsV1ConsumerScope$outboundSchema: z.ZodEnum<typeof ConnectorCreateCredentialsV1ConsumerScope>;
/** @internal */
export type ConnectorCreateCredentialsV1Request$Outbound = {
    connector_id_or_name: string;
    consumer_scope: string;
    CredentialsCreateOrUpdate: components.CredentialsCreateOrUpdate$Outbound;
};
/** @internal */
export declare const ConnectorCreateCredentialsV1Request$outboundSchema: z.ZodType<ConnectorCreateCredentialsV1Request$Outbound, ConnectorCreateCredentialsV1Request>;
export declare function connectorCreateCredentialsV1RequestToJSON(connectorCreateCredentialsV1Request: ConnectorCreateCredentialsV1Request): string;
//# sourceMappingURL=connectorcreatecredentialsv1.d.ts.map