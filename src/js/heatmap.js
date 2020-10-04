export default class Heatmap{
    constructor(canvas){
        this.canvas = canvas
        this.ctx = this.canvas.getContext('2d')
        this.data = {}
        this.maxValue = 10
        this.steps = 100
        this.palette = this.createPalette()
    }
    setData(args){
        this.data = {}
        for(let point of args.data)
            this.addData(point)
        this.maxValue = args.max?args.max:this.maxValue
        this.render()
    }
    addData(point){
        let {x,y,value} = point
        if (x < 0 || x > this.canvas.width || y < 0 || y > this.canvas.height) return
        let key = Math.round(x%this.canvas.width)+this.canvas.width*Math.round(y)
        this.data[key] = this.data[key]?this.data[key]+value:value
    }
    createPalette(){
        let palette = {0:new Uint8ClampedArray(4)}
        for(let i=1;i<=this.steps;i++){
            let value = i/this.steps
            palette[value] = this.hsla2rgba(this.value2hsla(value))
        }
        return palette
    }
    value2hsla(value){
        const hsla = new Float64Array(4);
        hsla[0] = (1 - value);// h
        hsla[1] = 0.8;// s
        hsla[2] = value * 0.6;// l
        hsla[3] = 1.0;// a
        return hsla;
    }
    hsla2rgba(hsla){
        const rgba = new Uint8ClampedArray(4);
        let r,g,b
        let [h,s,l,a] = hsla
        if(s == 0){
            r = g = b = l;
        }else{
            function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        rgba[0] = r * 255;
        rgba[1] = g * 255;
        rgba[2] = b * 255;
        rgba[3] = a * 255;
        return rgba;
    }
    bresenham(cx,cy,r){
        let x=r,y=0,d=1-r
        let pixels = []
        while(x>=y){
            y++
            if(d<0){
                d = d+2*y+1
            }else{
                x--
                d = d+2*(y-x)+1
            }
            pixels.push([cx+x,cy+y])
        }
        return pixels
    }
    render(){
        let W = this.canvas.width, H = this.canvas.height
        let imageData = this.ctx.getImageData(0,0,W,H)
        let counter = {}
        for(let key in this.data){
            let x = key%W, y = Math.floor(key/W)
            let radius = this.data[key]
            let r_squ = radius*radius
            // calculate point x.y 
            for(let scanx=x-radius; scanx<=x+radius; scanx++){            
                // out of extent
                if(scanx<0 || scanx>W)
                    continue;
                for(let scany=y-radius; scany<=y+radius; scany++){
                    if(scany<0 || scany>H)
                        continue;
                    let dx = scanx-x, dy = scany-y
                    let d_squ = dx*dx+dy*dy
                    if(d_squ > r_squ){
                        continue;
                    } else {
                        let v = radius*(1-d_squ/r_squ)
                        let k = scanx+scany*W
                        counter[k] = counter[k]?counter[k]+v:v
                    }
                }
            }
        }
        for(let k in counter){
            let stepIndex = Math.ceil(counter[k]/this.maxValue*this.steps)/this.steps
            stepIndex = stepIndex>1?1:stepIndex
            let rgba = this.palette[stepIndex]
            let i = k*4
            imageData.data[i] = rgba[0]; // r
            imageData.data[i+1] = rgba[1]; // g
            imageData.data[i+2] = rgba[2]; // b
            imageData.data[i+3] = rgba[3]; // a
        }
        this.ctx.putImageData(imageData,0,0)
    }
}