//Object.defineProperty()
function observe(obj) {
    if (typeof obj !== 'object' || obj == null) {
        return
    }

    // 传建一个Observer实例
    // 每次遍历一个对象属性就创建一个Ob实例
    new Observer(obj)
}

function defineReactive(obj, key, value) {
    //递归遍历，如果val本身是个对象
    observe(value);
    //value形成了闭包
    Object.defineProperty(obj, key, {
        get() {
            //读取拦截
            console.log('get', key, value);
            return value;
        },
        set(newValue) {
            // 写拦截
            if (value !== newValue) {
                //如果value本身是对象，则还是需要做响应式处理
                observe(newValue)
                console.log('set', key, newValue);
                value = newValue;
            }
        },
    })
}

function set(obj, key, val) {
    defineReactive(obj, key, val);
}

function proxy(vm, prop) {
    Object.keys(vm[prop]).forEach(key => {
        Object.defineProperty(vm, key, {
            get() {
                return vm[prop][key]
            },
            set(newVal) {
                vm[prop][key] = newVal
            }
        })
    })
}

class KVue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data

        // 1.响应式处理
        observe(this.$data)

        // 1.1 数据代理
        proxy(this, '$data')

        // 2.编译处理
        new Compile(this.$el, this)

    }
}

// 分辨响应式数据对象是对象还是数组
class Observer {
    constructor(value) {
        this.value = value
        this.walk(value)
    }

    walk(obj) {
        Object.keys(obj).forEach(key => {
            defineReactive(obj, key, obj[key]);
        })
    }
}

// Watcher:和模板中的依赖1对1对应，如果某个key发生变化，则执行更新函数
class Watch{
    constructor(vm,key,updater){
        this.vm=vm
        this.key=key
        this.updater=updater
    }

    // 更新方法是让Dep调用的
    update(){
        this.updater.call(this.vm,this.vm[this.key]);
    }
}
// 编译器：解析模板中插值表达式或指令
class Compile {
    // vm是KVue实例用于初始化和更新页面
    // el一个选择器可以获取模板DOM
    constructor(el, vm) {
        this.$vm=vm
        this.$el = document.querySelector(el)

        this.compile(this.$el)
    }

    compile(el) {
        const childNodes = el.childNodes

        Array.from(childNodes).forEach(node => {
            if (this.isElement(node)) {
                // console.log('编译元素节点',node.nodeName)
                this.compileElement(node)
            } else if (this.isInter(node)) {
                // console.log('编译插值表达式',node.textContent)
                this.compileText(node)
            }

            //递归
            if (node.childNodes) {
                this.compile(node)
            }
        })
    }

    isElement(node) {
        return node.nodeType === 1
    }

    isInter(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }

    isDir(attr){
        return attr.indexOf('k-')===0
    }

    // 更新方法
    update(node,exp,dir){
        const fn=this[dir+'updater']
        // 初始化
        fn&&fn(node,this.$vm[exp])

        //更新
        new Watcher(this.$vm,exp,function(val){
            fn&&fn(node,val)
        })
    }

    textUpdater(){
        // 具体操作
        // node.textContent=
    }
    htmlUpdater(){
        
    }
    // 编译差值文本，初始化
    compileText(node) {
        node.textContent = this.$vm[RegExp.$1]

        this.update(node,exp,'text')
    }

    // 编译元素节点：判断它的属性是否是k-xx,$xx
    compileElement(node) {
        let nodeAttrs = node.attributes
        Array.from(nodeAttrs).forEach(attr => {
            // attr对象 {name:'k-text',value:'counter'}
            let attrName = attr.name
            let exp = attr.value
// 如果是指令
            if (this.isDir(attrName)) {
                // 获取指令处理函数并执行
                let dir =attrName.substring(2)
                this[dir] && this[dir](node,exp)
            }
        })
    }

    //k-text指令执行
    text(node,exp) {
        node.textContent=this.$vm[exp]
    }

    html(node,exp){
        node.innerHTML=this.$vm[exp];
    }
}
