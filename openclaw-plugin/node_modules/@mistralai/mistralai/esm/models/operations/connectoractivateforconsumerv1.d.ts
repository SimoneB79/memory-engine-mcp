import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const ConnectorActivateForConsumerV1ConsumerScope: {
    readonly User: "user";
    readonly Workspace: "workspace";
    readonly Organization: "organization";
};
export type ConnectorActivateForConsumerV1ConsumerScope = ClosedEnum<typeof ConnectorActivateForConsumerV1ConsumerScope>;
export type ConnectorActivateForConsumerV1Request = {
    connectorId: string;
    consumerScope: ConnectorActivateForConsumerV1ConsumerScope;
};
/** @internal */
export declare const ConnectorActivateForConsumerV1ConsumerScope$outboundSchema: z.ZodEnum<typeof ConnectorActivateForConsumerV1ConsumerScope>;
/** @internal */
export type ConnectorActivateForConsumerV1Request$Outbound = {
    connector_id: string;
    consumer_scope: string;
};
/** @internal */
export declare const ConnectorActivateForConsumerV1Request$outboundSchema: z.ZodType<ConnectorActivateForConsumerV1Request$Outbound, ConnectorActivateForConsumerV1Request>;
export declare function connectorActivateForConsumerV1RequestToJSON(connectorActivateForConsumerV1Request: ConnectorActivateForConsumerV1Request): string;
//# sourceMappingURL=connectoractivateforconsumerv1.d.ts.map