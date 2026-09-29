import cv2, numpy as np
from PIL import Image
U="/root/.claude/uploads/80df7783-a41a-5a61-8296-d2ac0ed2da48/"
names=["045f1d5a","52737e4e","e60508dd","44e7ae9b","48c95f8c","7fcd3c00"]
labels=["walk","sit","jump","wave","stand","run"]
K=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(17,17))
for n,l in zip(names,labels):
    im=cv2.imread(U+n+"-image.jpg")
    hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV); s=hsv[...,1]; v=hsv[...,2]
    light=(s<28)&(v>=195)
    white=(light&(v>=236)).astype(np.uint8); gray=(light&(v<236)).astype(np.uint8)
    bg=(white&~cv2.morphologyEx(white,cv2.MORPH_OPEN,K).astype(bool)) | (gray&~cv2.morphologyEx(gray,cv2.MORPH_OPEN,K).astype(bool))
    bg=bg.astype(bool)
    gf=cv2.boxFilter(gray.astype(np.float32),-1,(27,27)); wf=cv2.boxFilter(white.astype(np.float32),-1,(27,27))
    bg&=(gf>0.12)&(wf>0.12)
    # bg components: fill tiny enclosed ones (eye highlights) back to fg
    nb,lb,sb,_=cv2.connectedComponentsWithStats(bg.astype(np.uint8),4)
    h,w=bg.shape
    for i in range(1,nb):
        x,y,ww,hh,a=sb[i]
        if x>0 and y>0 and x+ww<w and y+hh<h:
            m=lb==i; gfrac=gray[m].mean()
            if a<250 or gfrac<0.35: bg[m]=False
    fg=(~bg).astype(np.uint8)
    fg=cv2.morphologyEx(fg,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
    n2,l2,st,_=cv2.connectedComponentsWithStats(fg,8)
    big=np.argmax(st[1:,4])+1
    keep=(l2==big).astype(np.uint8)*255
    for i in range(1,n2):
        if i!=big and st[i,4]>3000: keep[l2==i]=255
    cl=cv2.morphologyEx(keep,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(45,45)))
    keep[(cl>0)&(gf<0.25)]=255
    a=cv2.GaussianBlur(cv2.erode(keep,np.ones((2,2),np.uint8)),(3,3),0)
    x,y,ww,hh=cv2.boundingRect(keep)
    cv2.imwrite(f"cut/{l}.png",np.dstack([im,a])[y:y+hh,x:x+ww])
ims=[Image.open(f"cut/{l}.png") for l in labels]
H=560; ims=[i.resize((int(i.width*H/i.height),H)) for i in ims]
c=Image.new("RGBA",(sum(i.width for i in ims),H),(120,200,140,255)); x=0
for i in ims: c.alpha_composite(i,(x,0)); x+=i.width
c.convert("RGB").save("cutcheck.jpg")
