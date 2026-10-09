import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const InboundAuthenticationType: {
    readonly Webhook: "webhook";
};
export type InboundAuthenticationType = ClosedEnum<typeof InboundAuthenticationType>;
/** @internal */
export declare const InboundAuthenticationType$outboundSchema: z.ZodEnum<typeof InboundAuthenticationType>;
//# sourceMappingURL=inboundauthenticationtype.d.ts.map