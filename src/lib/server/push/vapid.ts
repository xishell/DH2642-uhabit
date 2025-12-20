export async function generateVapidHeaders(
	endpoint: string,
	vapidPublicKey: string,
	vapidPrivateKey: string,
	expiration: number = 12 * 60 * 60
): Promise<{ authorization: string; cryptoKey: string }> {
	const endpointUrl = new URL(endpoint);
	const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

	const now = Math.floor(Date.now() / 1000);
	const exp = now + expiration;

	const header = { typ: 'JWT', alg: 'ES256' };
	const payload = { aud: audience, exp: exp, sub: 'mailto:noreply@uhabit.app' };
	const jwt = await signJwt(header, payload, vapidPrivateKey);

	return {
		authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
		cryptoKey: `p256ecdsa=${vapidPublicKey}`
	};
}

async function signJwt(
	header: Record<string, string>,
	payload: Record<string, unknown>,
	privateKeyBase64: string
): Promise<string> {
	const headerB64 = base64UrlEncode(JSON.stringify(header));
	const payloadB64 = base64UrlEncode(JSON.stringify(payload));
	const unsignedToken = `${headerB64}.${payloadB64}`;

	const privateKey = await importPrivateKey(privateKeyBase64);
	const signature = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: 'SHA-256' },
		privateKey,
		new TextEncoder().encode(unsignedToken)
	);

	return `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
	const keyData = base64UrlDecode(privateKeyBase64);

	if (keyData.length !== 32) {
		throw new Error(`Invalid private key length: expected 32 bytes, got ${keyData.length}`);
	}

	const pkcs8 = buildPkcs8(keyData);
	return crypto.subtle.importKey(
		'pkcs8',
		pkcs8.buffer as ArrayBuffer,
		{ name: 'ECDSA', namedCurve: 'P-256' },
		false,
		['sign']
	);
}

function buildPkcs8(privateKeyBytes: Uint8Array): Uint8Array {
	const ecPublicKeyOid = new Uint8Array([0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01]);
	const prime256v1Oid = new Uint8Array([
		0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07
	]);

	const innerKey = new Uint8Array([0x30, 0x22, 0x02, 0x01, 0x01, 0x04, 0x20, ...privateKeyBytes]);

	const algorithmId = new Uint8Array([
		0x30,
		ecPublicKeyOid.length + prime256v1Oid.length,
		...ecPublicKeyOid,
		...prime256v1Oid
	]);

	const wrappedKey = new Uint8Array([0x04, innerKey.length, ...innerKey]);
	const version = new Uint8Array([0x02, 0x01, 0x00]);
	const totalLength = version.length + algorithmId.length + wrappedKey.length;

	return new Uint8Array([0x30, totalLength, ...version, ...algorithmId, ...wrappedKey]);
}

function base64UrlEncode(data: string | Uint8Array): string {
	const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
	const base64 = btoa(String.fromCharCode(...bytes));
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
	const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
	const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

export { base64UrlEncode, base64UrlDecode };
