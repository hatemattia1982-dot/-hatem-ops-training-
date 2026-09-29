import numpy as np, math, subprocess, random, wave
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import arabic_reshaper
from bidi.algorithm import get_display
import imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe()
W,H,FPS=720,1280,30; GROUND=1090; SC=0.60
P={k:Image.open(f"cut/{k}.png").convert("RGBA") for k in ["walk","sit","jump","wave","stand","run"]}
P={k:v.resize((int(v.width*SC),int(v.height*SC)),Image.LANCZOS) for k,v in P.items()}
FONT="Cairo.ttf"
def ar(t): return t
def font(sz):
    f=ImageFont.truetype(FONT,sz)
    try: f.set_variation_by_axes([900,0])
    except Exception:
        try: f.set_variation_by_axes([0,900])
        except Exception: pass
    return f
F1=font(84); F2=font(56)
random.seed(3)
# ---------- static background ----------
bg=Image.new("RGB",(W,H))
top=np.array([255,214,232]); mid=np.array([214,236,255]); 
g=np.zeros((H,W,3))
for y in range(H):
    t=y/GROUND if y<GROUND else 1
    g[y]=top*(1-t)+mid*t
bg=Image.fromarray(g.astype(np.uint8))
d=ImageDraw.Draw(bg)
d.ellipse((-300,GROUND-120,700,GROUND+500),fill=(186,230,170))
d.ellipse((250,GROUND-80,1200,GROUND+500),fill=(170,222,156))
d.rectangle((0,GROUND+20,W,H),fill=(160,214,146))
for i in range(40):
    x=random.randint(0,W); y=random.randint(GROUND+10,H-20); c=random.choice([(255,255,255),(255,182,213),(255,230,120),(200,170,255)])
    for a in range(5):
        ang=a*2*math.pi/5; d.ellipse((x+9*math.cos(ang)-6,y+9*math.sin(ang)-6,x+9*math.cos(ang)+6,y+9*math.sin(ang)+6),fill=c)
    d.ellipse((x-5,y-5,x+5,y+5),fill=(255,210,90))
# sun
sun=Image.new("RGBA",(W,H),(255,236,150,0)); sd=ImageDraw.Draw(sun)
sd.ellipse((520,90,680,250),fill=(255,236,150,255)); sun=sun.filter(ImageFilter.GaussianBlur(2))
bg=bg.convert("RGBA"); bg.alpha_composite(sun)
def cloud():
    c=Image.new("RGBA",(260,120),(255,255,255,0)); cd=ImageDraw.Draw(c)
    for bx,by,r in [(60,70,45),(110,50,55),(170,65,48),(210,80,35),(40,85,30)]:
        cd.ellipse((bx-r,by-r,bx+r,by+r),fill=(255,255,255,235))
    return c.filter(ImageFilter.GaussianBlur(1.5))
CL=[(cloud(),random.randint(-200,W),random.randint(80,560),random.uniform(12,30),random.uniform(.6,1.1)) for _ in range(5)]
# ---------- helpers ----------
def ease(t): t=max(0,min(1,t)); return t*t*(3-2*t)
def place(fr,img,cx,bottom,ang=0,sx=1,sy=1,alpha=1):
    im=img
    if sx!=1 or sy!=1: im=im.resize((max(1,int(im.width*sx)),max(1,int(im.height*sy))))
    if ang: 
        im=im.rotate(ang,resample=Image.BICUBIC,expand=True)
    if alpha<1:
        a=im.getchannel("A").point(lambda v:int(v*alpha)); im=im.copy(); im.putalpha(a)
    fr.alpha_composite(im,(int(cx-im.width/2),int(bottom-im.height)))
def shadow(fr,cx,w,alpha=90):
    s=Image.new("RGBA",(W,H),(0,0,0,0)); ImageDraw.Draw(s).ellipse((cx-w/2,GROUND-12,cx+w/2,GROUND+14),fill=(60,90,60,int(alpha)))
    fr.alpha_composite(s.filter(ImageFilter.GaussianBlur(6)))
def text(fr,t,y,f,alpha=1,sc=1):
    if alpha<=0: return
    t=ar(t); tmp=Image.new("RGBA",(W,260),(0,0,0,0)); td=ImageDraw.Draw(tmp)
    bb=td.textbbox((0,0),t,font=f,direction='rtl',language='ar'); tw=bb[2]-bb[0]; x=(W-tw)/2-bb[0]
    td.text((x,60),t,font=f,direction='rtl',language='ar',fill=(255,255,255,255),stroke_width=10,stroke_fill=(233,90,150,255))
    if sc!=1:
        tmp=tmp.resize((int(W*sc),int(260*sc))); 
    a=tmp.getchannel("A").point(lambda v:int(v*alpha)); tmp.putalpha(a)
    fr.alpha_composite(tmp,(int((W-tmp.width)/2),int(y-tmp.height/2)))
def heart(d,x,y,s,c):
    d.ellipse((x-s,y-s,x,y),fill=c); d.ellipse((x,y-s,x+s,y),fill=c); d.polygon([(x-s,y-s/2),(x+s,y-s/2),(x,y+s)],fill=c)
def star(d,x,y,r,c):
    pts=[(x+(r if i%2==0 else r*.45)*math.cos(i*math.pi/5-math.pi/2),y+(r if i%2==0 else r*.45)*math.sin(i*math.pi/5-math.pi/2)) for i in range(10)]
    d.polygon(pts,fill=c)
SPARK=[(random.uniform(0,2*math.pi),random.uniform(150,330),random.choice([(255,220,90,255),(255,150,200,255),(160,200,255,255)])) for _ in range(16)]
HEARTS=[(random.uniform(80,W-80),random.uniform(0,4),random.uniform(14,26),random.choice([(255,120,170,230),(255,170,200,230),(240,90,140,230)])) for _ in range(14)]
# ---------- timeline ----------
T=[("stand",0,3.5),("wave",3.5,6.8),("walk",6.8,11.3),("run",11.3,14.6),("jump",14.6,18.0),("sit",18.0,23.0)]
DUR=23.0
def frame(t):
    fr=bg.copy()
    for c,x0,y,sp,sc in CL:
        x=(x0+sp*t)%(W+300)-260; fr.alpha_composite(c,(int(x),int(y)))
    d=ImageDraw.Draw(fr)
    for k,a,b in T:
        if not(a<=t<b): continue
        u=t-a; L=b-a; im=P[k]; cx=W/2
        fadein=ease(u/0.35) if k in("stand","wave","jump","sit") else 1
        fadeout=1-ease((u-(L-0.3))/0.3) if k in("stand","wave") else 1
        al=min(fadein,fadeout)
        if k=="stand":
            pop=0.85+0.15*ease(u/0.6)+0.04*math.sin(min(u/0.6,1)*math.pi)
            br=1+0.012*math.sin(u*4)
            shadow(fr,cx,im.width*0.8*pop); place(fr,im,cx,GROUND+8,sx=pop,sy=pop*br,alpha=al)
            text(fr,"مرحباً!",210,F1,ease((u-0.6)/0.4),0.8+0.2*ease((u-0.6)/0.4))
        elif k=="wave":
            ang=4*math.sin(u*6); shadow(fr,cx,im.width*0.75)
            place(fr,im,cx,GROUND+8,ang=ang,alpha=al)
            text(fr,"أنا صديقتكم الجديدة",210,F2,ease((u-0.3)/0.4)*fadeout)
        elif k=="walk":
            x=-im.width/2+(W+im.width)*(u/L); bob=abs(math.sin(u*math.pi*2.2))*14
            shadow(fr,x,im.width*0.7); place(fr,im,x,GROUND+8-bob,ang=-2*math.sin(u*math.pi*2.2))
            text(fr,"هيا نتمشى",210,F2,ease(u/0.4)*(1-ease((u-L+0.5)/0.5)))
        elif k=="run":
            x=-im.width/2+(W+im.width)*(u/L); bob=abs(math.sin(u*math.pi*3.4))*22
            for i in range(4):
                px=x-im.width*0.35-i*38; r=18-i*3; a2=int(150-i*35)
                d.ellipse((px-r,GROUND-r-(i*6),px+r,GROUND+r-(i*6)),fill=(255,255,255,a2))
            shadow(fr,x,im.width*0.7); place(fr,im,x,GROUND+8-bob,ang=-4)
            text(fr,"أسرع!",210,F1,ease(u/0.3)*(1-ease((u-L+0.5)/0.5)))
        elif k=="jump":
            per=1.6; ph=(u%per)/per; hgt=math.sin(ph*math.pi)*260
            sq=1-0.08*max(0,1-ph*8) if ph<0.12 else 1
            shadow(fr,cx,im.width*0.7*(1-hgt/500),90*(1-hgt/400))
            place(fr,im,cx,GROUND-30-hgt,sx=1/sq,sy=sq,alpha=al)
            if ph>0.25 and ph<0.8:
                k2=(ph-0.25)/0.55
                for ang0,dist,c in SPARK:
                    r=dist*ease(k2); sx=cx+r*math.cos(ang0); sy=GROUND-420-hgt+r*math.sin(ang0)
                    star(d,sx,sy,14*(1-k2)+4,c[:3]+(int(255*(1-k2)),))
            text(fr,"يااااي!",210,F1,ease(u/0.3)*(1-ease((u-L+0.4)/0.4)))
        elif k=="sit":
            br=1+0.01*math.sin(u*3.5)
            shadow(fr,cx,im.width*0.9); place(fr,im,cx,GROUND+10,sy=br,alpha=al)
            for hx,off,s,c in HEARTS:
                v=(u-off)
                if v<0: continue
                hy=GROUND-80-v*140; a2=max(0,1-v/3.5)
                heart(d,hx+14*math.sin(v*3+hx),hy,s,c[:3]+(int(c[3]*a2),))
            text(fr,"إلى اللقاء!",210,F1,ease((u-0.8)/0.5))
    # global fade out
    if t>DUR-0.8:
        k=ease((t-(DUR-0.8))/0.8); ov=Image.new("RGBA",(W,H),(255,240,246,int(255*k))); fr.alpha_composite(ov)
    return fr.convert("RGB")
# ---------- music (simple music box) ----------
SR=44100
notes={'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880.0,'C6':1046.5,'G4':392.0,'A4':440.0,'F4':349.23,'C4':261.63,'E4':329.63}
mel=("C5 E5 G5 E5 F5 A5 G5 - E5 G5 C6 G5 F5 E5 D5 - C5 E5 G5 E5 F5 A5 G5 - A5 G5 F5 E5 D5 E5 C5 -").split()
bass=("C4 - G4 - F4 - C4 - A4 - F4 - G4 - C4 -").split()
beat=0.3; audio=np.zeros(int(SR*DUR)+SR)
def pluck(f,dur,amp):
    t=np.arange(int(SR*dur))/SR
    return amp*(np.sin(2*np.pi*f*t)+0.3*np.sin(4*np.pi*f*t)+0.1*np.sin(6*np.pi*f*t))*np.exp(-t*4)
i=0; t0=0
while t0<DUR-0.5:
    n=mel[i%len(mel)]
    if n!='-': s=int(t0*SR); p=pluck(notes[n],1.2,0.22); audio[s:s+len(p)]+=p[:len(audio)-s]
    if i%2==0:
        b=bass[(i//2)%len(bass)]
        if b!='-': s=int(t0*SR); p=pluck(notes[b],1.6,0.18); audio[s:s+len(p)]+=p[:len(audio)-s]
    i+=1; t0+=beat
audio=audio[:int(SR*DUR)]
fade=np.ones_like(audio); n=int(SR*1.2); fade[-n:]=np.linspace(1,0,n); audio*=fade
audio=audio/np.max(np.abs(audio))*0.8
with wave.open("music.wav","wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((audio*32767).astype(np.int16).tobytes())
# ---------- encode ----------
out="/home/user/-hatem-ops-training-/character_video.mp4"
cmd=[FF,"-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-i","music.wav",
     "-c:v","libx264","-pix_fmt","yuv420p","-preset","medium","-crf","20","-c:a","aac","-b:a","128k","-shortest","-movflags","+faststart",out]
pr=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
N=int(DUR*FPS)
for f in range(N):
    im=frame(f/FPS); pr.stdin.write(im.tobytes())
    if f in (45,150,270,380,480,600): im.save(f"prev_{f}.jpg")
pr.stdin.close(); pr.wait(); print("done",pr.returncode)
