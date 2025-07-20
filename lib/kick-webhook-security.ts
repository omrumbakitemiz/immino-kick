import crypto from 'crypto';

// Kick's public key for webhook verification (from their documentation)
const KICK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq/+l1WnlRrGSolDMA+A8
6rAhMbQGmQ2SapVcGM3zq8ANXjnhDWocMqfWcTd95btDydITa10kDvHzw9WQOqp2
MZI7ZyrfzJuz5nhTPCiJwTwnEtWft7nV14BYRDHvlfqPUaZ+1KR4OCaO/wWIk/rQ
L/TjY0M70gse8rlBkbo2a8rKhu69RQTRsoaf4DVhDPEeSeI5jVrRDGAMGL3cGuyY
6CLKGdjVEM78g3JfYOvDU/RvfqD7L89TZ3iN94jrmWdGz34JNlEI5hqK8dd7C5EF
BEbZ5jgB8s8ReQV8H+MkuffjdAj3ajDDX3DOJMIut1lBrUVD1AaSrGCKHooWoL2e
twIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Verify Kick webhook signature using their public key
 * Based on Kick API documentation: https://github.com/kickengineering/kickdevdocs
 */
export function verifyKickWebhookSignature(
  messageId: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  try {
    // Create the signature payload: messageId.timestamp.body
    const signaturePayload = `${messageId}.${timestamp}.${body}`;

    // Decode the base64 signature
    const decodedSignature = Buffer.from(signature, 'base64');

    // Create verifier with Kick's public key
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(signaturePayload, 'utf8');

    // Verify the signature
    const isValid = verifier.verify(KICK_PUBLIC_KEY, decodedSignature);

    console.log('🔐 Signature verification:', {
      messageId,
      timestamp,
      bodyLength: body.length,
      signatureLength: signature.length,
      isValid
    });

    return isValid;
  } catch (error) {
    console.error('❌ Signature verification failed:', error);
    return false;
  }
}

/**
 * Fetch the latest public key from Kick API
 * This can be used to update the key if needed
 */
export async function fetchKickPublicKey(): Promise<string | null> {
  try {
    const response = await fetch('https://api.kick.com/public/v1/public-key');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const publicKey = await response.text();
    console.log('🔑 Fetched fresh public key from Kick API');
    return publicKey;
  } catch (error) {
    console.error('❌ Failed to fetch public key from Kick:', error);
    return null;
  }
}
