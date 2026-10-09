import * as z from "zod/v4";
import { ConnectorAuthenticationHeader, ConnectorAuthenticationHeader$Outbound } from "./connectorauthenticationheader.js";
export type BearerAuthMethod = {
    methodType: "bearer";
    /**
     * Optional additional headers sent with requests.
     */
    headers?: Array<ConnectorAuthenticationHeader> | null | undefined;
};
/** @internal */
export type BearerAuthMethod$Outbound = {
    method_type: "bearer";
    headers?: Array<ConnectorAuthenticationHeader$Outbound> | null | undefined;
};
/** @internal */
export declare const BearerAuthMethod$outboundSchema: z.ZodType<BearerAuthMethod$Outbound, BearerAuthMethod>;
export declare function bearerAuthMethodToJSON(bearerAuthMethod: BearerAuthMethod): string;
//# sourceMappingURL=bearerauthmethod.d.ts.map