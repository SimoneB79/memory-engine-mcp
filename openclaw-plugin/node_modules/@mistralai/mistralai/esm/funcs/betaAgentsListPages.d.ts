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
 * List agent entities, cursor-paginated.
 *
 * @remarks
 * Retrieve a page of agent entities. Unlike the deprecated `GET /v1/agents`, this endpoint paginates by opaque cursor and honors per-agent sharing, returning only agents the caller is authorized to see.
 */
export declare function betaAgentsListPages(client: MistralCore, request?: operations.AgentsApiV1AgentsListPagesRequest | undefined, options?: RequestOptions): APIPromise<PageIterator<Result<operations.AgentsApiV1AgentsListPagesResponse, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>, {
    cursor: string;
}>>;
//# sourceMappingURL=betaAgentsListPages.d.ts.map