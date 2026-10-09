import * as z from "zod/v4";
import { DeploymentK8sBackendSpec, DeploymentK8sBackendSpec$Outbound } from "./deploymentk8sbackendspec.js";
import { DeploymentKoyebBackendSpec, DeploymentKoyebBackendSpec$Outbound } from "./deploymentkoyebbackendspec.js";
export type WorkflowsWorkerSpecUpdateBackendSpec = DeploymentKoyebBackendSpec | DeploymentK8sBackendSpec;
export type WorkflowsWorkerSpecUpdate = {
    githubUrl?: string | null | undefined;
    revision?: string | null | undefined;
    /**
     * Backend-specific configuration. The arm's 'type' picks where the worker runs: 'koyeb' (the default for a new deployment) or 'kubernetes'. Cannot be combined with the deprecated top-level 'entrypoint' and 'working_dir'.
     */
    backendSpec?: DeploymentKoyebBackendSpec | DeploymentK8sBackendSpec | null | undefined;
    /**
     * Kubernetes-only. Setting it without 'backend_spec' selects the kubernetes backend, which is not generally available; setting it alongside 'backend_spec' returns 422.
     *
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    entrypoint?: string | null | undefined;
    /**
     * Kubernetes-only. Setting it without 'backend_spec' selects the kubernetes backend, which is not generally available; setting it alongside 'backend_spec' returns 422.
     *
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    workingDir?: string | null | undefined;
};
/** @internal */
export type WorkflowsWorkerSpecUpdateBackendSpec$Outbound = DeploymentKoyebBackendSpec$Outbound | DeploymentK8sBackendSpec$Outbound;
/** @internal */
export declare const WorkflowsWorkerSpecUpdateBackendSpec$outboundSchema: z.ZodType<WorkflowsWorkerSpecUpdateBackendSpec$Outbound, WorkflowsWorkerSpecUpdateBackendSpec>;
export declare function workflowsWorkerSpecUpdateBackendSpecToJSON(workflowsWorkerSpecUpdateBackendSpec: WorkflowsWorkerSpecUpdateBackendSpec): string;
/** @internal */
export type WorkflowsWorkerSpecUpdate$Outbound = {
    github_url?: string | null | undefined;
    revision?: string | null | undefined;
    backend_spec?: DeploymentKoyebBackendSpec$Outbound | DeploymentK8sBackendSpec$Outbound | null | undefined;
    entrypoint?: string | null | undefined;
    working_dir?: string | null | undefined;
};
/** @internal */
export declare const WorkflowsWorkerSpecUpdate$outboundSchema: z.ZodType<WorkflowsWorkerSpecUpdate$Outbound, WorkflowsWorkerSpecUpdate>;
export declare function workflowsWorkerSpecUpdateToJSON(workflowsWorkerSpecUpdate: WorkflowsWorkerSpecUpdate): string;
//# sourceMappingURL=workflowsworkerspecupdate.d.ts.map