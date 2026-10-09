import * as z from "zod/v4";
export type ConnectorShareV1Request = {
    connectorId: string;
};
/** @internal */
export type ConnectorShareV1Request$Outbound = {
    connector_id: string;
};
/** @internal */
export declare const ConnectorShareV1Request$outboundSchema: z.ZodType<ConnectorShareV1Request$Outbound, ConnectorShareV1Request>;
export declare function connectorShareV1RequestToJSON(connectorShareV1Request: ConnectorShareV1Request): string;
//# sourceMappingURL=connectorsharev1.d.ts.map