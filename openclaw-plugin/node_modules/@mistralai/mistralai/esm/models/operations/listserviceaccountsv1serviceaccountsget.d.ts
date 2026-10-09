import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ListServiceAccountsV1ServiceAccountsGetRequest = {
    workspaceId?: string | null | undefined;
    includeDeleted?: boolean | undefined;
    offset: number;
    limit: number;
};
export type ListServiceAccountsV1ServiceAccountsGetResponse = {
    result: components.ListServiceAccountsResponse;
};
/** @internal */
export type ListServiceAccountsV1ServiceAccountsGetRequest$Outbound = {
    workspace_id?: string | null | undefined;
    include_deleted: boolean;
    offset: number;
    limit: number;
};
/** @internal */
export declare const ListServiceAccountsV1ServiceAccountsGetRequest$outboundSchema: z.ZodType<ListServiceAccountsV1ServiceAccountsGetRequest$Outbound, ListServiceAccountsV1ServiceAccountsGetRequest>;
export declare function listServiceAccountsV1ServiceAccountsGetRequestToJSON(listServiceAccountsV1ServiceAccountsGetRequest: ListServiceAccountsV1ServiceAccountsGetRequest): string;
/** @internal */
export declare const ListServiceAccountsV1ServiceAccountsGetResponse$inboundSchema: z.ZodType<ListServiceAccountsV1ServiceAccountsGetResponse, unknown>;
export declare function listServiceAccountsV1ServiceAccountsGetResponseFromJSON(jsonString: string): SafeParseResult<ListServiceAccountsV1ServiceAccountsGetResponse, SDKValidationError>;
//# sourceMappingURL=listserviceaccountsv1serviceaccountsget.d.ts.map