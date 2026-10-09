import * as z from "zod/v4";
export type ConnectorUnshareV1Request = {
    connectorId: string;
};
/** @internal */
export type ConnectorUnshareV1Request$Outbound = {
    connector_id: string;
};
/** @internal */
export declare const ConnectorUnshareV1Request$outboundSchema: z.ZodType<ConnectorUnshareV1Request$Outbound, ConnectorUnshareV1Request>;
export declare function connectorUnshareV1RequestToJSON(connectorUnshareV1Request: ConnectorUnshareV1Request): string;
//# sourceMappingURL=connectorunsharev1.d.ts.map