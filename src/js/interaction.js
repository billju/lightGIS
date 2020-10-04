export default class Interaction{
    constructor(container,gismap){
        this.container = container
        this.gismap = gismap
        this.recycle = []
        this.copied = {features:[],center:[0,0]}
        this.isKeyup = true
        // native events
        this.container.oncontextmenu = e=>{e.preventDefault()}
        this.container.addEventListener('dblclick',e=>{
            this.gismap.handleDblclick(e)
        })
        this.container.addEventListener('mousedown',e=>{
            let noImageShapeSelected = true
            for(let imageShape of this.gismap.imageShapes){
                if(noImageShapeSelected&&imageShape.handleMousedown(e)){
                    imageShape.editing = true
                    noImageShapeSelected = false
                    continue
                }
                imageShape.editing = false
            }
            if(noImageShapeSelected)
                this.gismap.handleMousedown(e)
        })
        this.container.addEventListener('mousemove',e=>{
            for(let imageShape of this.gismap.imageShapes){
                if(imageShape.editing){
                    imageShape.handleMousemove(e)
                }
            }
            this.gismap.handleMousemove(e)
        })   
        this.container.addEventListener('mouseup',e=>{
            for(let imageShape of this.gismap.imageShapes)
                imageShape.handleMouseup(e)
            this.gismap.handleMouseup(e)
        })
        this.container.addEventListener('mouseleave',e=>{
            this.gismap.selectEvent.ctrlKey = false
            for(let imageShape of this.gismap.imageShapes)
                imageShape.handleMouseup(e)
            this.gismap.handleMouseleave(e)
        })
        window.addEventListener('keydown',e=>{
            this.gismap.selectEvent.ctrlKey = e.ctrlKey
            this.gismap.selectEvent.shiftKey = e.shiftKey
            if(e.code&&e.code.includes('Arrow')){
                let offset = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.code]
                const flatten = (cs)=>typeof cs[0]=='number'?[cs]:typeof cs[0][0]=='number'?cs:cs[0]
                this.gismap.selectEvent.features.map(feature=>{
                    let coords = flatten(feature.geometry.coordinates).map(coord=>{
                        let client = this.gismap.coord2client(coord)
                        let newCoord = this.gismap.client2coord([client[0]+offset[0],client[1]+offset[1]])
                        coord[0] = newCoord[0]
                        coord[1] = newCoord[1]
                        return coord
                    })
                    feature.geometry.bbox = this.gismap.getBbox(coords)
                })
            }
            if(e.code=='Delete'||e.code=='Backspace') this.deleteSelected()
            if(this.isKeyup){
                if(e.ctrlKey&&e.code=='KeyZ'){
                    let features = this.recycle.pop()
                    if(features)
                        features.map(feature=>{this.gismap.vectors.push(feature)})
                }
                else if(e.ctrlKey&&e.code=='KeyX'){
                    this.copySelected()
                    this.deleteSelected()
                }
                else if(e.ctrlKey&&e.code=='KeyC'){
                    this.copySelected()
                }
                else if(e.ctrlKey&&e.code=='KeyV'){
                    this.pasteSelected(false)
                }
                else if(e.ctrlKey&&e.code=='KeyB'){
                    this.copySelected()
                    this.pasteSelected(true)
                }
                if(e.code&&!e.code.includes('Control'))
                    this.isKeyup = false
            }
            for(let imageShape of this.gismap.imageShapes)
                imageShape.handleKeydown(e)
        })
        window.addEventListener('keyup',e=>{
            this.gismap.selectEvent.ctrlKey = e.ctrlKey
            this.gismap.selectEvent.shiftKey = e.shiftKey
            this.isKeyup = true
            for(let imageShape of this.gismap.imageShapes)
                imageShape.handleKeyup(e)
        })
        this.container.addEventListener('wheel',e=>{
            this.gismap.handleWheel(e)
        })
        window.addEventListener('resize',()=>{
            this.gismap.handleResize()
        })
        //custom event
        this.events = {paste:[],}
    }
    dispatchEvent(type,payload){
        for(let fn of this.events[type]){ fn(payload) }
    }
    addEventListener(type,fn){
        try{ this.events[type].push(fn) }
        catch{ console.error('no such type of event!') }
    }
    setSelectedFeaturesProp(key,value){
        this.gismap.selectEvent.styling = true
        for(let feature of this.gismap.selectEvent.features){
            feature.properties[key] = value
        }
    }
    mapSelectedFeaturesProp(fKey,tKey,rule=undefined){
        this.gismap.selectEvent.styling = true
        rule = rule?rule:(input)=>input
        for(let feature of this.gismap.selectEvent.features){
            feature.properties[fKey] = rule(feature.properties[tKey])
        }
    }
    getFeaturesProp(features){
        if(features.length==1){
            return {...this.gismap.getDerivedProperties(features[0]),...features[0].properties}
        }else if(features.length>1){
            let area = features.reduce((acc,cur)=>{
                return acc+this.gismap.getFeatureArea(cur)
            },0)
            area = area<1e4?area.toFixed(0)+'平方公尺':area<1e6?(area/1e4).toFixed(3)+'公頃':(area/1e6).toFixed(3)+'平方公里'
            return {
                '數量':features.length,
                '面積合計':area
            }
        }else{
            return {}
        }
    }
    copySelected(){
        if(this.gismap.selectEvent.features.length){
            this.copied.features = this.gismap.selectEvent.features
            let coords = this.gismap.selectEvent.features.flatMap(f=>{
                let b = f.geometry.bbox; return [[b[0],b[1]],[b[2],b[3]]]
            })
            this.copied.center = this.gismap.getBboxCenter(this.gismap.getBbox(coords))
        }
    }
    pasteSelected(stay=false){
        const flatten = (cs)=>typeof cs[0]=='number'?[cs]:typeof cs[0][0]=='number'?cs:cs[0]
        let from = this.copied.center
        let to = this.gismap.moveEvent.currentCoord
        let offset = [to[0]-from[0],to[1]-from[1]]
        this.gismap.selectEvent.features = this.copied.features.slice().reverse().map(feature=>{
            let f = JSON.parse(JSON.stringify(feature))
            if(!stay)
                flatten(f.geometry.coordinates).map(c=>{c[0]+=offset[0];c[1]+=offset[1]})
            return this.gismap.addVector(f.geometry.type,f.geometry.coordinates,f.properties,true)
        })
        let features = this.gismap.selectEvent.features
        this.gismap.setSelectedFeatures(features)
        this.dispatchEvent('paste',{features})
    }
    deleteSelected(){
        if(this.gismap.selectEvent.features.length){
            this.gismap.vectors = this.gismap.vectors.filter(feature=>!this.gismap.selectEvent.features.includes(feature))
            this.recycle.push(this.gismap.selectEvent.features)
            this.gismap.selectEvent.features = []
            this.gismap.modifyEvent.feature = null
        }
    }
    fitExtent(features=this.gismap.selectEvent.features){
        let bound = 6378137*Math.PI
        if(features.length){
            let coords = []
            for(let feature of features){
                let bbox = feature.geometry.bbox
                if(bbox.some(x=>x<-bound||x>bound)){
                    continue
                }
                coords.push([bbox[0],bbox[1]])
                coords.push([bbox[2],bbox[3]])
            }
            this.gismap.fitBound(this.gismap.getBbox(coords))
        }
    }
    moveLayerTo(position='top'){
        let features = this.gismap.selectEvent.features
        this.gismap.vectors = this.gismap.vectors.filter(f=>!features.includes(f))
        if(position=='top'){
            this.gismap.vectors.unshift(...features)
        }else if(position=='bottom'){
            this.gismap.vectors.push(...features)
        }
    }
    // simplify(){
    //     let percentage = parseInt(document.getElementById('percentage').value)/100
    //     for(let feature of this.gismap.selectEvent.features){
    //         let coords = feature.geometry.coordinates
    //         if(feature.geometry.type=='Polygon'){
    //             feature.geometry.coordinates = coords.map(c=>simplifyVisvalingam(c,Math.round(c.length*percentage)))
    //         }else if(feature.geometry.type=='MultiPolygon'){
    //             feature.geometry.coordinates = coords.map(cs=>cs.map(c=>simplifyVisvalingam(c,Math.round(c.length*percentage))))
    //         }
    //     }
    // }   
}