import * as z from "zod/v4";
export type ConnectorDeleteAllUserCredentialsV1Request = {
    connectorIdOrName: string;
};
/** @internal */
export type ConnectorDeleteAllUserCredentialsV1Request$Outbound = {
    connector_id_or_name: string;
};
/** @internal */
export declare const ConnectorDeleteAllUserCredentialsV1Request$outboundSchema: z.ZodType<ConnectorDeleteAllUserCredentialsV1Request$Outbound, ConnectorDeleteAllUserCredentialsV1Request>;
export declare function connectorDeleteAllUserCredentialsV1RequestToJSON(connectorDeleteAllUserCredentialsV1Request: ConnectorDeleteAllUserCredentialsV1Request): string;
//# sourceMappingURL=connectordeleteallusercredentialsv1.d.ts.map