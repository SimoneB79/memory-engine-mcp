import { MistralCore } from "../core.js";
import { EventStream } from "../lib/event-streams.js";
import { RequestOptions } from "../lib/sdks.js";
import { ConnectionError, InvalidRequestError, RequestAbortedError, RequestTimeoutError, UnexpectedClientError } from "../models/errors/httpclienterrors.js";
import * as errors from "../models/errors/index.js";
import { MistralError } from "../models/errors/mistralerror.js";
import { ResponseValidationError } from "../models/errors/responsevalidationerror.js";
import { SDKValidationError } from "../models/errors/sdkvalidationerror.js";
import * as operations from "../models/operations/index.js";
import { APIPromise } from "../types/async.js";
import { Result } from "../types/fp.js";
/**
 * Stream Workflow Execution Logs
 *
 * @remarks
 * Stream logs for a workflow execution via SSE.
 *
 * Resume cursor comes from the `Last-Event-ID` header or `last_event_id` query param (header wins)
 * and takes precedence over `after`; omit all to tail from the execution start.
 */
export declare function workflowsExecutionsStreamWorkflowExecutionLogs(client: MistralCore, request: operations.StreamWorkflowExecutionLogsRequest, options?: RequestOptions): APIPromise<Result<EventStream<operations.StreamWorkflowExecutionLogsResponseBody>, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
//# sourceMappingURL=workflowsExecutionsStreamWorkflowExecutionLogs.d.ts.map