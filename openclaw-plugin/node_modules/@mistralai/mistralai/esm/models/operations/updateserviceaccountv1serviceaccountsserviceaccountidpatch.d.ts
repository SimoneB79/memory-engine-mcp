import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdateServiceAccountV1ServiceAccountsServiceAccountIdPatchRequest = {
    serviceAccountId: string;
    updateServiceAccountRequest: components.UpdateServiceAccountRequest;
};
/** @internal */
export type UpdateServiceAccountV1ServiceAccountsServiceAccountIdPatchRequest$Outbound = {
    service_account_id: string;
    UpdateServiceAccountRequest: components.UpdateServiceAccountRequest$Outbound;
};
/** @internal */
export declare const UpdateServiceAccountV1ServiceAccountsServiceAccountIdPatchRequest$outboundSchema: z.ZodType<UpdateServiceAccountV1ServiceAccountsServiceAccountIdPatchRequest$Outbound, UpdateServiceAccountV1ServiceAccountsServiceAccountIdPatchRequest>;
export declare function updateServiceAccountV1ServiceAccountsServiceAccountIdPatchRequestToJSON(updateServiceAccountV1ServiceAccountsServiceAccountIdPatchRequest: UpdateServiceAccountV1ServiceAccountsServiceAccountIdPatchRequest): string;
//# sourceMappingURL=updateserviceaccountv1serviceaccountsserviceaccountidpatch.d.ts.map