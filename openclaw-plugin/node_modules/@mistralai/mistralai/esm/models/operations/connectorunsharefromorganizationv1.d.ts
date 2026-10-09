import * as z from "zod/v4";
export type ConnectorUnshareFromOrganizationV1Request = {
    connectorId: string;
};
/** @internal */
export type ConnectorUnshareFromOrganizationV1Request$Outbound = {
    connector_id: string;
};
/** @internal */
export declare const ConnectorUnshareFromOrganizationV1Request$outboundSchema: z.ZodType<ConnectorUnshareFromOrganizationV1Request$Outbound, ConnectorUnshareFromOrganizationV1Request>;
export declare function connectorUnshareFromOrganizationV1RequestToJSON(connectorUnshareFromOrganizationV1Request: ConnectorUnshareFromOrganizationV1Request): string;
//# sourceMappingURL=connectorunsharefromorganizationv1.d.ts.map