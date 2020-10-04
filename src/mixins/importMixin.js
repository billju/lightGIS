import toGeojson from '@mapbox/togeojson'
function beautifiedJsonHtml(){
    let json = JSON.stringify(this.rows,null,2)
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match=>{
        var cls = 'number'
        if (/^"/.test(match)) {
            cls = /:$/.test(match)?'key':'string'
        } else if (/true|false/.test(match)) {
            cls = 'boolean'
        } else if (/null/.test(match)) {
            cls = 'null'
        }
        return '<span class="' + cls + '">' + match + '</span>'
    });
    // .string {color: orange;}
    // .number {color: lightgreen;}
    // .boolean {color: blue;}
    // .null {color: deeppink;}
    // .key {color: lightblue;}
}
function handleUpload(){
    let url = document.getElementById('request-url').value
    const xhr = new XMLHttpRequest()
    // xhr.setRequestHeader('user-agent','Mozilla/5.0 (Windows NT 6.1; Win64; x64)')
    xhr.onload = ()=>{
        xhr.responseText
    }
    // const formData = new FormData()
    // formData.append('filename',file)
    // xhr.open('POST','upload').send(formData)
    // xhr.upload.onprogress = e=>{
    //     if(e.lengthComputable){
    //         e.loaded / e.total
    //     }
    // }
}
export default {
    methods: {
        async handleDrop(e){
            e.preventDefault()
            const files = [...e.dataTransfer.items].filter(item=>item.kind=='file').map(item=>item.getAsFile())
            this.handleFiles(files)
        },
        async handleFiles(files){
            for(let file of files){
                this.handleFile(file)
            }
        },
        async handleFile(file){
            this.setState({isImporting:true})
            let filename = file.name.split('.')[0]
            this.setState({filename})
            let extension = file.name.match(/\.\w+$/i)[0]
            if(file.size/1024/1024>10){//10MB
                this.setState({allowAnimation:false})
                this.toggleAnimation(false)
            }
            if(file.type.includes('image')){
                let img = new Image()
                img.src = URL.createObjectURL(file)
                img.onload = ()=>{
                    this.gismap.addImageShape(img,filename)
                }
            }
            if(extension=='.geojson'){
                let text = await this.readFileAsText(file)
                let geojson = JSON.parse(text)
                this.handleGeojson(geojson,filename)
            }else if(extension=='.kml'){
                let text = await this.readFileAsText(file)
                let kml = (new DOMParser()).parseFromString(text,'text/xml')
                let geojson = toGeojson.kml(kml)
                this.handleGeojson(geojson,filename)
            }else if(extension=='.csv'){
                let text = await this.readFileAsText(file)
                let aoa = this.handleCSV(text,',')
                let cols = aoa[0]
                let rows = aoa.slice(1).map(arr=>Object.fromEntries(arr.map((a,i)=>([cols[i],a]))))
                this.renderTable(rows)
                this.setState({showDataTable:true})
            }else if(extension=='.json'){
                let text = await this.readFileAsText(file)
                let json = JSON.parse(text)
                if(Array.isArray(json)){
                    function deepParse(obj){
                        let shouldKeepParse = false
                        for(let key in obj){
                            if(typeof obj[key]=='object'){
                                shouldKeepParse = true
                                for(let ok in obj[key]){
                                    obj[`${key}.${ok}`] = obj[key][ok]
                                }
                                delete obj[key]
                            }
                        }
                        return shouldKeepParse?deepParse(obj):obj
                    }
                    this.renderTable(json.map(obj=>deepParse(obj)))
                    this.setState({showDataTable:true})
                }else if(typeof json=='object'&&json.type=='FeatureCollection'){
                    this.handleGeojson(json,filename)   
                }
            }
        },
        async readFileAsText(file){
            let reader = new FileReader()
            return new Promise((resolve,reject)=>{
                reader.onload = ()=>{
                    resolve(reader.result)
                }
                reader.readAsText(file,this.encoding)
            })
        },
        handleGeojson(geojson){
            this.setState({
                tmpFeatures: geojson.features.filter(f=>f.geometry),
                showDataTable:true
            })
            this.renderTable(this.tmpFeatures.map(f=>f.properties))
        },
        handleCSV(text,delimiter){
            // copied from https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
            var pattern = new RegExp(
                // Delimiters.
                "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                // Standard fields.
                "([^\"\\" + delimiter + "\\r\\n]*))"
            ,"gi")
            var aoa = [[]], matches
            while(matches = pattern.exec(text)){
                if(matches[1].length&&matches[1]!=delimiter){
                    aoa.push([])
                }
                var matched = matches[2]?matches[2].replace(new RegExp('\"\"','g'),'\"'):matches[3]
                aoa[aoa.length-1].push(matched)
            }
            return aoa
        },
        xml_string_to_json(xmlstr) {
            let parser = new DOMParser();
            let srcDOM = parser.parseFromString(xmlstr, "application/xml");
            function xml2json(srcDOM) {
                let children = [...srcDOM.children];
                if (!children.length) { return srcDOM.innerHTML } 
                let jsonResult = {};
                for (let child of children) {
                    let childIsArray = children.filter(eachChild => eachChild.nodeName === child.nodeName).length > 1;
                    if (childIsArray) {
                        if (jsonResult[child.nodeName] === undefined) {
                            jsonResult[child.nodeName] = [xml2json(child)];
                        } else {
                            jsonResult[child.nodeName].push(xml2json(child));
                        }
                    } else {
                        jsonResult[child.nodeName] = xml2json(child);
                    }
                }
                return jsonResult;
            }
            return xml2json(srcDOM)
        },
    },
    mounted(){
        // window.addEventListener('paste',e=>{
        //     for(let item of e.clipboardData.items){
        //         let blob = item.getAsFile()
        //         if(blob)
        //             this.handleFile(blob)
        //     }
        // })
    }
}