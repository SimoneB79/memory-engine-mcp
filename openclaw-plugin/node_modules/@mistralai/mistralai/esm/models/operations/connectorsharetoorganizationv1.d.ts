import * as z from "zod/v4";
export type ConnectorShareToOrganizationV1Request = {
    connectorId: string;
};
/** @internal */
export type ConnectorShareToOrganizationV1Request$Outbound = {
    connector_id: string;
};
/** @internal */
export declare const ConnectorShareToOrganizationV1Request$outboundSchema: z.ZodType<ConnectorShareToOrganizationV1Request$Outbound, ConnectorShareToOrganizationV1Request>;
export declare function connectorShareToOrganizationV1RequestToJSON(connectorShareToOrganizationV1Request: ConnectorShareToOrganizationV1Request): string;
//# sourceMappingURL=connectorsharetoorganizationv1.d.ts.map