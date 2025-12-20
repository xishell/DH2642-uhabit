/**
 * Web Push payload encryption (RFC 8291)
 * Uses Web Crypto API for ECDH key exchange and AES-128-GCM encryption
 */

import { base64UrlDecode, base64UrlEncode } from './vapid';

export interface EncryptionResult {
	ciphertext: Uint8Array;
	salt: Uint8Array;
	serverPublicKey: Uint8Array;
}

export interface SubscriptionKeys {
	p256dh: string; // Base64 URL-safe encoded
	auth: string; // Base64 URL-safe encoded
}

/**
 * Encrypt a payload for Web Push delivery
 * @param payload The plaintext payload to encrypt
 * @param keys The subscriber's encryption keys (p256dh and auth)
 */
export async function encryptPayload(
	payload: string | Uint8Array,
	keys: SubscriptionKeys
): Promise<EncryptionResult> {
	const payloadBytes = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload;

	// Decode subscriber's keys
	const subscriberPublicKey = base64UrlDecode(keys.p256dh);
	const authSecret = base64UrlDecode(keys.auth);

	// Generate ephemeral key pair for ECDH
	const serverKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
		'deriveBits'
	]);

	// Export server public key as raw bytes
	const serverPublicKeyRaw = new Uint8Array(
		await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
	);

	// Import subscriber's public key
	const subscriberKey = await crypto.subtle.importKey(
		'raw',
		subscriberPublicKey.buffer as ArrayBuffer,
		{ name: 'ECDH', namedCurve: 'P-256' },
		false,
		[]
	);

	// Perform ECDH to get shared secret
	const sharedSecret = new Uint8Array(
		await crypto.subtle.deriveBits(
			{ name: 'ECDH', public: subscriberKey },
			serverKeyPair.privateKey,
			256
		)
	);

	// Generate random salt (16 bytes)
	const salt = crypto.getRandomValues(new Uint8Array(16));

	// Derive encryption key and nonce using HKDF
	const { contentEncryptionKey, nonce } = await deriveKeyAndNonce(
		sharedSecret,
		authSecret,
		salt,
		subscriberPublicKey,
		serverPublicKeyRaw
	);

	// Add padding to payload (RFC 8291 requires at least 1 byte of padding)
	const paddedPayload = addPadding(payloadBytes);

	// Encrypt with AES-128-GCM
	const ciphertext = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: nonce.buffer as ArrayBuffer, tagLength: 128 },
			contentEncryptionKey,
			paddedPayload.buffer as ArrayBuffer
		)
	);

	return {
		ciphertext,
		salt,
		serverPublicKey: serverPublicKeyRaw
	};
}

/**
 * Derive content encryption key and nonce using HKDF
 */
async function deriveKeyAndNonce(
	sharedSecret: Uint8Array,
	authSecret: Uint8Array,
	salt: Uint8Array,
	subscriberPublicKey: Uint8Array,
	serverPublicKey: Uint8Array
): Promise<{ contentEncryptionKey: CryptoKey; nonce: Uint8Array }> {
	// Import shared secret as HKDF key
	const sharedSecretKey = await crypto.subtle.importKey(
		'raw',
		sharedSecret.buffer as ArrayBuffer,
		'HKDF',
		false,
		['deriveBits', 'deriveKey']
	);

	// Create info for PRK derivation: "WebPush: info" || 0x00 || subscriber_key || server_key
	const infoPrefix = new TextEncoder().encode('WebPush: info\0');
	const prkInfo = concatBuffers(infoPrefix, subscriberPublicKey, serverPublicKey);

	// Derive PRK (Pseudo-Random Key) from shared secret and auth
	const prkBits = await crypto.subtle.deriveBits(
		{
			name: 'HKDF',
			hash: 'SHA-256',
			salt: authSecret.buffer as ArrayBuffer,
			info: prkInfo.buffer as ArrayBuffer
		},
		sharedSecretKey,
		256
	);

	// Import PRK for further derivation
	const prk = await crypto.subtle.importKey('raw', prkBits, 'HKDF', false, [
		'deriveBits',
		'deriveKey'
	]);

	// Derive content encryption key (CEK)
	// Info: "Content-Encoding: aes128gcm" || 0x00
	const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
	const contentEncryptionKey = await crypto.subtle.deriveKey(
		{
			name: 'HKDF',
			hash: 'SHA-256',
			salt: salt.buffer as ArrayBuffer,
			info: cekInfo.buffer as ArrayBuffer
		},
		prk,
		{ name: 'AES-GCM', length: 128 },
		false,
		['encrypt']
	);

	// Derive nonce
	// Info: "Content-Encoding: nonce" || 0x00
	const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');
	const nonceBits = await crypto.subtle.deriveBits(
		{
			name: 'HKDF',
			hash: 'SHA-256',
			salt: salt.buffer as ArrayBuffer,
			info: nonceInfo.buffer as ArrayBuffer
		},
		prk,
		96 // 12 bytes for AES-GCM nonce
	);

	return {
		contentEncryptionKey,
		nonce: new Uint8Array(nonceBits)
	};
}

/**
 * Add padding to payload per RFC 8291
 * Format: padding_length (2 bytes, big-endian) || padding || payload
 */
function addPadding(payload: Uint8Array, paddingLength: number = 0): Uint8Array {
	// Create padded payload: 2-byte length + padding + payload
	const padded = new Uint8Array(2 + paddingLength + payload.length);

	// Write padding length as 2-byte big-endian
	padded[0] = (paddingLength >> 8) & 0xff;
	padded[1] = paddingLength & 0xff;

	// Padding bytes are zeros (already initialized)
	// Copy payload after padding
	padded.set(payload, 2 + paddingLength);

	return padded;
}

/**
 * Concatenate multiple Uint8Arrays
 */
function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
	const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const buf of buffers) {
		result.set(buf, offset);
		offset += buf.length;
	}
	return result;
}

/**
 * Build the encrypted payload with headers for HTTP request
 * Returns the body for Content-Encoding: aes128gcm
 */
export function buildEncryptedBody(encryption: EncryptionResult): Uint8Array {
	// aes128gcm format:
	// salt (16 bytes) || record_size (4 bytes) || idlen (1 byte) || keyid || ciphertext

	const recordSize = 4096; // Standard record size
	const keyId = encryption.serverPublicKey;

	const header = new Uint8Array(16 + 4 + 1 + keyId.length);

	// Salt (16 bytes)
	header.set(encryption.salt, 0);

	// Record size (4 bytes, big-endian)
	header[16] = (recordSize >> 24) & 0xff;
	header[17] = (recordSize >> 16) & 0xff;
	header[18] = (recordSize >> 8) & 0xff;
	header[19] = recordSize & 0xff;

	// Key ID length (1 byte)
	header[20] = keyId.length;

	// Key ID (server public key)
	header.set(keyId, 21);

	// Combine header and ciphertext
	return concatBuffers(header, encryption.ciphertext);
}

export { base64UrlEncode };
