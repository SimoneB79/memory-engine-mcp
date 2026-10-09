// Doctor contract for Memory Engine.
//
// The plugin keeps all of its state in its own SQLite database (MEMORY_DB_PATH)
// plus its own backups directory. It owns no legacy OpenClaw channel/session
// state and performs no host-state migrations, so it declares an EMPTY
// stateMigrations surface. Combined with the manifest declaration
// "doctorContract": { "stateMigrations": [] } this lets `openclaw doctor`
// inspect the plugin as stateless and close the data/settings upgrade
// handshake instead of leaving it pending forever.

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

export const stateMigrations: PluginDoctorStateMigration[] = [];

export default { stateMigrations };
