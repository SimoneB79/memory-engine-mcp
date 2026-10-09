import * as z from "zod/v4";
import { ConnectorAuthenticationHeader, ConnectorAuthenticationHeader$Outbound } from "./connectorauthenticationheader.js";
export type NoneAuthMethod = {
    methodType: "none";
    /**
     * Headers whose values must be provided as credentials.
     */
    headers?: Array<ConnectorAuthenticationHeader> | null | undefined;
};
/** @internal */
export type NoneAuthMethod$Outbound = {
    method_type: "none";
    headers?: Array<ConnectorAuthenticationHeader$Outbound> | null | undefined;
};
/** @internal */
export declare const NoneAuthMethod$outboundSchema: z.ZodType<NoneAuthMethod$Outbound, NoneAuthMethod>;
export declare function noneAuthMethodToJSON(noneAuthMethod: NoneAuthMethod): string;
//# sourceMappingURL=noneauthmethod.d.ts.map