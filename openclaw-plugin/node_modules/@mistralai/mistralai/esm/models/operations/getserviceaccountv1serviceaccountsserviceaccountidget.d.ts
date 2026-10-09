import * as z from "zod/v4";
export type GetServiceAccountV1ServiceAccountsServiceAccountIdGetRequest = {
    serviceAccountId: string;
};
/** @internal */
export type GetServiceAccountV1ServiceAccountsServiceAccountIdGetRequest$Outbound = {
    service_account_id: string;
};
/** @internal */
export declare const GetServiceAccountV1ServiceAccountsServiceAccountIdGetRequest$outboundSchema: z.ZodType<GetServiceAccountV1ServiceAccountsServiceAccountIdGetRequest$Outbound, GetServiceAccountV1ServiceAccountsServiceAccountIdGetRequest>;
export declare function getServiceAccountV1ServiceAccountsServiceAccountIdGetRequestToJSON(getServiceAccountV1ServiceAccountsServiceAccountIdGetRequest: GetServiceAccountV1ServiceAccountsServiceAccountIdGetRequest): string;
//# sourceMappingURL=getserviceaccountv1serviceaccountsserviceaccountidget.d.ts.map