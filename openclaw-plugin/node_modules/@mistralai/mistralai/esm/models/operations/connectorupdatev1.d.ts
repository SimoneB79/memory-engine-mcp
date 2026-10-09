import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorUpdateV1Payload = components.ConnectorMCPPublicUpdate | components.UpdateHTTPConnectorRequest;
export type ConnectorUpdateV1Request = {
    connectorId: string;
    requestBody: components.ConnectorMCPPublicUpdate | components.UpdateHTTPConnectorRequest;
};
/** @internal */
export type ConnectorUpdateV1Payload$Outbound = components.ConnectorMCPPublicUpdate$Outbound | components.UpdateHTTPConnectorRequest$Outbound;
/** @internal */
export declare const ConnectorUpdateV1Payload$outboundSchema: z.ZodType<ConnectorUpdateV1Payload$Outbound, ConnectorUpdateV1Payload>;
export declare function connectorUpdateV1PayloadToJSON(connectorUpdateV1Payload: ConnectorUpdateV1Payload): string;
/** @internal */
export type ConnectorUpdateV1Request$Outbound = {
    connector_id: string;
    RequestBody: components.ConnectorMCPPublicUpdate$Outbound | components.UpdateHTTPConnectorRequest$Outbound;
};
/** @internal */
export declare const ConnectorUpdateV1Request$outboundSchema: z.ZodType<ConnectorUpdateV1Request$Outbound, ConnectorUpdateV1Request>;
export declare function connectorUpdateV1RequestToJSON(connectorUpdateV1Request: ConnectorUpdateV1Request): string;
//# sourceMappingURL=connectorupdatev1.d.ts.map