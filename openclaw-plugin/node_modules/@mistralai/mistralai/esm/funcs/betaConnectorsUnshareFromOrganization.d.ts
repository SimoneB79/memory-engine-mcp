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
 * Unshare a connector from the current organization.
 *
 * @remarks
 * Reverts an organization-shared connector back to a private, creator-owned connector. Organization-scoped connections and other members' connections are removed; the creator's own connection is preserved. Requires the ShareConnectorToOrg organization permission.
 */
export declare function betaConnectorsUnshareFromOrganization(client: MistralCore, request: operations.ConnectorUnshareFromOrganizationV1Request, options?: RequestOptions): APIPromise<Result<components.MessageResponse, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
//# sourceMappingURL=betaConnectorsUnshareFromOrganization.d.ts.map