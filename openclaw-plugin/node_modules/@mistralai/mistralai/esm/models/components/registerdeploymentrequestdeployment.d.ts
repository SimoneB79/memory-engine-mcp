import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
import { RegisterDeploymentRequestVespaDeployment, RegisterDeploymentRequestVespaDeployment$Outbound } from "./registerdeploymentrequestvespadeployment.js";
export declare const RegisterDeploymentRequestDeploymentStatus: {
    readonly Online: "online";
    readonly Offline: "offline";
};
export type RegisterDeploymentRequestDeploymentStatus = ClosedEnum<typeof RegisterDeploymentRequestDeploymentStatus>;
export type RegisterDeploymentRequestDeploymentDeployment = RegisterDeploymentRequestVespaDeployment;
export type RegisterDeploymentRequestDeployment = {
    name: string;
    status?: RegisterDeploymentRequestDeploymentStatus | undefined;
    deployment: RegisterDeploymentRequestVespaDeployment;
};
/** @internal */
export declare const RegisterDeploymentRequestDeploymentStatus$outboundSchema: z.ZodEnum<typeof RegisterDeploymentRequestDeploymentStatus>;
/** @internal */
export type RegisterDeploymentRequestDeploymentDeployment$Outbound = RegisterDeploymentRequestVespaDeployment$Outbound;
/** @internal */
export declare const RegisterDeploymentRequestDeploymentDeployment$outboundSchema: z.ZodType<RegisterDeploymentRequestDeploymentDeployment$Outbound, RegisterDeploymentRequestDeploymentDeployment>;
export declare function registerDeploymentRequestDeploymentDeploymentToJSON(registerDeploymentRequestDeploymentDeployment: RegisterDeploymentRequestDeploymentDeployment): string;
/** @internal */
export type RegisterDeploymentRequestDeployment$Outbound = {
    name: string;
    status: string;
    deployment: RegisterDeploymentRequestVespaDeployment$Outbound;
};
/** @internal */
export declare const RegisterDeploymentRequestDeployment$outboundSchema: z.ZodType<RegisterDeploymentRequestDeployment$Outbound, RegisterDeploymentRequestDeployment>;
export declare function registerDeploymentRequestDeploymentToJSON(registerDeploymentRequestDeployment: RegisterDeploymentRequestDeployment): string;
//# sourceMappingURL=registerdeploymentrequestdeployment.d.ts.map