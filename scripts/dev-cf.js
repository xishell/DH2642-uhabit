import { spawn } from 'node:child_process';

// Start SvelteKit build in watch mode so Wrangler sees changes
const build = spawn('bun', ['run', 'build:watch'], {
	stdio: 'inherit',
	shell: true
});

// Start Wrangler dev server pointing at the Cloudflare build output
const wrangler = spawn(
	'bunx',
	[
		'wrangler',
		'pages',
		'dev',
		'.svelte-kit/cloudflare',
		'--compatibility-flag=nodejs_compat',
		'--live-reload'
	],
	{
		stdio: 'inherit',
		shell: true
	}
);

const cleanExit = () => {
	build.kill('SIGINT');
	wrangler.kill('SIGINT');
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
