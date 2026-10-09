import * as z from "zod/v4";
import * as components from "../components/index.js";
export type Body = components.CreateRealtimeSessionRequest;
/** @internal */
export type Body$Outbound = components.CreateRealtimeSessionRequest$Outbound;
/** @internal */
export declare const Body$outboundSchema: z.ZodType<Body$Outbound, Body>;
export declare function bodyToJSON(body: Body): string;
//# sourceMappingURL=createclientsessionv1clientsessionspost.d.ts.map