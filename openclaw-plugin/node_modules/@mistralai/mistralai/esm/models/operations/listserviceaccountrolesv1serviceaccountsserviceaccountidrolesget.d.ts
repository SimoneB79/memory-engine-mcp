import * as z from "zod/v4";
export type ListServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesGetRequest = {
    serviceAccountId: string;
};
/** @internal */
export type ListServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesGetRequest$Outbound = {
    service_account_id: string;
};
/** @internal */
export declare const ListServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesGetRequest$outboundSchema: z.ZodType<ListServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesGetRequest$Outbound, ListServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesGetRequest>;
export declare function listServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesGetRequestToJSON(listServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesGetRequest: ListServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesGetRequest): string;
//# sourceMappingURL=listserviceaccountrolesv1serviceaccountsserviceaccountidrolesget.d.ts.map