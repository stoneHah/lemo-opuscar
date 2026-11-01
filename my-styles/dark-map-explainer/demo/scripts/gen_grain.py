# 生成纸纹颗粒 public/grain.png（中灰=中性，配合 overlay 混合）。用法：python3 scripts/gen_grain.py [宽 高]
import sys, numpy as np
from PIL import Image
W,H=(int(sys.argv[1]),int(sys.argv[2])) if len(sys.argv)>2 else (1920,1080)
rng=np.random.default_rng(7); n=rng.normal(0,1,(H,W))
f=np.fft.fftfreq(H)[:,None]**2+np.fft.fftfreq(W)[None,:]**2
low=np.real(np.fft.ifft2(np.fft.fft2(rng.normal(0,1,(H,W)))*np.exp(-f*4000))); low/=np.abs(low).max()
a=np.clip(0.5+0.10*n/3+0.18*low,0,1)
Image.fromarray(np.dstack([a*255,a*235,a*205,np.full_like(a,255)]).astype(np.uint8),'RGBA').save('public/grain.png',optimize=True); print('public/grain.png',W,H)
