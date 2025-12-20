import { base64UrlDecode, base64UrlEncode } from './vapid';

export interface EncryptionResult {
	ciphertext: Uint8Array;
	salt: Uint8Array;
	serverPublicKey: Uint8Array;
}

export interface SubscriptionKeys {
	p256dh: string;
	auth: string;
}

export async function encryptPayload(
	payload: string | Uint8Array,
	keys: SubscriptionKeys
): Promise<EncryptionResult> {
	const payloadBytes = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload;

	const subscriberPublicKey = base64UrlDecode(keys.p256dh);
	const authSecret = base64UrlDecode(keys.auth);

	const serverKeyPair = await crypto.subtle.generateKey(
		{ name: 'ECDH', namedCurve: 'P-256' },
		true,
		['deriveBits']
	);

	const serverPublicKeyRaw = new Uint8Array(
		await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
	);

	const subscriberKey = await crypto.subtle.importKey(
		'raw',
		subscriberPublicKey.buffer as ArrayBuffer,
		{ name: 'ECDH', namedCurve: 'P-256' },
		false,
		[]
	);

	const sharedSecret = new Uint8Array(
		await crypto.subtle.deriveBits(
			{ name: 'ECDH', public: subscriberKey },
			serverKeyPair.privateKey,
			256
		)
	);

	const salt = crypto.getRandomValues(new Uint8Array(16));

	const { contentEncryptionKey, nonce } = await deriveKeyAndNonce(
		sharedSecret,
		authSecret,
		salt,
		subscriberPublicKey,
		serverPublicKeyRaw
	);

	const paddedPayload = addPadding(payloadBytes);

	const ciphertext = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: nonce.buffer as ArrayBuffer, tagLength: 128 },
			contentEncryptionKey,
			paddedPayload.buffer as ArrayBuffer
		)
	);

	return { ciphertext, salt, serverPublicKey: serverPublicKeyRaw };
}

async function deriveKeyAndNonce(
	sharedSecret: Uint8Array,
	authSecret: Uint8Array,
	salt: Uint8Array,
	subscriberPublicKey: Uint8Array,
	serverPublicKey: Uint8Array
): Promise<{ contentEncryptionKey: CryptoKey; nonce: Uint8Array }> {
	const sharedSecretKey = await crypto.subtle.importKey(
		'raw',
		sharedSecret.buffer as ArrayBuffer,
		'HKDF',
		false,
		['deriveBits', 'deriveKey']
	);

	const infoPrefix = new TextEncoder().encode('WebPush: info\0');
	const prkInfo = concatBuffers(infoPrefix, subscriberPublicKey, serverPublicKey);

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

	const prk = await crypto.subtle.importKey('raw', prkBits, 'HKDF', false, [
		'deriveBits',
		'deriveKey'
	]);

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

	const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');
	const nonceBits = await crypto.subtle.deriveBits(
		{
			name: 'HKDF',
			hash: 'SHA-256',
			salt: salt.buffer as ArrayBuffer,
			info: nonceInfo.buffer as ArrayBuffer
		},
		prk,
		96
	);

	return { contentEncryptionKey, nonce: new Uint8Array(nonceBits) };
}

function addPadding(payload: Uint8Array, paddingLength: number = 0): Uint8Array {
	const padded = new Uint8Array(2 + paddingLength + payload.length);
	padded[0] = (paddingLength >> 8) & 0xff;
	padded[1] = paddingLength & 0xff;
	padded.set(payload, 2 + paddingLength);
	return padded;
}

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

export function buildEncryptedBody(encryption: EncryptionResult): Uint8Array {
	const recordSize = 4096;
	const keyId = encryption.serverPublicKey;

	const header = new Uint8Array(16 + 4 + 1 + keyId.length);
	header.set(encryption.salt, 0);
	header[16] = (recordSize >> 24) & 0xff;
	header[17] = (recordSize >> 16) & 0xff;
	header[18] = (recordSize >> 8) & 0xff;
	header[19] = recordSize & 0xff;
	header[20] = keyId.length;
	header.set(keyId, 21);

	return concatBuffers(header, encryption.ciphertext);
}

export { base64UrlEncode };
