# 老配乐循环延长（恒定音量、不 ducking、尾部淡出）+ 代码合成轻音效 -> 母带 -14 LUFS / TP<=-1.2 dBTP
import json, numpy as np, subprocess, wave, re
SR=48000
ev=json.load(open('audio/events.json')); DUR=ev['dur']; N=int(DUR*SR)+SR
rng=np.random.default_rng(11)
def sh(c): return subprocess.run(c,shell=True,check=True,capture_output=True,text=True)
def wr(p,a):
    a=np.clip(a,-1,1); st=np.stack([a,a],1) if a.ndim==1 else a
    w=wave.open(p,'w'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes()); w.close()
import os
M=os.environ.get('MUSIC','/workspace/blackgold-template/assets/music.mp3')  # the user's own track, not shipped
sh(f"ffmpeg -y -v error -i {M} -i {M} -i {M} -filter_complex '[0][1]acrossfade=d=4:c1=tri:c2=tri[ab];[ab][2]acrossfade=d=4:c1=tri:c2=tri,atrim=0:{DUR:.3f},afade=t=out:st={DUR-4.5:.3f}:d=4.4' -ar {SR} -ac 2 audio/music_ext.wav")
w=wave.open('audio/music_ext.wav'); m=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32).reshape(-1,2)/32768
mus=np.zeros((N,2),np.float32); mus[:len(m)]=m[:N]
sfx=np.zeros(N,np.float32)
def add(t0,sig,g=1.0):
    i=int(t0*SR); j=min(N,i+len(sig)); 
    if i<N: sfx[i:j]+=sig[:j-i]*g
def env(n,a=0.01,d=0.5): tt=np.arange(n)/SR; return np.minimum(1,tt/a)*np.exp(-tt/d)
def noise(n): return rng.standard_normal(n).astype(np.float32)
def lp(x,fc):
    a=np.exp(-2*np.pi*np.asarray(fc,dtype=np.float64)/SR)*np.ones(len(x)); y=np.zeros_like(x); s=0.0
    for k in range(len(x)): s=a[k]*s+(1-a[k])*x[k]; y[k]=s
    return y
def bell(f,d=1.4): n=int(d*SR); tt=np.arange(n)/SR; return ((np.sin(2*np.pi*f*tt)+0.35*np.sin(2*np.pi*f*2.76*tt)*np.exp(-tt*3))*env(n,0.004,0.45)*0.5).astype(np.float32)
def whoosh(d,f0,f1):
    n=int(d*SR); x=np.linspace(0,1,n); fc=f0*(f1/f0)**x; e=np.sin(np.pi*x)**1.6
    return ((lp(noise(n),fc)-lp(noise(n),fc*0.3))*e*1.5).astype(np.float32)
def tick(): # 轻柔打字声：短促带通噪声
    n=int(0.035*SR); x=noise(n)*env(n,0.0008,0.006); return (x-lp(x,900)).astype(np.float32)
TK=[tick() for _ in range(8)]
for c in ev['chars']: add(c+rng.uniform(0,0.01),TK[rng.integers(0,8)],0.10*rng.uniform(0.7,1.0))
for u in ev['under']: add(u,whoosh(0.45,1200,5000),0.05)
for c in ev['cards']: add(c,bell(1318,1.1),0.05); add(c,bell(659,1.3),0.04)
add(ev['scroll'],whoosh(1.0,400,2600),0.12)
for a,d in ev['moves'][1:]: add(a,whoosh(d,120,700),0.10)
add(ev['river'][0],whoosh(ev['river'][1],180,1400),0.16)
n=int(ev['sed'][1]*SR); add(ev['sed'][0],((lp(noise(n),2600)-lp(noise(n),700))*np.sin(np.pi*np.linspace(0,1,n))**0.7).astype(np.float32),0.08)
tt=ev['rings'][0]
while tt<ev['rings'][0]+ev['rings'][1]:
    n=int(1.2*SR); x=np.arange(n)/SR; add(tt,(np.sin(2*np.pi*55*x)*env(n,0.02,0.4)).astype(np.float32),0.22); tt+=1.0
add(ev['ruler'],bell(988,1.0),0.05)
add(ev['red'],bell(392,1.6),0.06)
add(ev['coast'],whoosh(3.2,300,2400),0.09)
for i in range(10):
    n=int(0.12*SR); x=np.arange(n)/SR; f=np.linspace(2600,3900,n); add(ev['birds']+0.6+i*0.4+rng.uniform(0,0.1),(np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*x/0.12)*0.3).astype(np.float32),0.06)
add(ev['end']+0.3,bell(392,3.0),0.05)
mix=mus*1.0+sfx[:,None]
mix=mix[:int(DUR*SR)]
wr('audio/mix_raw.wav',mix)
def meas(p):
    r=sh(f"ffmpeg -nostats -i {p} -af ebur128=peak=true -f null - 2>&1 || true").stdout
    r=subprocess.run(f"ffmpeg -nostats -i {p} -af ebur128=peak=true -f null -",shell=True,capture_output=True,text=True).stderr
    I=float(re.findall(r"I:\s+(-?[\d.]+) LUFS",r)[-1]); TP=float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS",r)[-1]); return I,TP
I,TP=meas('audio/mix_raw.wav'); print('raw',I,TP)
g=-14.0-I
sh(f"ffmpeg -y -v error -i audio/mix_raw.wav -af 'volume={g:.2f}dB,alimiter=limit=0.80:level=false:attack=3:release=80,aresample=192000,alimiter=limit=0.82:level=false,aresample=48000' audio/master.wav")
I2,TP2=meas('audio/master.wav'); print('master',I2,TP2)
if abs(I2+14)>0.3:
    g2=-14.0-I2; sh(f"ffmpeg -y -v error -i audio/master.wav -af 'volume={g2:.2f}dB,alimiter=limit=0.82:level=false' audio/master2.wav && mv audio/master2.wav audio/master.wav"); print('master2',meas('audio/master.wav'))
sh("ffmpeg -y -v error -i audio/master.wav -c:a aac -b:a 256k audio/master.m4a"); print('aac',meas('audio/master.m4a'))
