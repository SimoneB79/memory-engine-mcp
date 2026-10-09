import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const OAuth2TokenEndpointAuthMethod: {
    readonly ClientSecretPost: "client_secret_post";
    readonly ClientSecretBasic: "client_secret_basic";
};
export type OAuth2TokenEndpointAuthMethod = ClosedEnum<typeof OAuth2TokenEndpointAuthMethod>;
/** @internal */
export declare const OAuth2TokenEndpointAuthMethod$outboundSchema: z.ZodEnum<typeof OAuth2TokenEndpointAuthMethod>;
//# sourceMappingURL=oauth2tokenendpointauthmethod.d.ts.map