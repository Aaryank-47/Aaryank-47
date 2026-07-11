/**
 * Application configuration contract.
 * The only place this is populated from process.env is src/config/github.ts.
 */
export interface AppConfig {
  readonly token: string;
  readonly username: string;
  readonly outputDir: string;
}
