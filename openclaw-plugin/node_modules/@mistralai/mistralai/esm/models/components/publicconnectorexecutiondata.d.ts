import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ExecutionTool } from "./executiontool.js";
import { PublicExecutionConnector } from "./publicexecutionconnector.js";
export type PublicConnectorExecutionData = {
    integrations: Array<PublicExecutionConnector>;
    tools: Array<ExecutionTool>;
    useConnectorsGateway: boolean;
};
/** @internal */
export declare const PublicConnectorExecutionData$inboundSchema: z.ZodType<PublicConnectorExecutionData, unknown>;
export declare function publicConnectorExecutionDataFromJSON(jsonString: string): SafeParseResult<PublicConnectorExecutionData, SDKValidationError>;
//# sourceMappingURL=publicconnectorexecutiondata.d.ts.map