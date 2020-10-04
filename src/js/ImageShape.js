export default class ImageShape{
    constructor(img,cx,cy,gismap){
        this.img = img
        this.gismap = gismap
        this.gisCoords = null
        // edit
        this.editing = false
        this.editable = true
        // style
        this.opacity = 1
        // frame
        this.bbox = []
        this.initCoords = []
        this.coords = this.getImageBounds(img,cx,cy)
        this.initFrame = {x:cx,y:cy,w:img.width,h:img.height,r:0}
        this.frame = {}
        this.anchor = {}
        this.bufferRadius = 10
        this.isVerticalFlipped = false
        this.event = {
            type:null,
            point:{x:0,y:0},
            radian:0, 
            shiftKey:false,
            ctrlKey:false,
            verticalFlip: false,
        }
        this.initiate()
        this.checkImageOnload()
    }
    initiate(){
        this.initCoords = this.coords.map(c=>c.slice())
        this.updateBbox()
        this.initFrame = {
            x: (this.bbox[0]+this.bbox[2])/2,
            y: (this.bbox[1]+this.bbox[3])/2,
            w: this.bbox[2]-this.bbox[0],
            h: this.bbox[3]-this.bbox[1],
            r: 0//radian
        }
        this.frame = Object.assign({},this.initFrame)
        this.updateAnchor()
        if(this.gismap){
            this.updateGisCoord()
        }
    }
    checkImageOnload(){
        if(!this.img.complete){
            this.img.onload = ()=>{
                this.coords = this.getImageBounds(this.img,this.frame.x,this.frame.y)
                this.initiate()
            }
        }
    }
    updateGisClient(){
        this.coords = this.gisCoords.map(coord=>{
            return this.gismap.coord2client(coord)
        })
        this.updateBbox()
        let Wdx =  this.coords[0][0]-this.coords[1][0]
        let Wdy =  this.coords[0][1]-this.coords[1][1]
        let Hdx =  this.coords[1][0]-this.coords[2][0]
        let Hdy =  this.coords[1][1]-this.coords[2][1]
        this.frame = {
            x: (this.coords[0][0]+this.coords[2][0])/2,
            y: (this.coords[0][1]+this.coords[2][1])/2,
            w: Math.sqrt(Wdx*Wdx+Wdy*Wdy),
            h: Math.sqrt(Hdx*Hdx+Hdy*Hdy),
            r: this.frame.r
        }
        this.updateAnchor()
    }
    updateGisCoord(){
        this.gisCoords = this.coords.map(coord=>{
            return this.gismap.client2coord(coord)
        })
    }
    getImageBounds(img,cx,cy){
        let w = img.width/2
        let h = img.height/2 
        return [
            [cx-w,cy-h],
            [cx+w,cy-h],
            [cx+w,cy+h],
            [cx-w,cy+h]
        ]
    }
    contains(p){
        let isContain = false
        let [minX, minY, maxX, maxY] = this.bbox
        if (p[0] < minX || p[0] > maxX || p[1] < minY || p[1] > maxY) {
            return false;
        }
        for(let i=0, j=this.coords.length-1; i<this.coords.length; j=i++) {
            let p1 = this.coords[j]
            let p2 = this.coords[i]
            if(
                (p2[1] > p[1]) != (p1[1] > p[1]) &&
                (p[0] < (p1[0] - p2[0]) * (p[1] - p2[1]) / (p1[1] - p2[1]) + p2[0])
            ){
                isContain = !isContain
            }
        }
        return isContain
    }
    draw(ctx){
        let {x,y,w,h,r} = this.frame
        ctx.save()
        ctx.translate(x,y)
        ctx.rotate(-r)
        ctx.scale(this.isVerticalFlipped?-1:1,1)
        ctx.globalAlpha = this.opacity
        ctx.drawImage(this.img,-w/2,-h/2,w,h)
        ctx.restore()
        if(this.editing){
            this.drawFrame(ctx)
        }
    }
    rotate(vector,radian){
        radian = -radian
        return {
            x: vector.x*Math.cos(radian)-vector.y*Math.sin(radian),
            y: vector.x*Math.sin(radian)+vector.y*Math.cos(radian)
        }
    }
    updateBbox(){
        let xArr = this.coords.map(c=>c[0])
        let yArr = this.coords.map(c=>c[1])
        this.bbox =  [
            Math.min(...xArr),
            Math.min(...yArr),
            Math.max(...xArr),
            Math.max(...yArr)
        ]
    }
    updateAnchor(){
        let {x,y,w,h,r} = this.frame
        let add = (v1,v2)=>({x:v1.x+v2.x,y:v1.y+v2.y})
        this.anchor = {
            RO: add({x,y},this.rotate({x:0,y:-h/2-30},r)),
            LT: add({x,y},this.rotate({x:-w/2,y:-h/2},r)),
            T: add({x,y},this.rotate({x:0,y:-h/2},r)),
            RT: add({x,y},this.rotate({x:w/2,y:-h/2},r)),
            R: add({x,y},this.rotate({x:w/2,y:0},r)),
            RB: add({x,y},this.rotate({x:w/2,y:h/2},r)),
            B: add({x,y},this.rotate({x:0,y:h/2},r)),
            LB: add({x,y},this.rotate({x:-w/2,y:h/2},r)),
            L: add({x,y},this.rotate({x:-w/2,y:0},r)),
        }   
    }
    updateCoords(){
        let {x,y,w,h,r} = this.frame
        let frame = this.initFrame
        this.initCoords.map((coord,i)=>{
            let vToC = {x:coord[0]-frame.x,y:coord[1]-frame.y}
            vToC = this.rotate(vToC,-frame.r) //先轉正
            vToC.x*= w/frame.w
            vToC.y*= h/frame.h
            vToC = this.rotate(vToC,r) //再轉到新的
            this.coords[i][0] = vToC.x+x
            this.coords[i][1] = vToC.y+y
            if(this.gismap){
                this.gisCoords[i] = this.gismap.client2coord([vToC.x+x,vToC.y+y])
            }
        })
    }
    verticalFlip(){
        this.initCoords.map((coord,i)=>{
            this.initCoords[i][0] = 2*this.initFrame.x-coord[0]
        })
        this.isVerticalFlipped = !this.isVerticalFlipped
    }
    handleMousedown(e){
        let {x,y,w,h,r} = this.frame
        this.event.verticalFlip = false
        for(let key in this.anchor){
            let dx = e.clientX-this.anchor[key].x
            let dy = this.anchor[key].y-e.clientY
            let dis = Math.sqrt(dx*dx+dy*dy)
            if(dis<this.bufferRadius){
                switch(key){
                    case 'LT':
                        this.event.sign = {x:-1,y:1}
                        this.event.radian = Math.atan2(h,-w)
                        this.event.point = this.anchor['RB'];break;
                    case 'T':
                        this.event.point = this.anchor['B'];break;
                    case 'RT':
                        this.event.radian = Math.atan2(-h,-w)
                        this.event.point = this.anchor['LB'];break;
                    case 'R':
                        this.event.point = this.anchor['L'];break;
                    case 'RB':
                        this.event.radian = Math.atan2(-h,w)
                        this.event.point = this.anchor['LT'];break;
                    case 'B':
                        this.event.point = this.anchor['T'];break;
                    case 'LB':
                        this.event.radian = Math.atan2(h,w)
                        this.event.point = this.anchor['RT'];break;
                    case 'L':
                        this.event.point = this.anchor['R'];break;
                    case 'RO':
                        this.event.point = {x,y};break;
                    default: break;
                }
                this.event.type = key
                return this.editable?true:false
            }
        }
        if(this.contains([e.clientX,e.clientY])){
            this.editing = true
            this.event.type = 'M'
            this.event.point = {x:e.clientX,y:e.clientY}
            return this.editable?true:false
        }
    }
    handleMousemove(e){
        if(this.event.type!=null){
            let {x,y,w,h,r} = this.frame
            let dx, dy, dr, dis
            if(this.event.ctrlKey){
                dx = e.clientX-x
                dy = y-e.clientY
                dr = Math.atan2(dy,dx)
                dis = 2*Math.sqrt(dx*dx+dy*dy)
            }else{
                dx = e.clientX-this.event.point.x
                dy = this.event.point.y-e.clientY
                dr = Math.atan2(dy,dx)
                dis = Math.sqrt(dx*dx+dy*dy)
            }
            if(this.event.type=='RO'){
                if(this.event.shiftKey){
                    let step = Math.PI/12
                    let int = Math.round((dr-Math.PI/2)/step)
                    this.frame.r = int*step
                }else{
                    this.frame.r = dr-Math.PI/2
                }
            }else if(this.event.type=='M'){
                this.frame.x+= e.clientX-this.event.point.x
                this.frame.y+= e.clientY-this.event.point.y
                this.event.point.x = e.clientX
                this.event.point.y = e.clientY
            }else{
                let pw = dis*Math.cos(dr-r)
                let ph = dis*Math.sin(dr-r)
                let vToC = {x:0,y:0}
                if(['RT','RB','LT','LB'].includes(this.event.type)){
                    if(this.event.shiftKey){
                        if(Math.sin(dr-(this.event.radian+r))>0){
                            ph = pw*Math.tan(this.event.radian)
                        }else{
                            pw = ph/Math.tan(this.event.radian)
                        }
                    }
                    this.frame.w = Math.abs(pw)
                    this.frame.h = Math.abs(ph)
                    vToC = this.rotate({x:pw/2,y:-ph/2},r)
                }else if(['R','L'].includes(this.event.type)){
                    this.frame.w = Math.abs(pw)
                    vToC = this.rotate({x:pw/2,y:0},r)
                }else if(['T','B'].includes(this.event.type)){
                    this.frame.h = Math.abs(ph)
                    vToC = this.rotate({x:0,y:-ph/2},r)
                }
                if(!this.event.ctrlKey){
                    this.frame.x = this.event.point.x+vToC.x
                    this.frame.y = this.event.point.y+vToC.y
                }
                let shouldHorizontalFlip = 
                    (Math.sin(dr-r)>0&&['RB','B','LB'].includes(this.event.type)) ||
                    (Math.sin(dr-r)<0&&['RT','T','LT'].includes(this.event.type))
                if(shouldHorizontalFlip){
                    this.frame.r+= Math.PI
                }
                let sign = this.event.verticalFlip?1:-1
                let shouldVerticalFlip = 
                    (Math.cos(dr-r)*sign>0&&['RT','R','RB'].includes(this.event.type))||
                    (Math.cos(dr-r)*sign<0&&['LT','L','LB'].includes(this.event.type))
                if(shouldVerticalFlip){
                    this.event.verticalFlip = !this.event.verticalFlip
                    this.verticalFlip()
                }
            }
            this.updateAnchor()
            this.updateCoords()
            this.updateBbox()
        }
    }
    handleMouseup(e){
        this.event.type = null
    }
    handleKeydown(e){
        if(e.shiftKey){this.event.shiftKey=true}
        if(e.ctrlKey){this.event.ctrlKey=true}
    }
    handleKeyup(e){
        this.event.shiftKey=false
        this.event.ctrlKey=false
    }
    drawFrame(ctx){
        let anchor = this.anchor
        let coords = Object.values(anchor)
        let lineOrder = ['RO','T','RT','RB','LB','LT','T']
        ctx.beginPath()
        lineOrder.map((key,i)=>{
            if(i==0){
                ctx.moveTo(anchor[key].x,anchor[key].y)
            }else{
                ctx.lineTo(anchor[key].x,anchor[key].y)
            }
        })
        ctx.strokeStyle = 'dodgerblue'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.closePath()
        ctx.beginPath()
        coords.map(val=>{
            ctx.moveTo(val.x,val.y)
            ctx.arc(val.x,val.y,5,0,2*Math.PI,true)
            ctx.stroke()
            ctx.fillStyle = 'white'
            ctx.fill()
        })
        ctx.closePath()
    }
}