export interface BinFieldDef {
  name: string;
  type: string;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

interface BinReader {
  d: DataView;
  bytes: Uint8Array;
  off: number;
}

function readU8(r: BinReader): number { const v = r.d.getUint8(r.off); r.off += 1; return v; }
function readI8(r: BinReader): number { const v = r.d.getInt8(r.off); r.off += 1; return v; }
function readU16(r: BinReader): number { const v = r.d.getUint16(r.off, true); r.off += 2; return v; }
function readI16(r: BinReader): number { const v = r.d.getInt16(r.off, true); r.off += 2; return v; }
function readU32(r: BinReader): number { const v = r.d.getUint32(r.off, true); r.off += 4; return v; }
function readI32(r: BinReader): number { const v = r.d.getInt32(r.off, true); r.off += 4; return v; }
function readU64(r: BinReader): bigint { const lo = readU32(r); const hi = readU32(r); return BigInt(hi) * 0x100000000n + BigInt(lo); }
function readI64(r: BinReader): bigint { const lo = readU32(r); const hi = readI32(r); return BigInt(hi) * 0x100000000n + BigInt(lo); }
function readF32(r: BinReader): number { const v = r.d.getFloat32(r.off, true); r.off += 4; return v; }
function readF64(r: BinReader): number { const v = r.d.getFloat64(r.off, true); r.off += 8; return v; }

function readString(r: BinReader): string {
  const len = Number(readU64(r));
  const slice = r.bytes.slice(r.off, r.off + len);
  r.off += len;
  return new TextDecoder().decode(slice);
}

function readBool(r: BinReader): boolean { return readU8(r) !== 0; }

function readValue(r: BinReader, type: string): unknown {
  switch (type) {
    case 'u8': return readU8(r);
    case 'i8': return readI8(r);
    case 'u16': return readU16(r);
    case 'i16': return readI16(r);
    case 'u32': return readU32(r);
    case 'i32': return readI32(r);
    case 'u64': return Number(readU64(r));
    case 'i64': return Number(readI64(r));
    case 'f32': return readF32(r);
    case 'f64': return readF64(r);
    case 'bool': return readBool(r);
    case 'string': return readString(r);
    default: return `(unknown: ${type})`;
  }
}

export function decodeBincode(b64: string, fields: BinFieldDef[]): Record<string, unknown> | null {
  if (!fields.length || !b64) return null;

  try {
    const bytes = base64ToBytes(b64);
    const r: BinReader = { d: new DataView(bytes.buffer), bytes, off: 0 };

    const result: Record<string, unknown> = {};
    for (const f of fields) {
      if (r.off >= bytes.byteLength) break;
      result[f.name] = readValue(r, f.type);
    }
    return result;
  } catch {
    return null;
  }
}
