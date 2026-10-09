import * as z from "zod/v4";
/**
 * Payload used to create realtime client sessions.
 */
export type CreateRealtimeSessionRequest = {
    purpose: "realtime";
    model: string;
    ttlSeconds?: number | null | undefined;
};
/** @internal */
export type CreateRealtimeSessionRequest$Outbound = {
    purpose: "realtime";
    model: string;
    ttl_seconds?: number | null | undefined;
};
/** @internal */
export declare const CreateRealtimeSessionRequest$outboundSchema: z.ZodType<CreateRealtimeSessionRequest$Outbound, CreateRealtimeSessionRequest>;
export declare function createRealtimeSessionRequestToJSON(createRealtimeSessionRequest: CreateRealtimeSessionRequest): string;
//# sourceMappingURL=createrealtimesessionrequest.d.ts.map