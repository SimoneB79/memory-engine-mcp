import * as z from "zod/v4";
import { RegisterDeploymentRequestVespaIndex, RegisterDeploymentRequestVespaIndex$Outbound } from "./registerdeploymentrequestvespaindex.js";
export type RegisterDeploymentRequestVespaDeployment = {
    type: "vespa";
    vespaVersion: string;
    indexes: Array<RegisterDeploymentRequestVespaIndex>;
    queryUrl: string;
};
/** @internal */
export type RegisterDeploymentRequestVespaDeployment$Outbound = {
    type: "vespa";
    vespa_version: string;
    indexes: Array<RegisterDeploymentRequestVespaIndex$Outbound>;
    query_url: string;
};
/** @internal */
export declare const RegisterDeploymentRequestVespaDeployment$outboundSchema: z.ZodType<RegisterDeploymentRequestVespaDeployment$Outbound, RegisterDeploymentRequestVespaDeployment>;
export declare function registerDeploymentRequestVespaDeploymentToJSON(registerDeploymentRequestVespaDeployment: RegisterDeploymentRequestVespaDeployment): string;
//# sourceMappingURL=registerdeploymentrequestvespadeployment.d.ts.map