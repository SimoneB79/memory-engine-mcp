import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ConnectionConfigType } from "./connectionconfigtype.js";
import { ToolExecutionConfiguration } from "./toolexecutionconfiguration.js";
/**
 * Connection config exposed in the public, unauthenticated /connectors/mistral response.
 *
 * @remarks
 *
 * Unlike ConnectionConfig, this has no `headers` field and forbids extra fields, so
 * connector credentials can never be serialized into this cacheable response.
 */
export type PublicExecutionConnectionConfig = {
    type: ConnectionConfigType;
    server?: string | null | undefined;
    name?: string | null | undefined;
    id?: string | null | undefined;
    toolConfiguration?: ToolExecutionConfiguration | null | undefined;
    hostedInternally: boolean;
};
/** @internal */
export declare const PublicExecutionConnectionConfig$inboundSchema: z.ZodType<PublicExecutionConnectionConfig, unknown>;
export declare function publicExecutionConnectionConfigFromJSON(jsonString: string): SafeParseResult<PublicExecutionConnectionConfig, SDKValidationError>;
//# sourceMappingURL=publicexecutionconnectionconfig.d.ts.map