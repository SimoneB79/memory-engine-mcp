import type { TracerProvider } from "@opentelemetry/api";
/**
 * Route SDK tracing spans to a specific OpenTelemetry tracer provider.
 */
export declare function registerTracerProvider(tracerProvider?: TracerProvider): void;
/**
 * Returns the currently registered tracer provider, if any.
 */
export declare function getRegisteredTracerProvider(): TracerProvider | undefined;
//# sourceMappingURL=provider.d.ts.map