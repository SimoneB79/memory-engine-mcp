import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ConnectorAuthenticationHeader = {
    name: string;
    isRequired?: boolean | undefined;
    isSecret?: boolean | undefined;
};
/** @internal */
export declare const ConnectorAuthenticationHeader$inboundSchema: z.ZodType<ConnectorAuthenticationHeader, unknown>;
/** @internal */
export type ConnectorAuthenticationHeader$Outbound = {
    name: string;
    is_required: boolean;
    is_secret: boolean;
};
/** @internal */
export declare const ConnectorAuthenticationHeader$outboundSchema: z.ZodType<ConnectorAuthenticationHeader$Outbound, ConnectorAuthenticationHeader>;
export declare function connectorAuthenticationHeaderToJSON(connectorAuthenticationHeader: ConnectorAuthenticationHeader): string;
export declare function connectorAuthenticationHeaderFromJSON(jsonString: string): SafeParseResult<ConnectorAuthenticationHeader, SDKValidationError>;
//# sourceMappingURL=connectorauthenticationheader.d.ts.map