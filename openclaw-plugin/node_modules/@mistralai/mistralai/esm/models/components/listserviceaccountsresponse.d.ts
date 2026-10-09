import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ServiceAccount } from "./serviceaccount.js";
export type ListServiceAccountsResponse = {
    items: Array<ServiceAccount>;
};
/** @internal */
export declare const ListServiceAccountsResponse$inboundSchema: z.ZodType<ListServiceAccountsResponse, unknown>;
export declare function listServiceAccountsResponseFromJSON(jsonString: string): SafeParseResult<ListServiceAccountsResponse, SDKValidationError>;
//# sourceMappingURL=listserviceaccountsresponse.d.ts.map