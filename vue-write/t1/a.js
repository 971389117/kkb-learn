// 一个依赖一个watcher (vue1.0)
// Dep管理watcher
// 1个Dep对应1个属性

// 数组响应式
// 1.替换数组原型中7个方法
const originalProto = Array.prototype
// 备份一个，修改备份
const arrayProto = Object.create(originalProto);
['push', 'pop', 'shift', 'unshift'].forEach(method => {
    arrayProto[method] = function () {
        // 原始操作
        originalProto[method].apply(this, arguments)
        // 覆盖操作
        console.log('数组执行' + method + '操作：' + arguments)
    }
})



function observe(obj) {
    // 不是对象直接退出

    if (typeof obj !== 'object' || obj == null) {
        return
    }
    new Observe(obj);
}

function defineReactive(obj, key, val) {

    observe(val)
    const dep = new Dep()
    Object.defineProperty(obj, key, {
        get() {
            Dep.target && dep.addDep(Dep.target)
            return val
        },
        set(newVal) {
            observe(newVal)
            val = newVal

            dep.notify()
        }
    })

}

function proxy(vm) {
    Object.keys(vm.$data).forEach(key => {
        Object.defineProperty(vm, key, {
            get() {
                return vm.$data[key]
            },
            set(newVal) {
                vm.$data[key] = newVal
            }
        })
    })
}
// 分辨响应式数据是对象还是数组
class Observe {
    constructor(value) {
        this.value = value

        // 判断传入的obj类型
        if (Array.isArray(value)) {
            // 覆盖原型，替换7个变更操作
            obj.__proto__ = arrayProto
            // 对数组内部元素执行响应化
            const key = Object.keys(value)
            for (let i = 0; i < obj.length; i++) {
                observe(obj[i])
            }
        } else {
            this.walk(value)
        }
    }

    walk(obj) {
        Object.keys(obj).forEach(key => {
            console.log(key)
            defineReactive(obj, key, obj[key])
        })
    }
}
class Dep {
    constructor() {
        this.watchers = []
    }
    addDep(watcher) {
        this.watchers.push(watcher)
    }

    notify() {
        this.watchers.forEach(watcher => {
            watcher.update()
        })
    }
}
class Watcher {
    constructor(vm, key, updater) {
        this.vm = vm
        this.key = key
        this.updater = updater

        Dep.target = this
        this.vm[key]
        Dep.target = null
    }

    update() {
        this.updater.call(this.vm, this.vm[this.key])
    }
}
class Compile {
    constructor(vm, el) {
        this.$vm = vm
        this.$el = document.querySelector(el)

        this.compile(this.$el)
    }

    compile(el) {
        const childNodes = el.childNodes

        Array.from(childNodes).forEach(node => {
            if (this.isElement(node)) {
                this.compileElement(node)
            } else if (this.isInter(node)) {
                this.compileText(node)
            }

            this.compile(node)
        })
    }

    isElement(node) {
        return node.nodeType === 1
    }

    isInter(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }

    isDir(attr) { // directive
        return attr.indexOf('k-') === 0
    }

    isEvent(dir) {
        return dir.indexOf('@') == 0
    }

    compileElement(node) {
        const nodeAttrs = node.attributes

        Array.from(nodeAttrs).forEach(attr => {
            const attrName = attr.name
            const exp = attr.value
            if (this.isDir(attrName)) {
                const dir = attrName.substring(2)
                // 执行指令
                this[dir] && this[dir](node, exp)
            }
            // 事件处理
            if (this.isEvent(attrName)) {
                const dir = attrName.substring(1)
                // 事件监听
                this.eventHandler(node, dir, exp)
            }
        })
    }

    compileText(node) {
        this.update(node, RegExp.$1, 'text')
    }

    text(node, exp) {
        this.update(node, exp, 'text')
    }

    textUpdater(node, val) {
        node.textContent = val
    }

    html(node, exp) {
        this.update(node, exp, 'html')
    }

    htmlUpdater(node, val) {
        node.innerHTML = val
    }

    model(node,exp){
        this.update(node,exp,'model')

        // 事件监听
        node.addEventListener('input',e=>{
            this.$vm[exp]=e.target.value
        })
    }

    modelUpdater(node,val){
        node.value=val
    }

    update(node, exp, dir) {
        const fn = this[dir + 'Updater']

        fn && fn(node, this.$vm[exp])

        new Watcher(this.$vm, exp, function (val) {
            fn && fn(node, val)
        })
    }

    eventHandler(node, dir, exp) {
        const fn = this.$vm.$options.methods && this.$vm.$options.methods[exp]
        node.addEventListener(dir, fn.bind(this.$vm))
    }
}

function KVue(options) {
    this.$options = options
    this.$data = options.data
    observe(this.$data)
    proxy(this, '$data')

    new Compile(this, options.el)
}
