import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorCreateV1Payload = components.CreateConnectorRequest | components.CreateHTTPConnectorRequest;
/** @internal */
export type ConnectorCreateV1Payload$Outbound = components.CreateConnectorRequest$Outbound | components.CreateHTTPConnectorRequest$Outbound;
/** @internal */
export declare const ConnectorCreateV1Payload$outboundSchema: z.ZodType<ConnectorCreateV1Payload$Outbound, ConnectorCreateV1Payload>;
export declare function connectorCreateV1PayloadToJSON(connectorCreateV1Payload: ConnectorCreateV1Payload): string;
//# sourceMappingURL=connectorcreatev1.d.ts.map