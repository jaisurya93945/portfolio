#!/usr/bin/env python3
"""
Build the two hero portraits from the supplied poster artwork.

    python3 scripts/build-portrait.py <source.webp> [--write]

Without --write it only renders previews next to the source, so the result
can be looked at before it replaces anything.

The source is a designed poster: the subject on a slate blue ground, split
down the middle between a photograph and a line drawing, with decorative
rules down both edges and a dither field over the background.

Dark and light need genuinely different treatments, which is the whole
reason this script exists:

  dark   the ground is retoned to the site's blue-black and kept, so it
         fades into the page and gives the portrait a halo.

  light  the same ground painted onto paper is a grey disc sitting on the
         page, so it is cut away instead and the subject stands on the
         paper. The cut is made on colour, not brightness: the ground is
         the only strongly blue thing in frame (B-R +42) against the hair
         at +11 and the suit at +13 — a brightness cut throws the hair away
         with the background, because they are the same brightness.
"""
from PIL import Image, ImageFilter
import numpy as np, os, sys

args = [a for a in sys.argv[1:] if not a.startswith('-')]
if not args:
    sys.exit(__doc__.strip())
SRC = args[0]
OUT = os.path.dirname(os.path.abspath(SRC)) + '/'
DST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'assets', 'img') + os.sep

im=Image.open(SRC).convert('RGB'); W,H=im.size
a=np.asarray(im,np.float32)
top,bot,left,right=int(H*.035),int(H*.995),int(W*.10),int(W*.93)
a=a[top:bot,left:right]; h,w,_=a.shape
lum=0.2126*a[:,:,0]+0.7152*a[:,:,1]+0.0722*a[:,:,2]
seam=635-left
GROUND=84.0

def tone(L,shadow,mid,high,k=0.42):
    t=(L/255.0)[...,None]
    s=np.array(shadow,np.float32);m=np.array(mid,np.float32);hi=np.array(high,np.float32)
    lo=np.clip(t/k,0,1); up=np.clip((t-k)/(1-k),0,1)
    return np.where(t<k, s+(m-s)*lo, m+(hi-m)*up)

def blur(m,r):
    return np.asarray(Image.fromarray((np.clip(m,0,1)*255).astype('uint8'),'L')
                      .filter(ImageFilter.GaussianBlur(r)),np.float32)/255.

yy,xx=np.mgrid[0:h,0:w]
d=np.sqrt(((xx-w*0.50)/(w*0.42))**2+((yy-h*0.45)/(h*0.47))**2)
# the poster runs decorative rules and squares down both edges
gx=np.clip((xx-w*0.055)/(w*0.06),0,1)*np.clip((w*0.945-xx)/(w*0.06),0,1)

# The slate ground is the only strongly blue thing in frame: B-R is +42 on
# it against +11 on the hair, +13 on the suit and +1 on the shirt. Cutting
# on colour keeps the dark hair that a luminance cut loses to the
# background, because hair and background are the same brightness.
br = a[:,:,2]-a[:,:,0]
keep = 1.0 - np.clip((br-27.0)/13.0, 0, 1)
# The soft edge of the disc behind the head survives that at about 18%
# opacity, which on paper is a grey cloud rather than an edge. Collapse the
# partials: anything less than a third kept is ground.
keep = np.clip((keep-0.34)/0.34, 0, 1)
# The poster also lays a dither field over the ground. Its dots are isolated
# and a few pixels across, where the drawing's strokes are long and joined,
# so a median pass removes one and leaves the other. Confined to the
# periphery: the face and the drawing itself are never touched.
dk = np.asarray(Image.fromarray((keep*255).astype('uint8'),'L')
                .filter(ImageFilter.MedianFilter(7)),np.float32)/255.
edge = np.clip((d-0.52)/0.16,0,1)
keep = blur(keep*(1-edge) + dk*edge, 2.0)

base=np.clip((1.00-d)/0.30,0,1)**1.7
lumsub=blur(np.clip((np.abs(lum-GROUND)-46.0)/60.0,0,1),7)
alpha_dark=np.clip(np.maximum(base, lumsub*np.clip((1.22-d)/0.34,0,1)),0,1)*gx
alpha_light=np.clip(keep*1.02,0,1)*np.clip((1.46-d)/0.24,0,1)*gx

dark=tone(lum,(10,10,15),(34,36,58),(248,248,252))
# the drawn half is white ink on slate; inverted it is ink on paper
L2=lum.copy(); L2[:,seam:]=255.0-L2[:,seam:]
light=tone(L2,(16,16,24),(58,60,78),(250,249,246),k=0.44)

for name,rgb,al in [('portrait-dark',dark,alpha_dark),('portrait-light',light,alpha_light)]:
    img=Image.fromarray(np.dstack([np.clip(rgb,0,255),al*255]).astype(np.uint8),'RGBA')
    bgc=(12,12,14) if 'dark' in name else (244,243,239)
    c=Image.new('RGB',img.size,bgc); c.paste(img,(0,0),img); c.save(OUT+'preview-'+name+'.png')
    if '--write' in sys.argv or os.environ.get('WRITE'):
        for wpx,suf in [(1400,''),(760,'-sm')]:
            r=img.resize((wpx,int(img.height*wpx/img.width)),Image.LANCZOS)
            r.save(DST+name+suf+'.webp','WEBP',quality=90,method=6)
        print('wrote', name, '%.0f KB'%(os.path.getsize(DST+name+'.webp')/1024))
print('built', img.size)
