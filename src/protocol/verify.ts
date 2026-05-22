import { bytesToUint16, fromHex } from '../core/encoding';
import { doubleSha256Hex } from '../core/hash';
import { MSG_SPECS } from './spec';

const SPECS_BY_TYPE = Object.values(MSG_SPECS);

export function verifyReturnedFullMessageLength(rawBytes: Uint8Array | string): boolean {
  const bytes = typeof rawBytes === 'string' ? fromHex(rawBytes) : rawBytes;
  if (bytes.length < 2) {
    return false;
  }

  const msgType = bytesToUint16(bytes.slice(0, 2));
  const spec = SPECS_BY_TYPE.find(item => item.msgType === msgType);
  return spec ? bytes.length === spec.fullLength : false;
}

export async function verifyTxid(rawBytes: Uint8Array | string, txid: string): Promise<boolean> {
  const bytes = typeof rawBytes === 'string' ? fromHex(rawBytes) : rawBytes;
  return (await doubleSha256Hex(bytes)) === txid.replace(/^0x/, '').toLowerCase();
}
