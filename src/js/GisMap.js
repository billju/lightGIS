import ImageShape from './imageShape.js'
function getShiftedCoords(coords, width) {
    var x2, y2, x42, y42
    var shift_coord = []
    for (let i = 0; i < coords.length; i++) {
        if (i == 0) {
            var y1 = coords[i][0]
            var x1 = coords[i][1]
            y2 = coords[i + 1][0]
            x2 = coords[i + 1][1]
            var s124 = width / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
            x42 = (y2 - y1) * s124
            y42 = -(x2 - x1) * s124
            shift_coord.push([y1 + y42, x1 + x42])
        } else if (i == coords.length - 1) {
            shift_coord.push([y2 + y42, x2 + x42])
        } else {
            var y3 = coords[i + 1][0]
            var x3 = coords[i + 1][1]
            var s235 = width / Math.sqrt(Math.pow(x3 - x2, 2) + Math.pow(y3 - y2, 2))
            var x52 = (y3 - y2) * s235
            var y52 = -(x3 - x2) * s235
            var radian = Math.atan2(x42 * y52 - y42 * x52, x42 * x52 + y42 * y52)
            var scalar = 1 / 2 / Math.pow(Math.cos(radian / 2), 2)
            var sx = (x42 + x52) * scalar
            var sy = (y42 + y52) * scalar
            shift_coord.push([y2 + sy, x2 + sx])
            y2 = coords[i + 1][0]
            x2 = coords[i + 1][1]
            x42 = x52
            y42 = y52
        }
    }
    return shift_coord
}
function circleDefinedBy3Points(x1, y1, x2, y2, x3, y3) {
    let A = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2
    let B = (x1 * x1 + y1 * y1) * (y3 - y2) + (x2 * x2 + y2 * y2) * (y1 - y3) + (x3 * x3 + y3 * y3) * (y2 - y1)
    let C = (x1 * x1 + y1 * y1) * (x2 - x3) + (x2 * x2 + y2 * y2) * (x3 - x1) + (x3 * x3 + y3 * y3) * (x1 - x2)
    let D = (x1 * x1 + y1 * y1) * (x3 * y2 - x2 * y3) + (x2 * x2 + y2 * y2) * (x1 * y3 - x3 * y1) + (x3 * x3 + y3 * y3) * (x2 * y1 - x1 * y2)
    let x = -B / (2 * A)
    let y = -C / (2 * A)
    let r = Math.sqrt((B * B + C * C - 4 * A * D) / (4 * A * A))
    return { x, y, r }
}
function drawSmoothPath(ctx, points, rate = 0.2) {
    const add = (p1, p2) => ([p1[0] + p2[0], p1[1] + p2[1]])
    const subtract = (p1, p2) => ([p1[0] - p2[0], p1[1] - p2[1]])
    const curveTo = (p1, p2, p3) => { ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]) }
    let cp = [] //control point
    for (let i = 0; i < points.length - 2; i++) {
        let p = subtract(points[i + 2], points[i])
        cp.push([Math.round(p[0] * rate), Math.round(p[1] * rate)])
    }
    points.map((p, i, ps) => {
        switch (i) {
            case 0:
                ctx.lineTo(p[0], p[1]); break;
            case 1:
                curveTo(ps[0], subtract(p, cp[i - 1]), p); break;
            case ps.length - 1:
                curveTo(add(ps[i - 1], cp[i - 2]), p, p); break;
            default:
                curveTo(add(ps[i - 1], cp[i - 2]), subtract(p, cp[i - 1]), p); break;
        }
    })
}
var EasingFunctions = {
    // no easing, no acceleration
    linear: t => t,
    // accelerating from zero velocity
    easeInQuad: t => t * t,
    // decelerating to zero velocity
    easeOutQuad: t => t * (2 - t),
    // acceleration until halfway, then deceleration
    easeInOutQuad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    // accelerating from zero velocity 
    easeInCubic: t => t * t * t,
    // decelerating to zero velocity 
    easeOutCubic: t => (--t) * t * t + 1,
    // acceleration until halfway, then deceleration 
    easeInOutCubic: t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    // accelerating from zero velocity 
    easeInQuart: t => t * t * t * t,
    // decelerating to zero velocity 
    easeOutQuart: t => 1 - (--t) * t * t * t,
    // acceleration until halfway, then deceleration
    easeInOutQuart: t => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    // accelerating from zero velocity
    easeInQuint: t => t * t * t * t * t,
    // decelerating to zero velocity
    easeOutQuint: t => 1 + (--t) * t * t * t * t,
    // acceleration until halfway, then deceleration 
    easeInOutQuint: t => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
}
export default class GisMap {
    constructor(element) {
        this.canvas = element
        this.ctx = this.canvas.getContext('2d')
        this.tilePixel = { w: 256, h: 256 }
        this.world = {
            bbox: [-6378137 * Math.PI, -6378137 * Math.PI, 6378137 * Math.PI, 6378137 * Math.PI],
            w: 2 * 6378137 * Math.PI,
            h: 2 * 6378137 * Math.PI,
        }
        this.view = {
            bbox: [],
            center: { x: 13437548.485305637, y: 2772337.9239074644 },
            w: this.canvas.clientWidth,
            h: this.canvas.clientHeight,
            zoom: 9,
            minZoom: 0,
            maxZoom: 20,
            scaleText: '0公尺',
            scaleWith: '0px',
            scaleStripe: '0px'
        }
        this.handleResize()
        // layers
        this.vectors = []
        this.rasters = []
        this.imageShapes = []
        this.tiles = {}
        // custom events
        this.isMoveEnd = false
        this.events = { render: [], select: [], drawend: [], moving: [], moveend: [] }
        this.notRenderPoints = false
        // default events
        let xyz = { x: this.view.center.x, y: this.view.center.y, z: this.view.zoom }
        this.zoomEvent = { before: xyz, after: xyz, t: 0, frames: 25, delta: 0.25, zStep: 1 }
        this.moveEvent = { x: 0, y: 0, vx: 0, vy: 0, t: 0, frames: 90, active: false, moved: false, currentCoord: [0, 0] }
        this.panEvent = { before: xyz, after: xyz, t: 0, frames: 60 }
        this.drawEvent = { path: [], active: false, snap: false }
        this.selectEvent = { x: 0, y: 0, bbox: [0, 0, 0, 0], features: [], shiftKey: false, ctrlKey: false, active: false, styling: false }
        this.modifyEvent = { feature: null, anchor: -1, coords: [], geomType: null }
        this.animationFrame = null
        this.render = () => {
            // update parameters
            if (this.moveEvent.t > 0) {
                var fricion = 0.1
                var vx = this.moveEvent.vx * (1 - fricion)
                var vy = this.moveEvent.vy * (1 - fricion)
                Object.assign(this.moveEvent, { vx, vy })
                if (this.moveEvent.active == false)
                    this.setView([vx, vy])
                this.moveEvent.t--
            }
            if (this.zoomEvent.t > 0) {
                var t = 1 - (this.zoomEvent.t - 1) / this.zoomEvent.frames
                // ease function = { easeOutQuad: t => t*(2-t) }
                var dt = this.zoomEvent.frames == 1 ? 1 : (2 - 2 * t) / this.zoomEvent.frames
                t = t * (2 - t)
                var dz = (this.zoomEvent.after.z - this.zoomEvent.before.z) * dt
                var scale = Math.pow(2, dz)
                this.view.center.x += (this.zoomEvent.after.x - this.view.center.x) * (1 - 1 / scale)
                this.view.center.y += (this.zoomEvent.after.y - this.view.center.y) * (1 - 1 / scale)
                this.view.zoom = this.zoomEvent.before.z * (1 - t) + this.zoomEvent.after.z * t
                this.view.zoom = Math.round(this.view.zoom * 1e3) / 1e3
                this.updateView()
                this.zoomEvent.t--
            }
            if (this.panEvent.t > 0) {
                let t = 1 - (this.panEvent.t - 1) / this.panEvent.frames
                t = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t //easeInOutQuad
                let x = this.panEvent.before.x * (1 - t) + this.panEvent.after.x * t
                let y = this.panEvent.before.y * (1 - t) + this.panEvent.after.y * t
                let z = this.panEvent.before.z * (1 - t) + this.panEvent.after.z * t
                z = Math.round(z * 1e2) / 1e2
                this.zoomEvent.after = { x, y, z }
                this.view.center = { x, y }
                this.view.zoom = z
                this.updateView()
                this.panEvent.t--
            }
            let isMoveEnd = this.moveEvent.t == 0 && this.zoomEvent.t == 0 && this.panEvent.t == 0
            if (!isMoveEnd) this.dispatchEvent('moving', {})
            if (isMoveEnd != this.isMoveEnd) {
                this.isMoveEnd = isMoveEnd
                if (isMoveEnd) {
                    let { center, zoom } = this.view
                    let { x, y } = center
                    let lnglat = this.coord2lnglat([x, y])
                    this.dispatchEvent('moveend', { lnglat, zoom })
                }
            }
            // raster
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            // this.renderGrids()
            for (let raster of this.rasters.slice().reverse()) {
                if (!raster.active) continue
                this.ctx.globalAlpha = raster.opacity
                this.renderRaster(raster)
            }
            // image shapes
            for (let i = this.imageShapes.length - 1; i >= 0; i--) {
                this.imageShapes[i].updateGisClient()
                this.imageShapes[i].draw(this.ctx)
            }
            // vectors
            let tolerance = Math.pow(2, 18 - this.view.zoom)
            tolerance = tolerance < 1 ? 0 : tolerance
            const isOverlaped = (bbox1, bbox2) => bbox1[0] <= bbox2[2] && bbox1[2] >= bbox2[0] && bbox1[1] <= bbox2[3] && bbox1[3] >= bbox2[1]
            let vectors = this.vectors.filter(f => isOverlaped(f.geometry.bbox, this.view.bbox))
            for (let i = vectors.length - 1; i >= 0; i--) {
                if (!(this.notRenderPoints && (vectors[i].geometry.type == 'Point' || vectors[i].geometry.type == 'MultiPoint')))
                    this.renderVector(vectors[i], tolerance)
            }
            if (this.drawEvent.active) {
                this.renderDraw()
            }
            if (this.modifyEvent.feature) {
                this.renderModify()
            }
            if (this.selectEvent.active) {
                let lb = this.coord2client([this.selectEvent.bbox[0], this.selectEvent.bbox[3]])
                let ub = this.coord2client([this.selectEvent.bbox[2], this.selectEvent.bbox[1]])
                this.ctx.strokeStyle = 'dodgerblue'
                this.ctx.strokeRect(lb[0], lb[1], ub[0] - lb[0], ub[1] - lb[1])
            }
            this.dispatchEvent('render', { features: vectors })
            this.animationFrame = window.requestAnimationFrame(this.render)
        }
        this.render()
    }
    // set function for application
    setSelectedFeatures(features) {
        this.selectEvent.styling = false
        this.selectEvent.features = features
    }
    getSelectedFeatures() { return this.selectEvent.features }
    set(key, value) { this[key] = value }
    addImageShape(img, filename) {
        let imageShape = new ImageShape(img, this.view.w / 2, this.view.h / 2, this)
        imageShape.filename = filename
        this.imageShapes.push(imageShape)
    }
    dispatchEvent(type, payload) {
        for (let fn of this.events[type]) { fn(payload) }
    }
    addEventListener(type, fn) {
        try { this.events[type].push(fn) }
        catch { console.error('no such type of event!') }
    }
    // default functions
    renderModify() {
        let coords = this.modifyEvent.feature.geometry.coordinates
        let geomType = this.modifyEvent.feature.geometry.type
        coords = geomType == 'PointS' ? [coords] : geomType == 'LineString' ? coords : geomType == 'Polygon' ? coords[0] : []
        coords.map(coord => this.coord2client(coord)).map((client, i) => {
            this.ctx.beginPath()
            this.ctx.lineWidth = 2
            this.ctx.strokeStyle = 'white'
            this.ctx.fillStyle = 'dodgerblue'
            this.ctx.arc(client[0], client[1], 3, 0, 2 * Math.PI, false)
            this.ctx.stroke()
            this.ctx.fill()
            this.ctx.closePath()
        })
    }
    renderDraw() {
        // draw polygon
        let path = this.drawEvent.path.map(coord => this.coord2client(coord))
        if (path.length) {
            let dx = this.moveEvent.x - path[0][0]
            let dy = this.moveEvent.y - path[0][1]
            if (Math.sqrt(dx * dx + dy * dy) < 10) {
                if (path.length > 2)
                    path.push(path[0])
                this.drawEvent.snap = true
            } else {
                this.drawEvent.snap = false
            }
        }
        if (!this.drawEvent.snap) {
            path.push([this.moveEvent.x, this.moveEvent.y])
        }
        this.ctx.beginPath()
        this.ctx.lineCap = 'round'
        this.ctx.lineWidth = 2
        this.ctx.strokeStyle = 'dodgerblue'
        this.ctx.fillStyle = 'rgba(0,0,255,0.3)'
        path.map((client, i) => {
            if (i > 0) {
                this.ctx.lineTo(client[0], client[1])
            } else {
                this.ctx.moveTo(client[0], client[1])
            }
        })
        this.ctx.fill()
        this.ctx.stroke()
        this.ctx.closePath()
        // draw dots
        path.map((client, i) => {
            this.ctx.beginPath()
            this.ctx.lineWidth = 2
            this.ctx.strokeStyle = 'white'
            this.ctx.fillStyle = 'dodgerblue'
            this.ctx.arc(client[0], client[1], 5, 0, 2 * Math.PI, false)
            this.ctx.stroke()
            this.ctx.fill()
            this.ctx.closePath()
        })
    }
    panTo(coord, newZoom = this.view.zoom) {
        this.panEvent.before = { ...this.view.center, z: this.view.zoom }
        this.panEvent.after = { x: coord[0], y: coord[1], z: newZoom }
        this.panEvent.t = this.panEvent.frames
    }
    fitBound(bbox, padding = 50) {
        let vw = this.view.bbox[2] - this.view.bbox[0], vh = this.view.bbox[3] - this.view.bbox[1]
        let bw = bbox[2] - bbox[0], bh = bbox[3] - bbox[1], bx = bbox[0] + bw / 2, by = bbox[1] + bh / 2
        vw *= (this.view.w - padding) / this.view.w
        vh *= (this.view.h - padding) / this.view.h
        let ratio = Math.min(vw / bw, vh / bh)
        let newZoom = this.view.zoom + Math.log2(ratio)
        newZoom = this.minmax(newZoom, this.view.minZoom, this.view.maxZoom)
        this.panTo([bx, by], newZoom)
    }
    handleMousedown(e) {
        let rect = this.canvas.getBoundingClientRect()
        let clientX = e.clientX - rect.left, clientY = e.clientY - rect.top
        if (this.modifyEvent.feature) {
            let coords = this.modifyEvent.feature.geometry.coordinates
            let geomType = this.modifyEvent.feature.geometry.type
            coords = geomType == 'Point' ? [coords] : geomType == 'LineString' ? coords : geomType == 'Polygon' ? coords[0] : []
            this.modifyEvent.coords = coords // assign by reference
            this.modifyEvent.geomType = geomType
            let clients = coords.map(coord => this.coord2client(coord))
            const Euclidean = (p1, p2) => Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2))
            this.modifyEvent.anchor = -1
            let buffer = geomType == 'Point' ? parseInt(this.modifyEvent.feature.properties['radius']) || 10 : 10
            for (let i = 0; i < clients.length; i++) {
                if (Euclidean([clientX, clientY], clients[i]) < buffer) {
                    this.modifyEvent.anchor = i; break;
                }
                if (i > 0) {
                    let perpendicular = this.perpendicular([clientX, clientY], clients[i - 1], clients[i])
                    if (perpendicular.distance < 5) {
                        coords.splice(i, 0, this.client2coord(perpendicular.closest))
                        this.modifyEvent.anchor = i; break;
                    }
                }
            }
        }
        if (this.selectEvent.ctrlKey) {
            this.selectEvent.active = true
            let coord = this.client2coord([clientX, clientY])
            this.selectEvent.bbox = [coord[0], coord[1], coord[0], coord[1]]
        } else {
            this.moveEvent.active = true
            e.target.style.cursor = 'grabbing'
            if (e.button == 2) {
                this.drawEvent.active = true
            }
        }
        this.panEvent.t = 0
        this.moveEvent.x = clientX
        this.moveEvent.y = clientY
    }
    handleMousemove(e) {
        let rect = this.canvas.getBoundingClientRect()
        let clientX = e.clientX - rect.left, clientY = e.clientY - rect.top
        let vx = - clientX + this.moveEvent.x
        let vy = clientY - this.moveEvent.y
        if ((this.moveEvent.active || this.modifyEvent.active || this.selectEvent.active) && Math.sqrt(vx * vx + vy * vy) > 3)
            this.moveEvent.moved = true
        if (this.moveEvent.moved || this.drawEvent.active) {
            this.moveEvent.x = clientX
            this.moveEvent.y = clientY
        }
        if (this.modifyEvent.anchor != -1) {
            let i = this.modifyEvent.anchor
            this.modifyEvent.coords[i] = this.client2coord([clientX, clientY])
            if (this.modifyEvent.geomType == 'Point')
                this.modifyEvent.feature.geometry.coordinates = this.modifyEvent.coords[0]
            if (this.modifyEvent.geomType == 'Polygon' && i == 0)
                this.modifyEvent.coords[this.modifyEvent.coords.length - 1] = this.modifyEvent.coords[0].slice()
            Object.assign(this.modifyEvent.feature.properties, this.getDerivedProperties(this.modifyEvent.feature))
        } else {
            if (this.moveEvent.active && this.moveEvent.moved) {
                this.setView([vx, vy])
                Object.assign(this.moveEvent, { vx, vy, t: this.moveEvent.frames })
            }
            if (this.selectEvent.active) {
                let coord = this.client2coord([clientX, clientY])
                this.selectEvent.bbox[2] = coord[0]
                this.selectEvent.bbox[1] = coord[1]
            }
        }
        this.moveEvent.currentCoord = this.client2coord([clientX, clientY])
    }
    handleMouseup(e) {
        let rect = this.canvas.getBoundingClientRect()
        let clientX = e.clientX - rect.left, clientY = e.clientY - rect.top
        if (this.modifyEvent.anchor != -1) {
            if (!this.moveEvent.moved && this.modifyEvent.coords.length > 2) {
                this.modifyEvent.coords.splice(this.modifyEvent.anchor, 1)
                if (this.modifyEvent.anchor == 0 && this.modifyEvent.feature.geometry.type == 'Polygon') {
                    this.modifyEvent.coords[this.modifyEvent.coords.length - 1] = this.modifyEvent.coords[0]
                }
            }
            this.modifyEvent.feature.geometry.bbox = this.getBbox(this.modifyEvent.coords)
        }
        if (this.drawEvent.active && !this.moveEvent.moved) {
            this.drawEvent.path.push(this.client2coord([clientX, clientY]))
        }
        const dispatchSelectEvent = (features) => {
            if (!this.drawEvent.active) {
                this.selectEvent.features = features
                if (features.length == 1)
                    this.modifyEvent.feature = features[0]
                else
                    this.modifyEvent.feature = null
                this.dispatchEvent('select', { features })
            }
        }
        if (this.selectEvent.active) {
            if (this.moveEvent.moved) {
                let bbox = this.selectEvent.bbox
                if (bbox[0] > bbox[2])
                    [bbox[0], bbox[2]] = [bbox[2], bbox[0]]
                if (bbox[1] > bbox[3])
                    [bbox[1], bbox[3]] = [bbox[3], bbox[1]]
                const isInBbox = feature => {
                    let fgb = feature.geometry.bbox
                    return fgb[0] >= bbox[0] && fgb[1] >= bbox[1] && fgb[2] <= bbox[2] && fgb[3] <= bbox[3]
                }
                dispatchSelectEvent(this.vectors.filter(f => f.properties['opacity'] != 0).filter(f => isInBbox(f)))
            } else { //toggle selection
                let feature = this.detectClient([clientX, clientY])
                if (feature) {
                    if (this.selectEvent.features.includes(feature))
                        dispatchSelectEvent(this.selectEvent.features.filter(x => x != feature))
                    else
                        dispatchSelectEvent([feature, ...this.selectEvent.features])
                }
            }
        } else if (!this.moveEvent.moved) {
            let feature = this.detectClient([clientX, clientY])
            dispatchSelectEvent(feature ? [feature] : [])
        }
        this.moveEvent.active = false
        this.moveEvent.moved = false
        this.selectEvent.active = false
        this.modifyEvent.anchor = -1
        e.target.style.cursor = 'grab'
    }
    getLength(coords) {
        return coords.reduce((acc, cur, i, arr) => {
            if (i == 0) return acc
            return acc + haversine(arr[i - 1], arr[i])
        }, 0)
        function haversine(c1, c2) {
            var r = 6371008.8,
                lat1 = c1[1] * Math.PI / 180,
                lat2 = c2[1] * Math.PI / 180,
                dlat = (lat2 - lat1) / 2,
                dlon = (c2[0] - c1[0]) * Math.PI / 180 / 2,
                a = Math.sin(dlat) * Math.sin(dlat) +
                    Math.cos(lat1) * Math.cos(lat2) *
                    Math.sin(dlon) * Math.sin(dlon)
            return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        }
    }
    getFeatureLength(feature) {
        if (feature.geometry.type == 'LineString')
            return this.getLength(feature.geometry.coordinates.map(this.coord2lnglat))
        if (feature.geometry.type == 'Polygon')
            return this.getLength(feature.geometry.coordinates[0].map(this.coord2lnglat))
        return 0
    }
    getArea(coords) {
        var radius = 6371008.8, area = 0
        let x1 = coords[coords.length - 1][0]
        let y1 = coords[coords.length - 1][1]
        for (let i = 0; i < coords.length; i++) {
            let x2 = coords[i][0]
            let y2 = coords[i][1]
            area += (x2 - x1) * Math.PI / 180 * (2 + Math.sin(y1 * Math.PI / 180) + Math.sin(y2 * Math.PI / 180))
            x1 = x2
            y1 = y2
        }
        return Math.abs(area * radius * radius / 2.0)
    }
    getFeatureArea(feature) {
        if (feature.geometry.type == 'Polygon') {
            return feature.geometry.coordinates.reduce((acc, cur, i) => {
                if (i == 0) return acc + this.getArea(cur.map(this.coord2lnglat))
                else return acc - this.getArea(cur.map(this.coord2lnglat))
            }, 0)
        }
        if (feature.geometry.type == 'MultiPolygon') {
            return feature.geometry.coordinates.reduce((accArea, coords) => {
                return accArea + coords.reduce((acc, cur, i) => {
                    if (i == 0) return acc + this.getArea(cur.map(this.coord2lnglat))
                    else return acc - this.getArea(cur.map(this.coord2lnglat))
                }, 0)
            }, 0)
        }
        return 0
    }
    getDerivedProperties(feature) {
        let properties = {}
        let length = this.getFeatureLength(feature)
        if (length)
            properties['周長'] = length < 1e3 ? length.toFixed(0) + '公尺' : (length / 1e3).toFixed(3) + '公里'
        let area = this.getFeatureArea(feature)
        if (area) {
            properties['面積'] = area < 1e4 ? area.toFixed(0) + '平方公尺' :
                area < 1e6 ? (area / 1e4).toFixed(3) + '公頃' :
                    (area / 1e6).toFixed(3) + '平方公里'
        }
        return properties
    }
    handleDblclick(e) {
        if (this.drawEvent.active) {
            let path = this.drawEvent.path.slice(0, -1)
            let geomType = 'LineString'
            if (this.drawEvent.snap) {
                if (path.length < 3) {
                    geomType = 'Point'
                    path = path[0]
                } else {
                    geomType = 'Polygon'
                    path[path.length - 1] = path[0].slice()
                    path = [path]
                }
            }
            let feature = { geometry: { type: geomType, coordinates: path }, properties: {} }
            let properties = this.getDerivedProperties(feature)
            if (geomType == 'Point') {
                properties['radius'] = 10
                properties['lineWidth'] = 3
                properties['fill'] = 'rgba(0,0,255,0.3)'
            }
            feature = this.addVector(geomType, path, properties, true)
            this.drawEvent.path = []
            this.drawEvent.active = false
            this.drawEvent.snap = false
            this.dispatchEvent('drawend', { feature })
        }
    }
    handleMouseleave(e) {
        this.moveEvent.active = false
        e.target.style.cursor = 'grab'
    }
    handleWheel(e) {
        e.preventDefault()
        let isTouchPad = e.wheelDeltaY ? e.wheelDeltaY === -3 * e.deltaY : e.deltaMode === 0
        if (navigator.userAgent.match(/(MSIE)|(Trident)/)) isTouchPad = false
        if (isTouchPad) this.zoomEvent.delta = 0.1
        var coord = this.client2coord([e.clientX, e.clientY])
        var delta = this.zoomEvent.delta
        var newZoom = this.zoomEvent.after.z - Math.sign(e.deltaY) * delta
        newZoom = this.minmax(newZoom, this.view.minZoom, this.view.maxZoom)
        Object.assign(this.zoomEvent, {
            before: { x: this.view.center.x, y: this.view.center.y, z: this.view.zoom },
            after: { x: coord[0], y: coord[1], z: newZoom },
            t: this.zoomEvent.frames,
            zStep: newZoom < this.view.zoom ? -1 : 1,
        })
    }
    handleResize() {
        this.canvas.width = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight
        this.view.w = this.canvas.clientWidth
        this.view.h = this.canvas.clientHeight
        this.updateView()
    }
    updateView() {
        var world = this.world,
            view = this.view,
            squ = Math.pow(2, view.zoom),
            tp = this.tilePixel,
            W = world.w * view.w / (tp.w * squ),
            H = world.h * view.h / (tp.h * squ)
        this.view.bbox[0] = view.center.x - W / 2
        this.view.bbox[1] = view.center.y - H / 2
        this.view.bbox[2] = view.center.x + W / 2
        this.view.bbox[3] = view.center.y + H / 2
        this.updateScale()
    }
    setView(offset) {
        var view = this.view,
            tp = this.tilePixel,
            squ = Math.pow(2, view.zoom)
        view.center.x += offset[0] * this.world.w / tp.w / squ
        view.center.y += offset[1] * this.world.h / tp.h / squ
        this.updateView()
    }
    updateScale() {
        const maxWidth = 200
        let c1 = this.coord2lnglat(this.client2coord([this.view.w, this.view.h]))
        let c2 = this.coord2lnglat(this.client2coord([this.view.w - maxWidth, this.view.h]))
        let m = this.getLength([c1, c2])
        let exp = Math.floor(Math.log10(m))
        let digit = m / Math.pow(10, exp)
        digit = digit > 5 ? 5 : digit > 2 ? 2 : 1
        let mul = digit * Math.pow(10, exp) / m
        m = digit * Math.pow(10, exp)
        this.view.scaleText = m > 1e3 ? (m / 1e3) + '公里' : m + '公尺'
        let width = maxWidth * mul
        this.view.scaleWidth = width.toFixed(0) + 'px'
        this.view.scaleStripe = digit == 5 ? Math.round(width / 5) : digit == 2 ? Math.round(width / 2) : Math.round(width / 5)
    }
    client2coord(client) {
        var view = this.view,
            W = view.bbox[2] - view.bbox[0],
            H = view.bbox[1] - view.bbox[3]
        return [
            view.bbox[0] + client[0] * W / view.w,
            view.bbox[3] + client[1] * H / view.h
        ]
    }
    coord2client(coord) {
        var view = this.view,
            W = view.bbox[2] - view.bbox[0],
            H = view.bbox[1] - view.bbox[3]
        return [
            (coord[0] - view.bbox[0]) / W * view.w,
            (coord[1] - view.bbox[3]) / H * view.h
        ]
    }
    minmax(input, min, max) {
        return input < min ? min : input > max ? max : input
    }
    renderGrids(dz) {
        const tp = this.tilePixel, world = this.world, view = this.view
        const origin = {
            x: (world.bbox[0] - view.bbox[0]) / world.w * tp.w * Math.pow(2, view.zoom),
            y: -(world.bbox[3] - view.bbox[3]) / world.h * tp.h * Math.pow(2, view.zoom)
        }
        this.getXYZ(view.zoom + dz).tiles.map(tile => {
            let scale = Math.pow(2, view.zoom - tile.z)
            let W = tp.w * scale
            let H = tp.h * scale
            let X = origin.x + tile.x * W
            let Y = origin.y + tile.y * H
            this.ctx.lineWidth = 1
            this.ctx.strokeRect(X, Y, W, H)
            this.ctx.stroke()
        })
    }
    renderRaster(raster) {
        const tp = this.tilePixel, world = this.world, view = this.view
        const origin = {
            x: (world.bbox[0] - view.bbox[0]) / world.w * tp.w * Math.pow(2, view.zoom),
            y: -(world.bbox[3] - view.bbox[3]) / world.h * tp.h * Math.pow(2, view.zoom)
        }
        var z = Math.floor(view.zoom)
        var { tiles, minX, minY, maxX, maxY } = this.getXYZ(this.minmax(z, raster.min || this.view.minZoom, raster.max || this.view.maxZoom))
        // load images
        if (!this.tiles[raster.url])
            this.tiles[raster.url] = {}
        var subDomain = raster.url.match(/\{([a-z])-([a-z])\}/)
        tiles.map(tile => {
            let src = raster.url.replace('{x}', tile.x).replace('{y}', tile.y).replace('{z}', tile.z)
            if (subDomain) {
                let charStart = subDomain[1].charCodeAt(0)
                let chartEnd = subDomain[2].charCodeAt(0)
                let domain = String.fromCharCode(charStart + Math.floor(Math.random() * (chartEnd - charStart)))
                src = src.replace(subDomain[0], domain)
            }
            if (!this.tiles[raster.url][`${tile.x},${tile.y},${tile.z}`]) {
                var img = new Image()
                img.crossOrigin = 'anonymous'
                img.src = src
                this.tiles[raster.url][`${tile.x},${tile.y},${tile.z}`] = img
            }
        })
        // find loaded images
        var tilesNotLoaded = tiles
        var tilesLoaded = []
        var zStep = this.zoomEvent.zStep
        while (tilesNotLoaded.length && z >= view.minZoom && z <= view.maxZoom) {
            let unique = {}
            for (let tile of tilesNotLoaded) {
                let img = this.tiles[raster.url][`${tile.x},${tile.y},${tile.z}`]
                let loaded = img ? img.complete : false
                if (loaded) {
                    tilesLoaded.unshift(tile)
                } else if (zStep == 1) {
                    tile.x = Math.floor(tile.x / 2)
                    tile.y = Math.floor(tile.y / 2)
                    tile.z -= 1
                    unique[[tile.x, tile.y, tile.z]] = tile
                } else if (zStep == -1) {
                    for (let i = 0; i < 4; i++) {
                        let newTile = Object.assign({}, tile)
                        newTile.x = newTile.x * 2 + i % 2
                        newTile.y = newTile.y * 2 + Math.floor(i / 2)
                        newTile.z += 1
                        unique[[newTile.x, newTile.y, newTile.z]] = newTile
                    }
                }
            }
            tilesNotLoaded = Object.values(unique)
            z -= zStep
            if (z - view.zoom >= 2) break //prevent from exponential explotion
        }
        return tilesLoaded.map(tile => {
            let scale = Math.pow(2, view.zoom - tile.z)
            let W = tp.w * scale
            let H = tp.h * scale
            let X = origin.x + tile.x * W
            let Y = origin.y + tile.y * H
            let img = this.tiles[raster.url][`${tile.x},${tile.y},${tile.z}`]
            try { if (img.complete) this.ctx.drawImage(img, X, Y, W, H) }
            catch { }
            return { img, X, Y, W, H }
        })
    }
    getXYZ(z) {
        z = Math.floor(z || this.view.zoom)
        var view = this.view,
            squ = Math.pow(2, z),
            world = this.world,
            minX = Math.floor((view.bbox[0] - world.bbox[0]) * squ / world.w),
            minY = Math.floor(-(view.bbox[3] - world.bbox[3]) * squ / world.h),
            maxX = Math.ceil((view.bbox[2] - world.bbox[0]) * squ / world.w),
            maxY = Math.ceil(-(view.bbox[1] - world.bbox[3]) * squ / world.h),
            tiles = []
        minX = this.minmax(minX, 0, squ - 1)
        maxX = this.minmax(maxX, 0, squ - 1)
        minY = this.minmax(minY, 0, squ - 1)
        maxY = this.minmax(maxY, 0, squ - 1)
        for (var x = minX; x <= maxX; x++) {
            for (var y = minY; y <= maxY; y++) {
                tiles.push({ x, y, z })
            }
        }
        return { tiles, minX, minY, maxX, maxY }
    }
    getBbox(coords) {
        return [
            Math.min(...coords.map(c => c[0])),
            Math.min(...coords.map(c => c[1])),
            Math.max(...coords.map(c => c[0])),
            Math.max(...coords.map(c => c[1]))
        ]
    }
    getBboxCenter(bbox) {
        return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
    }
    lnglat2coord(lnglat) {
        var d = Math.PI / 180,
            max = 85.0511287798,
            lat = Math.max(Math.min(max, lnglat[1]), -max),
            sin = Math.sin(lat * d);
        return [
            6378137 * lnglat[0] * d,
            6378137 * Math.log((1 + sin) / (1 - sin)) / 2
        ]
    }
    coord2lnglat(point) {
        var d = 180 / Math.PI
        return [
            point[0] * d / 6378137,
            (2 * Math.atan(Math.exp(point[1] / 6378137)) - (Math.PI / 2)) * d
        ]
    }
    isInPolygon(p, polygon) {
        let isInside = false
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            let p1 = polygon[j], p2 = polygon[i]
            let c1 = (p2[1] > p[1]) != (p1[1] > p[1])
            let c2 = (p[0] < (p1[0] - p2[0]) * (p[1] - p2[1]) / (p1[1] - p2[1]) + p2[0])
            if (c1 && c2) { isInside = !isInside }
        }
        return isInside;
    }
    geojson(geojson, projected = false) {
        let features = geojson.features.map(feature => {
            feature.geometry.type = feature.geometry.type
            let geom = feature.geometry
            geom.bbox = [Infinity, Infinity, -Infinity, -Infinity]
            const project = lnglat => {
                let [x, y] = projected ? lnglat : this.lnglat2coord(lnglat)
                geom.bbox[0] = Math.min(geom.bbox[0], x)
                geom.bbox[1] = Math.min(geom.bbox[1], y)
                geom.bbox[2] = Math.max(geom.bbox[2], x)
                geom.bbox[3] = Math.max(geom.bbox[3], y)
                lnglat[0] = x
                lnglat[1] = y
            }
            switch (geom.type) {
                case 'Point':
                    project(geom.coordinates); break;
                case 'MultiPoint':
                    geom.coordinates.map(lnglat => project(lnglat)); break;
                case 'LineString':
                    geom.coordinates.map(lnglat => project(lnglat)); break;
                case 'MultiLineString':
                    geom.coordinates.map(arr => arr.map(lnglat => project(lnglat))); break;
                case 'Polygon':
                    geom.coordinates.map(arr => arr.map(lnglat => project(lnglat)))
                    feature.properties['Area'] = (this.getFeatureArea(feature) / 1e6).toFixed(3)
                    break;
                case 'MultiPolygon':
                    geom.coordinates.map(arr2d => arr2d.map(arr => arr.map(lnglat => project(lnglat))))
                    feature.properties['Area'] = (this.getFeatureArea(feature) / 1e6).toFixed(3)
                    break;
            }
            return feature
        })
        this.vectors.unshift(...features)
        return features
    }
    detectClient(client) {
        const Euclidean = (p1, p2) => Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2))
        const isOverlaped = (bbox1, bbox2) => bbox1[0] <= bbox2[2] && bbox1[2] >= bbox2[0] && bbox1[1] <= bbox2[3] && bbox1[3] >= bbox2[1]
        const isInBbox = (p, bbox) => p[0] >= bbox[0] && p[0] <= bbox[2] && p[1] >= bbox[1] && p[1] <= bbox[3]
        let point = this.client2coord(client)
        let features = this.vectors.filter(f => f.properties['opacity'] != 0)
            .filter(f => isOverlaped(f.geometry.bbox, this.view.bbox))
            .filter(f => ['Point', 'MultiPoint'].includes(f.geometry.type) ? true : isInBbox(point, f.geometry.bbox))
        for (let feature of features) {
            let geom = feature.geometry
            let isInGeometry = false
            switch (geom.type) {
                case 'Point':
                    isInGeometry = Euclidean(client, this.coord2client(geom.coordinates)) < (parseInt(feature.properties.radius) || 5); break;
                case 'MultiPoint':
                    isInGeometry = geom.coordinates.some(coord => Euclidean(client, this.coord2client(coord)) < 5); break;
                case 'LineString':
                    isInGeometry = geom.coordinates.map(c => this.coord2client(c)).some((coord, i, coords) => i == 0 ? false : this.perpendicular(client, coords[i - 1], coord).distance < (feature.properties.lineWidth / 2 || 5)); break;
                case 'MultiLineString':
                    isInGeometry = geom.coordinates.some(arr => arr.map(c => this.coord2client(c)).some((coord, i, coords) => i == 0 ? false : this.perpendicular(client, coords[i - 1], coord).distance < (feature.properties.lineWidth / 2 || 5))); break;
                case 'Polygon':
                    isInGeometry = geom.coordinates.every((arr, i) => i == 0 ? this.isInPolygon(point, arr) : !this.isInPolygon(point, arr)); break;
                case 'MultiPolygon':
                    isInGeometry = geom.coordinates.some(arr2d => arr2d.every((arr, i) => i == 0 ? this.isInPolygon(point, arr) : !this.isInPolygon(point, arr))); break;
            }
            if (isInGeometry)
                return feature
        }
        return false
    }
    getDefaultStyle(feature) {
        return {
            'lineWidth': feature.properties['lineWidth'] == undefined ? 1 : parseInt(feature.properties['lineWidth']),
            'lineDash': feature.properties['lineDash'] ? feature.properties['lineDash'] : [],
            'lineDashOffset': feature.properties['lineDashOffset'] ? parseInt(feature.properties['lineDashOffset']) : 0,
            'stroke': feature.properties['stroke'] || 'dodgerblue',
            'fill': ['LineString', 'MultiLineString'].includes(feature.geometry.type) ? undefined : feature.properties['fill'] || 'rgba(0,0,255,0.3)',
            'radius': feature.properties['radius'] ? parseInt(feature.properties['radius']) : 5,
            'opacity': feature.properties['opacity'] != undefined ? parseFloat(feature.properties['opacity']) : 1,
            'text': feature.properties['text'],
            'textAnchor': feature.properties['textAnchor'] || '[0,0]',
            'textFill': feature.properties['textFill'] || '#000000',
            'textStroke': feature.properties['textStroke'] || '#ffffff',
            'textRotate': feature.properties['textRotate'] || 0,
            'fontFamily': feature.properties['fontFamily'] || '微軟正黑體',
            'fontWeight': feature.properties['fontWeight'] ? parseInt(feature.properties['fontWeight']) : 0,
            'fontSize': feature.properties['fontSize'] ? parseInt(feature.properties['fontSize']) : 12,
        }
    }
    renderVector(feature, tolerance = 0) {
        let style = this.getDefaultStyle(feature)
        if (style.opacity === 0) return
        // selected style
        if (!this.selectEvent.styling && this.selectEvent.features.includes(feature)) {
            Object.assign(style, {
                stroke: 'red',
                fill: ['LineString', 'MultiLineString'].includes(feature.geometry.type) ? undefined : 'rgba(255,0,0,0.3)'
            })
        }
        // render
        this.ctx.globalAlpha = style.opacity
        const drawText = (client) => {
            this.ctx.font = `bold ${style.fontSize}px ${style.fontFamily}`
            this.ctx.textBaseline = 'middle'
            let anchor = JSON.parse(style.textAnchor)
            let metric = this.ctx.measureText(style.text)
            this.ctx.fillStyle = style.textFill
            this.ctx.strokeStyle = style.textStroke
            let x = client[0] + anchor[0] / 2 * metric.width + style.radius * anchor[0]
            let y = client[1] + anchor[1] / 2 * style.fontSize + style.radius * anchor[1]
            this.ctx.save()
            this.ctx.translate(x, y)
            if (style.textRotate) {
                this.ctx.rotate(style.textRotate * Math.PI / 180)
            }
            if (style.fontWeight) {
                this.ctx.lineWidth = style.fontWeight
                this.ctx.strokeText(style.text, -metric.width / 2, 0)
            }
            this.ctx.fillText(style.text, -metric.width / 2, 0)
            this.ctx.restore()
        }
        const drawStroke = () => {
            this.ctx.setLineDash(style.lineDash)
            this.ctx.lineDashOffset = style.lineDashOffset
            this.ctx.strokeStyle = style.stroke
            this.ctx.lineWidth = style.lineWidth
            if (style.lineDash.length) {
                this.ctx.lineCap = 'butt'
                this.ctx.lineJoin = 'butt'
            } else {
                this.ctx.lineCap = 'round'
                this.ctx.lineJoin = 'round'
            }
            this.ctx.stroke()
        }
        const drawCircle = (coord) => {
            let c = this.coord2client(coord)
            this.ctx.beginPath()
            this.ctx.moveTo(c[0] + style.radius, c[1])
            this.ctx.arc(c[0], c[1], style.radius, 0, Math.PI * 2, false)
            if (style.lineWidth) {
                drawStroke()
            }
            if (style.fill) {
                this.ctx.fillStyle = style.fill
                this.ctx.fill()
            }
            if (style.text) {
                drawText(c)
            }
            this.ctx.closePath()
        }
        const drawPath = (coords) => {
            this.ctx.beginPath()
            coords.map((coord, i) => {
                let c = this.coord2client(coord)
                if (i == 0)
                    this.ctx.moveTo(c[0], c[1])
                else
                    this.ctx.lineTo(c[0], c[1])
            })
            if (style.lineWidth) {
                drawStroke()
            }
            if (style.fill) {
                this.ctx.fillStyle = style.fill
                this.ctx.fill()
            }
            this.ctx.closePath()
        }
        switch (feature.geometry.type) {
            case 'Point':
                drawCircle(feature.geometry.coordinates)
                break
            case 'MultiPoint':
                feature.geometry.coordinates.map(coord => {
                    drawCircle(this.coord2client(coord))
                })
                break
            case 'LineString':
                drawPath(feature.geometry.coordinates)
                if (feature.geometry.coordinates.length == 2 && feature.properties['周長']) {
                    let coords = feature.geometry.coordinates
                    let c1 = this.coord2client(coords[0])
                    let c2 = this.coord2client(coords[1])
                    let rad = Math.atan2(c2[1] - c1[1], c2[0] - c1[0])
                    this.ctx.save()
                    this.ctx.translate((c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2)
                    this.ctx.rotate(rad)
                    style.text = feature.properties['周長']
                    drawText([0, 0])
                    this.ctx.restore()
                }
                break
            case 'MultiLineString':
                for (let coords of feature.geometry.coordinates) {
                    drawPath(this.DouglasPeucker(coords, tolerance))
                }
                break
            case 'Polygon':
                for (let coords of feature.geometry.coordinates) {
                    drawPath(coords)
                }
                if (style.text)
                    drawText(this.coord2client(this.getBboxCenter(feature.geometry.bbox)))
                break
            case 'MultiPolygon':
                for (let coordinates of feature.geometry.coordinates) {
                    for (let coords of coordinates) {
                        drawPath(this.DouglasPeucker(coords, tolerance))
                    }
                }
                if (style.text)
                    drawText(this.coord2client(this.getBboxCenter(feature.geometry.bbox)))
                break
        }
    }
    addVector(geomType, coords, properties = {}, projected) {
        let geojson = {
            features: [{
                geometry: {
                    type: geomType,
                    coordinates: coords
                },
                properties: properties
            }]
        }
        return this.geojson(geojson, projected)[0]
    }
    WKT(wkt, properties) {
        let wkt2geojson = { 'POINT': 'Point', 'MULTIPOINT': 'MultiPoint', 'LINESTRING': 'LineString', 'MULTILINESTRING': 'MultiLineString', 'POLYGON': 'Polygon', 'MULTIPOLYGON': 'MultiPolygon' }
        let geomType = wkt2geojson[wkt.match(/\w+/)[0]]
        let jsonString = wkt.slice(geomType.length).replace(/[\d.]+\s[\d.]+/g, '[$&]').replace(/\s/g, ',').replace(/\(/g, '[').replace(/\)/g, ']')
        let coordinates = JSON.parse(jsonString)
        return this.addVector(geomType, coordinates, properties, false)
    }
    perpendicular(p, p1, p2) {
        var x = p1[0],
            y = p1[1],
            dx = p2[0] - p1[0],
            dy = p2[1] - p1[1]
        if (dx !== 0 || dy !== 0) {
            var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy) //scale of projection
            if (t > 1) {
                x = p2[0]
                y = p2[1]
            } else if (t > 0) {
                x += dx * t
                y += dy * t
            }
        }
        dx = p[0] - x
        dy = p[1] - y
        return {
            distance: Math.sqrt(dx * dx + dy * dy),
            closest: [x, y]
        }
    }
    radialDistFilter(points, epsilon) {
        if (epsilon == 0) return points
        var epsilon_squ = epsilon * epsilon
        return points.filter((point, i, points) => {
            if (i == 0) return true
            var dx = point[0] - points[i - 1][0]
            var dy = point[1] - points[i - 1][1]
            return dx * dx + dy * dy > epsilon_squ
        })
    }
    DouglasPeucker(points, epsilon) {
        // points = this.radialDistFilter(points,epsilon)
        if (epsilon == 0) return points
        var dmax = 0, index = -1, firstPoint = points[0], lastPoint = points[points.length - 1]
        for (var i = 1; i < points.length; i++) {
            var d = this.perpendicular(points[i], firstPoint, lastPoint).distance
            if (d > dmax) {
                dmax = d
                index = i
            }
        }
        if (dmax >= epsilon) {
            return [
                ...this.DouglasPeucker(points.slice(0, index + 1), epsilon).slice(0, -1),
                ...this.DouglasPeucker(points.slice(index), epsilon)
            ]
        } else {
            return [points[0], points[points.length - 1]]
        }
    }
}