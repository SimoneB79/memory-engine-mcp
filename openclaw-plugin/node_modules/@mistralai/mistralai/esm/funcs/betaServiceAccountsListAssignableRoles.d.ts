import { MistralCore } from "../core.js";
import { RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import { ConnectionError, InvalidRequestError, RequestAbortedError, RequestTimeoutError, UnexpectedClientError } from "../models/errors/httpclienterrors.js";
import * as errors from "../models/errors/index.js";
import { MistralError } from "../models/errors/mistralerror.js";
import { ResponseValidationError } from "../models/errors/responsevalidationerror.js";
import { SDKValidationError } from "../models/errors/sdkvalidationerror.js";
import * as operations from "../models/operations/index.js";
import { APIPromise } from "../types/async.js";
import { Result } from "../types/fp.js";
/**
 * List Assignable Service Account Roles
 *
 * @remarks
 * List the workspace roles that can be assigned to a service account.
 *
 * Requires the `see_all_workspace_service_accounts` permission.
 */
export declare function betaServiceAccountsListAssignableRoles(client: MistralCore, request: operations.ListAssignableServiceAccountRolesV1ServiceAccountsAssignableRolesGetRequest, options?: RequestOptions): APIPromise<Result<components.ListAssignableServiceAccountRolesResponse, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
//# sourceMappingURL=betaServiceAccountsListAssignableRoles.d.ts.map