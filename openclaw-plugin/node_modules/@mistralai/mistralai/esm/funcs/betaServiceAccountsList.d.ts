import { MistralCore } from "../core.js";
import { RequestOptions } from "../lib/sdks.js";
import { ConnectionError, InvalidRequestError, RequestAbortedError, RequestTimeoutError, UnexpectedClientError } from "../models/errors/httpclienterrors.js";
import * as errors from "../models/errors/index.js";
import { MistralError } from "../models/errors/mistralerror.js";
import { ResponseValidationError } from "../models/errors/responsevalidationerror.js";
import { SDKValidationError } from "../models/errors/sdkvalidationerror.js";
import * as operations from "../models/operations/index.js";
import { APIPromise } from "../types/async.js";
import { Result } from "../types/fp.js";
import { PageIterator } from "../types/operations.js";
/**
 * List Service Accounts
 *
 * @remarks
 * List the service accounts in a workspace, or across the organization.
 *
 * Scoped to a workspace, this requires the `see_all_workspace_service_accounts`
 * permission on it. Omitting the workspace lists the whole organization and requires
 * the organization-level `see_all_org_service_accounts` permission instead.
 */
export declare function betaServiceAccountsList(client: MistralCore, request: operations.ListServiceAccountsV1ServiceAccountsGetRequest, options?: RequestOptions): APIPromise<PageIterator<Result<operations.ListServiceAccountsV1ServiceAccountsGetResponse, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>, {
    offset: number;
}>>;
//# sourceMappingURL=betaServiceAccountsList.d.ts.map