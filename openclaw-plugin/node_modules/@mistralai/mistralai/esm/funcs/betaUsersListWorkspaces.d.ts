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
 * List Workspaces
 *
 * @remarks
 * List every workspace the authenticated user is a member of, across all
 * their organizations, each tagged with the organization it belongs to.
 */
export declare function betaUsersListWorkspaces(client: MistralCore, security: operations.UsersApiListWorkspacesSecurity, request?: operations.UsersApiListWorkspacesRequest | undefined, options?: RequestOptions): APIPromise<PageIterator<Result<operations.UsersApiListWorkspacesResponse, MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>, {
    offset: number;
}>>;
//# sourceMappingURL=betaUsersListWorkspaces.d.ts.map