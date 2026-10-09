import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const OAuth2GrantType: {
    readonly AuthorizationCode: "authorization_code";
    readonly ClientCredentials: "client_credentials";
};
export type OAuth2GrantType = OpenEnum<typeof OAuth2GrantType>;
/** @internal */
export declare const OAuth2GrantType$inboundSchema: z.ZodType<OAuth2GrantType, unknown>;
//# sourceMappingURL=oauth2granttype.d.ts.map