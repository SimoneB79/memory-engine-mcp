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
 * Get Workflow Execution Logs
 *
 * @remarks
 * Retrieve logs for a workflow execution.
 *
 * Use `after`/`before`/`order` on the first request to set the time range and sort order; for
 * the next pages pass the `cursor` from the previous response (it remembers the range and order).
 */
export declare function workflowsExecutionsGetWorkflowExecutionLogs(client: MistralCore, request: operations.GetWorkflowExecutionLogsRequest, options?: RequestOptions): APIPromise<Result<components.ExecutionLogSearchResponse, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
//# sourceMappingURL=workflowsExecutionsGetWorkflowExecutionLogs.d.ts.map