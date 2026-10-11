export interface PluginDoctorStateMigration {
    id: string;
    label: string;
    phase?: string;
    doctorOnly?: boolean;
    migrateLegacyState: (input: unknown) => Promise<{
        changes: unknown[];
        warnings: string[];
        notices?: string[];
        warningDisposition?: "recoverable";
    }>;
}
export declare const stateMigrations: PluginDoctorStateMigration[];
declare const _default: {
    stateMigrations: PluginDoctorStateMigration[];
};
export default _default;
