import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const ConnectorDeactivateForConsumerV1ConsumerScope: {
    readonly User: "user";
    readonly Workspace: "workspace";
    readonly Organization: "organization";
};
export type ConnectorDeactivateForConsumerV1ConsumerScope = ClosedEnum<typeof ConnectorDeactivateForConsumerV1ConsumerScope>;
export type ConnectorDeactivateForConsumerV1Request = {
    connectorId: string;
    consumerScope: ConnectorDeactivateForConsumerV1ConsumerScope;
};
/** @internal */
export declare const ConnectorDeactivateForConsumerV1ConsumerScope$outboundSchema: z.ZodEnum<typeof ConnectorDeactivateForConsumerV1ConsumerScope>;
/** @internal */
export type ConnectorDeactivateForConsumerV1Request$Outbound = {
    connector_id: string;
    consumer_scope: string;
};
/** @internal */
export declare const ConnectorDeactivateForConsumerV1Request$outboundSchema: z.ZodType<ConnectorDeactivateForConsumerV1Request$Outbound, ConnectorDeactivateForConsumerV1Request>;
export declare function connectorDeactivateForConsumerV1RequestToJSON(connectorDeactivateForConsumerV1Request: ConnectorDeactivateForConsumerV1Request): string;
//# sourceMappingURL=connectordeactivateforconsumerv1.d.ts.map