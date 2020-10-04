export default class ColorSampler{
    constructor(canvas){
        this.canvas = canvas
        this.canvas.style.cursor = 'grab'
        this.ctx = this.canvas.getContext('2d')
        this.img = new Image()
        this.event = {change:[],select:[]}
        this.canvas.addEventListener('wheel',e=>this.handleWheel(e))
        this.canvas.addEventListener('mousedown',e=>this.handleMousedown(e))
        this.canvas.addEventListener('mousemove',e=>this.handleMousemove(e))
        this.canvas.addEventListener('mouseup',e=>this.handleMouseup(e))
        this.canvas.addEventListener('mouseleave',e=>this.handleMouseup(e))
        this.view = {x:0,y:0,w:0,h:0,zoom:0}
        this.moveEvent = {x:0,y:0,active:false,moved:false}
        this.resize()
        window.addEventListener('resize',()=>{this.resize()})
    }
    minmax(input,min,max){
        return input<min?min:input>max?max:input
    }
    initImage(){
        let rw = this.canvas.width/this.img.width
        let rh = this.canvas.height/this.img.height
        if(rw<rh){
            let h = Math.round(this.img.height*rw)
            this.view.x = 0
            this.view.w = this.canvas.width
            this.view.y = (this.canvas.height-h)/2
            this.view.h = h
        }else{
            let w = Math.round(this.img.width*rh)
            this.view.x = (this.canvas.width-w)/2
            this.view.w = w
            this.view.y = 0
            this.view.h = this.canvas.height
        }
    }
    drawImage(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
        let {x,y,w,h} = this.view
        this.ctx.drawImage(this.img,x,y,w,h)
    }
    zoomImage(delta,clientX,clientY){
        let {x,y,w,h,zoom} = this.view
        let z = this.minmax(zoom+delta,0,10)
        if(z==0){
            this.initImage()
        }else{
            let scale = Math.pow(2,z-zoom)
            let cx = x+w/2, cy = y+h/2
            cx+= (clientX-cx)*(1-scale)
            cy+= (clientY-cy)*(1-scale)
            this.view.w*= scale
            this.view.h*= scale
            this.view.x = cx-this.view.w/2
            this.view.y = cy-this.view.h/2
        }
        this.view.zoom = z
    }
    getClient(e){
        let rect = this.canvas.getBoundingClientRect()
        let clientX = e.clientX-rect.left, clientY = e.clientY-rect.top
        return [clientX,clientY]
    }
    handleWheel(e){
        e.preventDefault()
        let [clientX, clientY] = this.getClient(e)
        let delta = e.deltaY>0?-1:1
        this.zoomImage(delta,clientX,clientY)
        this.drawImage()
    }
    handleMousedown(e){
        this.moveEvent.active = true
        let [clientX, clientY] = this.getClient(e)
        this.moveEvent.x = clientX
        this.moveEvent.y = clientY
        this.canvas.style.cursor = 'grabbing'
    }
    handleMousemove(e){
        let [clientX, clientY] = this.getClient(e)
        let [r,g,b,a] = this.ctx.getImageData(clientX,clientY,1,1).data
        this.dispatch('change',{value:`rgba(${r},${g},${b},${a/255})`})
        if(this.moveEvent.active){
            let dx = clientX-this.moveEvent.x
            let dy = clientY-this.moveEvent.y
            if(Math.sqrt(dx*dx+dy*dy)>5)
                this.moveEvent.moved = true
            if(this.moveEvent.moved){
                this.view.x += dx
                this.view.y += dy
                this.moveEvent.x = clientX
                this.moveEvent.y = clientY
            }
            this.drawImage()
        }
    }
    handleMouseup(e){
        let [clientX, clientY] = this.getClient(e)
        if(this.moveEvent.active&&!this.moveEvent.moved){
            var [r,g,b,a] = this.ctx.getImageData(clientX,clientY,1,1).data
            this.dispatch('select',{value:`rgba(${r},${g},${b},${a/255})`})
        }
        this.moveEvent.active = false
        this.moveEvent.moved = false
        this.canvas.style.cursor = 'crosshair'
    }
    colorize(){
        let imgData = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height)
        for(var i=0;i<imgData.data.length;i+=4){
            var [r,g,b,a] = imgData.data.slice(i,i+4)
            if(r>254&&g>254&&b>254){
                imgData.data[i+3] = 0
            }
        }
        this.ctx.putImageData(imgData,0,0)
    }
    import(file){
        this.img.src = URL.createObjectURL(file)
        this.img.onload = ()=>{
            this.initImage()
            this.drawImage()
        }        
    }
    resize(){
        this.canvas.height = this.canvas.clientHeight
        this.canvas.width = this.canvas.clientWidth
        this.drawImage()
    }
    download(imgType='png'){    
        const a = document.createElement('a')
        a.download = 'transparent.png'
        a.href = this.canvas.toDataURL('image/'+imgType)
        document.body.appendChild(a)
        a.click()
        a.remove()
    }
    dispatch(type,payload){
        for(let fn of this.event[type]){ fn(payload) }
    }
    addEventListener(type,fn){
        try{ this.event[type].push(fn) }
        catch{ console.error('no such type of event!') }
    }
}