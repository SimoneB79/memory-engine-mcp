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
 * Share a private connector to the current workspace.
 *
 * @remarks
 * Transfers ownership of a private user-owned connector to the current workspace, making it available to all workspace members. The creator can later revert this via the unshare endpoint. Any authentication flows that rely on the original owner's identity (e.g. OAuth on-behalf-of) will be affected and must be reconfigured after sharing. Only the connector's creator can call this endpoint. Requires the ShareConnectorToWorkspace workspace permission.
 */
export declare function betaConnectorsShare(client: MistralCore, request: operations.ConnectorShareV1Request, options?: RequestOptions): APIPromise<Result<components.MessageResponse, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
//# sourceMappingURL=betaConnectorsShare.d.ts.map