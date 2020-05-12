## link

* https://dangokyo.me/2020/03/24/confidence-2020-ctf-chromatic-aberration-pwn-write-up/bin
* https://tcode2k16.github.io/blog/posts/2020-03-15-confidence-ctf/#chromatic-aberration


## Compile 

* original link for chall : https://confidence2020.p4.team/challenge/chromatic_aberration 

```code

# in v8 git directory

git checkout 8.1.307.20 -b chall 

git apply diff.patch 

gclient sync 

./tools/dev/v8gen.py x64.release

ninja -C ./out.gn/x64.release

# enjoy

```
