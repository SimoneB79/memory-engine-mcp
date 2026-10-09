let registeredTracerProvider;
/**
 * Route SDK tracing spans to a specific OpenTelemetry tracer provider.
 */
export function registerTracerProvider(tracerProvider) {
    registeredTracerProvider = tracerProvider;
}
/**
 * Returns the currently registered tracer provider, if any.
 */
export function getRegisteredTracerProvider() {
    return registeredTracerProvider;
}
//# sourceMappingURL=provider.js.map