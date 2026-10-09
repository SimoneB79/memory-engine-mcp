import * as z from "zod/v4";
export type DeleteServiceAccountV1ServiceAccountsServiceAccountIdDeleteRequest = {
    serviceAccountId: string;
};
/** @internal */
export type DeleteServiceAccountV1ServiceAccountsServiceAccountIdDeleteRequest$Outbound = {
    service_account_id: string;
};
/** @internal */
export declare const DeleteServiceAccountV1ServiceAccountsServiceAccountIdDeleteRequest$outboundSchema: z.ZodType<DeleteServiceAccountV1ServiceAccountsServiceAccountIdDeleteRequest$Outbound, DeleteServiceAccountV1ServiceAccountsServiceAccountIdDeleteRequest>;
export declare function deleteServiceAccountV1ServiceAccountsServiceAccountIdDeleteRequestToJSON(deleteServiceAccountV1ServiceAccountsServiceAccountIdDeleteRequest: DeleteServiceAccountV1ServiceAccountsServiceAccountIdDeleteRequest): string;
//# sourceMappingURL=deleteserviceaccountv1serviceaccountsserviceaccountiddelete.d.ts.map