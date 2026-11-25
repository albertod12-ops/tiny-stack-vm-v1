import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const P = readFileSync(join(I, id, 'program.bin'));
  const IN = readFileSync(join(I, id, 'input.bin'));
  const S: number[] = [];
  const C: number[] = [];
  const M = new Int32Array(256);
  const out: number[] = [];
  let pc = 0, steps = 0, ip = 0, code = 0, done = false;
  const trap = (c: number) => { code = c; done = true; };
  const need = (n: number) => { if (S.length < n) { trap(2); return false; } return true; };
  const push = (v: number) => { S.push(v | 0); if (S.length > 256) trap(3); };
  const imm16 = () => {
    if (pc + 2 >= P.length) { trap(9); return 0; }
    return ((P[pc + 1] | (P[pc + 2] << 8)) << 16) >> 16;
  };
  const imm16u = () => {
    if (pc + 2 >= P.length) { trap(9); return 0; }
    return P[pc + 1] | (P[pc + 2] << 8);
  };
  while (!done) {
    if (steps >= 1000000) { trap(10); break; }
    if (pc < 0 || pc >= P.length) { trap(9); break; }
    steps++;
    const op = P[pc];
    switch (op) {
      case 0x00: code = 0; done = true; break;
      case 0x01: {
        if (pc + 1 >= P.length) { trap(9); break; }
        push((P[pc + 1] << 24) >> 24);
        pc += 2;
        break;
      }
      case 0x02: {
        if (pc + 4 >= P.length) { trap(9); break; }
        push(P[pc + 1] | (P[pc + 2] << 8) | (P[pc + 3] << 16) | (P[pc + 4] << 24));
        pc += 5;
        break;
      }
      case 0x03:
        if (!need(1)) break;
        S.pop();
        pc++;
        break;
      case 0x04:
        if (!need(1)) break;
        push(S[S.length - 1]);
        pc++;
        break;
      case 0x05: {
        if (!need(2)) break;
        const t = S[S.length - 1];
        S[S.length - 1] = S[S.length - 2];
        S[S.length - 2] = t;
        pc++;
        break;
      }
      case 0x06:
        if (!need(2)) break;
        push(S[S.length - 2]);
        pc++;
        break;
      case 0x07: {
        if (!need(3)) break;
        const a = S[S.length - 3], b = S[S.length - 2], c = S[S.length - 1];
        S[S.length - 3] = b;
        S[S.length - 2] = c;
        S[S.length - 1] = a;
        pc++;
        break;
      }
      case 0x10: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push(a + b);
        pc++;
        break;
      }
      case 0x11: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push(a - b);
        pc++;
        break;
      }
      case 0x12: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push(Math.imul(a, b));
        pc++;
        break;
      }
      case 0x13: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        if (b === 0) { trap(4); break; }
        push(Math.trunc(a / b));
        pc++;
        break;
      }
      case 0x14: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        if (b === 0) { trap(4); break; }
        push(a % b);
        pc++;
        break;
      }
      case 0x15: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        if (b === 0) { trap(4); break; }
        push(Math.trunc((a >>> 0) / (b >>> 0)));
        pc++;
        break;
      }
      case 0x16: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        if (b === 0) { trap(4); break; }
        push((a >>> 0) % (b >>> 0));
        pc++;
        break;
      }
      case 0x17:
        if (!need(1)) break;
        push(-S.pop()!);
        pc++;
        break;
      case 0x18: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push(a & b);
        pc++;
        break;
      }
      case 0x19: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push(a | b);
        pc++;
        break;
      }
      case 0x1a: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push(a ^ b);
        pc++;
        break;
      }
      case 0x1b:
        if (!need(1)) break;
        push(~S.pop()!);
        pc++;
        break;
      case 0x1c: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push(a << b);
        pc++;
        break;
      }
      case 0x1d: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push(a >> b);
        pc++;
        break;
      }
      case 0x1e: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push(a >>> b);
        pc++;
        break;
      }
      case 0x20: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push(a === b ? 1 : 0);
        pc++;
        break;
      }
      case 0x21: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push(a < b ? 1 : 0);
        pc++;
        break;
      }
      case 0x22: {
        if (!need(2)) break;
        const b = S.pop()!, a = S.pop()!;
        push((a >>> 0) < (b >>> 0) ? 1 : 0);
        pc++;
        break;
      }
      case 0x30: {
        const o = imm16();
        if (done) break;
        pc = pc + 3 + o;
        break;
      }
      case 0x31: {
        const o = imm16();
        if (done) break;
        if (!need(1)) break;
        const v = S.pop()!;
        pc = v === 0 ? pc + 3 + o : pc + 3;
        break;
      }
      case 0x32: {
        const o = imm16();
        if (done) break;
        if (!need(1)) break;
        const v = S.pop()!;
        pc = v !== 0 ? pc + 3 + o : pc + 3;
        break;
      }
      case 0x33: {
        const a = imm16u();
        if (done) break;
        if (C.length >= 64) { trap(7); break; }
        C.push(pc + 3);
        pc = a;
        break;
      }
      case 0x34:
        if (C.length === 0) { trap(8); break; }
        pc = C.pop()!;
        break;
      case 0x40: {
        if (!need(1)) break;
        const a = S.pop()!;
        if (a < 0 || a > 255) { trap(6); break; }
        push(M[a]);
        pc++;
        break;
      }
      case 0x41: {
        if (!need(2)) break;
        const a = S.pop()!, v = S.pop()!;
        if (a < 0 || a > 255) { trap(6); break; }
        M[a] = v;
        pc++;
        break;
      }
      case 0x50: {
        if (!need(1)) break;
        const v = S.pop()!;
        const s = String(v);
        if (out.length + s.length > 65536) { trap(11); break; }
        for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
        pc++;
        break;
      }
      case 0x51: {
        if (!need(1)) break;
        const v = S.pop()!;
        if (out.length >= 65536) { trap(11); break; }
        out.push(v & 255);
        pc++;
        break;
      }
      case 0x52:
        push(ip < IN.length ? IN[ip++] : -1);
        pc++;
        break;
      case 0x53: {
        if (!need(1)) break;
        const v = S.pop()!;
        code = v & 255;
        done = true;
        break;
      }
      default:
        trap(5);
        break;
    }
  }
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), Buffer.from(out));
  writeFileSync(join(O, id, 'exit.txt'), code + '\n');
}
