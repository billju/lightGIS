import { mapState, mapGetters } from 'vuex'
export default {
    methods: {
        setState(payload){
            this.$store.commit('setState', payload)
        },
        setArrayOfObject(name,index,payload){
            this.$store.commit('setState', state=>{
                let result = {}
                result[name] = state[name].slice()
                result[name][index] = Object.assign(state[name][index], payload)
                return result
            })
        },
        addGroup(name,theme='success'){
            if(name&&this.groups.findIndex(g=>g.name==name)==-1){
                let propKey
                if(this.gismap.vectors){
                    let idx = this.gismap.vectors.findIndex(f=>f.properties['群組']==name)
                    if(idx!==-1){
                        let keys = Object.keys(this.gismap.vectors[idx].properties)
                        if(keys.length)
                            propKey = keys[0]
                    }
                }
                let newGroup = {name,theme,start:0,active:true,opacity:1,lastOpa:1,propKey,sort:0,solo:false}
                this.setState({ groups: [...this.groups, newGroup] })
            }
        },
        handleSelect(features){
            this.gismap.setSelectedFeatures(features)
        },
        sortRule(a,b,key,direction=1){
            let A = key?a[key]:a
            let B = key?b[key]:b
            if(A==undefined||B==undefined) return 0
            return isNaN(A)?A.toString().localeCompare(B.toString())*direction:(A-B)*direction
        },
        renderTable(rows){
            let cols = [...new Set(rows.flatMap(obj=>Object.keys(obj)))]
            cols = cols.map(col=>({
                key:col, sort:0, filter:[],
                list:[...new Set(rows.map(obj=>obj[col]))]
                    .sort((a,b)=>this.sortRule(a,b,null,1)).slice(0,100)
            }))
            this.setState({ rows, cols })
        },
        toggleAnimation($event){
            this.setState({allowAnimation:$event})
            this.gismap.moveEvent.frames = this.allowAnimation?90:1
            this.gismap.zoomEvent.frames = this.allowAnimation?25:1
            this.gismap.panEvent.frames = this.allowAnimation?60:1
        },
    },
    computed: {
        ...mapState(['gismap','interaction','groups','isLoading','tab']),
        ...mapGetters(['selectedFeatures'])
    },
}