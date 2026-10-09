import type { Span, Tracer, TracerProvider } from "@opentelemetry/api";
import type { ManagedTelemetryTracerProvider } from "../extra/observability/telemetry.js";
import { AfterErrorContext, AfterErrorHook, AfterSuccessContext, AfterSuccessHook, BeforeRequestContext, BeforeRequestHook, HookContext, SDKInitHook, SDKInitOptions } from "./types.js";
export declare const TRACING_SPAN_KEY = "_tracingSpan";
export declare const TRACING_BODY_KEY = "_tracingBody";
export declare const TRACING_TRACER_KEY = "_tracingTracer";
export type TracingContext = HookContext & {
    [TRACING_SPAN_KEY]?: Span;
    [TRACING_BODY_KEY]?: string | null;
    [TRACING_TRACER_KEY]?: Tracer;
};
export declare class TracingHook implements SDKInitHook, BeforeRequestHook, AfterSuccessHook, AfterErrorHook {
    #private;
    readonly _mistralTracingHook = true;
    tracerProvider: TracerProvider | undefined;
    _autoTelemetryProvider: ManagedTelemetryTracerProvider | undefined;
    _telemetryInitialization: Promise<boolean> | undefined;
    _telemetryConfigurationVersion: number;
    _telemetryAutoDisabled: boolean;
    _telemetryUseGlobalProvider: boolean;
    sdkInit(opts: SDKInitOptions): SDKInitOptions;
    beforeRequest(hookCtx: BeforeRequestContext, request: Request): Promise<Request>;
    afterSuccess(hookCtx: AfterSuccessContext, response: Response): Promise<Response>;
    afterError(hookCtx: AfterErrorContext, response: Response | null, error: unknown): Promise<{
        response: Response | null;
        error: unknown;
    }>;
}
//# sourceMappingURL=tracing.d.ts.map