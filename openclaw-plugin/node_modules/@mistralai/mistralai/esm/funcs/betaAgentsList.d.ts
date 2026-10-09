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
 * List agent entities.
 *
 * @remarks
 * Retrieve a list of agent entities sorted by creation time. Deprecated: some features such as agent sharing are not supported by this endpoint. Use the cursor-paginated `GET /v1/agents/pages` instead.
 *
 * @deprecated method: Some features such as agent sharing are not supported by this endpoint.. Use listPages instead.
 */
export declare function betaAgentsList(client: MistralCore, request?: operations.AgentsApiV1AgentsListRequest | undefined, options?: RequestOptions): APIPromise<Result<Array<components.Agent>, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
//# sourceMappingURL=betaAgentsList.d.ts.map