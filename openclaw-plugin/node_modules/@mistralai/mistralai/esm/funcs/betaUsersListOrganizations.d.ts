import { MistralCore } from "../core.js";
import { RequestOptions } from "../lib/sdks.js";
import { ConnectionError, InvalidRequestError, RequestAbortedError, RequestTimeoutError, UnexpectedClientError } from "../models/errors/httpclienterrors.js";
import { MistralError } from "../models/errors/mistralerror.js";
import { ResponseValidationError } from "../models/errors/responsevalidationerror.js";
import { SDKValidationError } from "../models/errors/sdkvalidationerror.js";
import * as operations from "../models/operations/index.js";
import { APIPromise } from "../types/async.js";
import { Result } from "../types/fp.js";
import { PageIterator } from "../types/operations.js";
/**
 * List Organizations
 *
 * @remarks
 * List every organization the authenticated user is a member of.
 *
 * Identity-only: the caller need not have selected an organization, so this
 * reads only the user and never scopes by the active org.
 */
export declare function betaUsersListOrganizations(client: MistralCore, security: operations.UsersApiListOrganizationsSecurity, request?: operations.UsersApiListOrganizationsRequest | undefined, options?: RequestOptions): APIPromise<PageIterator<Result<operations.UsersApiListOrganizationsResponse, MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>, {
    offset: number;
}>>;
//# sourceMappingURL=betaUsersListOrganizations.d.ts.map