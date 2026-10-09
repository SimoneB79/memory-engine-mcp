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
 * Set Service Account Roles
 *
 * @remarks
 * Replace the workspace roles assigned to a service account.
 *
 * Requires the `manage_any_workspace_service_account` permission.
 */
export declare function betaServiceAccountsSetRoles(client: MistralCore, request: operations.SetServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesPutRequest, options?: RequestOptions): APIPromise<Result<components.ListServiceAccountRolesResponse, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
//# sourceMappingURL=betaServiceAccountsSetRoles.d.ts.map