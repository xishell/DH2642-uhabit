/**
 * VAPID (Voluntary Application Server Identification) implementation
 * Uses Web Crypto API for ES256 JWT signing (Cloudflare Workers compatible)
 */

/**
 * Generate VAPID Authorization header for Web Push
 * @param endpoint Push subscription endpoint URL
 * @param vapidPublicKey Base64 URL-safe encoded public key
 * @param vapidPrivateKey Base64 URL-safe encoded private key
 * @param expiration JWT expiration time in seconds (default: 12 hours)
 */
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

	// JWT header
	const header = {
		typ: 'JWT',
		alg: 'ES256'
	};

	// JWT payload
	const payload = {
		aud: audience,
		exp: exp,
		sub: 'mailto:noreply@uhabit.app'
	};

	// Create JWT
	const jwt = await signJwt(header, payload, vapidPrivateKey);

	return {
		authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
		cryptoKey: `p256ecdsa=${vapidPublicKey}`
	};
}

/**
 * Sign a JWT using ES256 (ECDSA with P-256 and SHA-256)
 */
async function signJwt(
	header: Record<string, string>,
	payload: Record<string, unknown>,
	privateKeyBase64: string
): Promise<string> {
	// Encode header and payload
	const headerB64 = base64UrlEncode(JSON.stringify(header));
	const payloadB64 = base64UrlEncode(JSON.stringify(payload));
	const unsignedToken = `${headerB64}.${payloadB64}`;

	// Import private key
	const privateKey = await importPrivateKey(privateKeyBase64);

	// Sign the token
	const signature = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: 'SHA-256' },
		privateKey,
		new TextEncoder().encode(unsignedToken)
	);

	// Convert signature from DER to raw format if needed, then encode
	const signatureB64 = base64UrlEncode(new Uint8Array(signature));

	return `${unsignedToken}.${signatureB64}`;
}

/**
 * Import a base64 URL-safe encoded private key as a CryptoKey
 */
async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
	const keyData = base64UrlDecode(privateKeyBase64);

	// The key should be 32 bytes (256 bits) for P-256
	if (keyData.length !== 32) {
		throw new Error(`Invalid private key length: expected 32 bytes, got ${keyData.length}`);
	}

	// Create JWK from raw private key
	const jwk: JsonWebKey = {
		kty: 'EC',
		crv: 'P-256',
		// For ECDSA, we need x, y coordinates from public key and d from private key
		// Since we only have the private scalar, we need to derive the public key
		d: base64UrlEncode(keyData),
		// We'll use the key in a way that doesn't require x,y for signing
		x: '', // Placeholder - will be derived
		y: '' // Placeholder - will be derived
	};

	// For signing, we can import as a raw PKCS8 key instead
	// Build a minimal PKCS8 structure for EC private key
	const pkcs8 = buildPkcs8(keyData);

	return crypto.subtle.importKey(
		'pkcs8',
		pkcs8.buffer as ArrayBuffer,
		{ name: 'ECDSA', namedCurve: 'P-256' },
		false,
		['sign']
	);
}

/**
 * Build a PKCS8 structure for an EC private key
 * This wraps the raw 32-byte private key scalar in the proper ASN.1 structure
 */
function buildPkcs8(privateKeyBytes: Uint8Array): Uint8Array {
	// PKCS8 structure for EC key:
	// SEQUENCE {
	//   INTEGER 0 (version)
	//   SEQUENCE { OID ecPublicKey, OID prime256v1 }
	//   OCTET STRING { SEQUENCE { INTEGER 1, OCTET STRING privateKey } }
	// }

	const ecPublicKeyOid = new Uint8Array([0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01]);
	const prime256v1Oid = new Uint8Array([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]);

	// Inner EC private key structure
	const innerKey = new Uint8Array([
		0x30,
		0x22, // SEQUENCE, length 34
		0x02,
		0x01,
		0x01, // INTEGER 1 (version)
		0x04,
		0x20, // OCTET STRING, length 32
		...privateKeyBytes
	]);

	// Algorithm identifier sequence
	const algorithmId = new Uint8Array([
		0x30,
		ecPublicKeyOid.length + prime256v1Oid.length, // SEQUENCE length
		...ecPublicKeyOid,
		...prime256v1Oid
	]);

	// Wrap inner key in OCTET STRING
	const wrappedKey = new Uint8Array([0x04, innerKey.length, ...innerKey]);

	// Version
	const version = new Uint8Array([0x02, 0x01, 0x00]); // INTEGER 0

	// Total length
	const totalLength = version.length + algorithmId.length + wrappedKey.length;

	// Build final PKCS8
	const pkcs8 = new Uint8Array([0x30, totalLength, ...version, ...algorithmId, ...wrappedKey]);

	return pkcs8;
}

/**
 * Base64 URL-safe encode
 */
function base64UrlEncode(data: string | Uint8Array): string {
	const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
	const base64 = btoa(String.fromCharCode(...bytes));
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64 URL-safe decode
 */
function base64UrlDecode(str: string): Uint8Array {
	// Add padding if needed
	const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
	// Convert URL-safe chars back
	const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

export { base64UrlEncode, base64UrlDecode };
