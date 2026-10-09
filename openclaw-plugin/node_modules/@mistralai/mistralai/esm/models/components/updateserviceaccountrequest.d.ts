import * as z from "zod/v4";
export type UpdateServiceAccountRequest = {
    description?: string | null | undefined;
};
/** @internal */
export type UpdateServiceAccountRequest$Outbound = {
    description?: string | null | undefined;
};
/** @internal */
export declare const UpdateServiceAccountRequest$outboundSchema: z.ZodType<UpdateServiceAccountRequest$Outbound, UpdateServiceAccountRequest>;
export declare function updateServiceAccountRequestToJSON(updateServiceAccountRequest: UpdateServiceAccountRequest): string;
//# sourceMappingURL=updateserviceaccountrequest.d.ts.map