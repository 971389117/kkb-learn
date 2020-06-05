class KVue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data

        observe(this.$data)
        proxy(this, '$data')

        new Compile(this.$el, this)
    }
}

function observe(obj) {
    if (typeof obj !== 'object' || obj == null) {
        return
    }

    new Observer(obj)
}

function defineReactive(obj, key, val) {
    // 如果val是对象则递归遍历，如果是原始数据类型，观测
    observe(val)

    // 创建Dep实例和key 一一对应
    const dep = new Dep()

    Object.defineProperty(obj, key, {
        get() {
            Dep.target&&dep.addDep()
            return val
        },
        set(neVal) {
            if (newVal !== val) {
                observe(newVal)
                val = newVal
                dep.notify()
            }
        }
    })
}

function proxy(vm, prop) {

}
class Observer {
    /**
     *
     * @param {obj} value
     */
    constructor(value) {
        this.value = value
        this.walk(value)
    }

    walk(obj) {
        Object.keys(obj).forEach(key => {
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
        this.watchers.forEach(w => w.update())
    }
}

// Watcher:和模板中的依赖1对1对应，如果某个key发生变化，则执行更新函数
class Watcher {
    constructor(vm,key,updater) {
        this.vm=vm
        this.key=key
        this.updater=updater

        Dep.target=this
        this.vm[this.key]
        Dep.target=null
    }

    // 由Dep调用
    update(){
        this.updater.call(this.vm,this.vm[this.key])
    }
}

class Compile {
    constructor(el, vm) {
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

            if (node.childNodes) {
                this.compile(node)
            }
        })
    }

    isElement(node) {
        return node.nodeType === 1
    }

    isInter(node) {
        return node.nodeType === 3 && /\{\{.*\}\}/.test(node.textContent)
    }

    isDir(attr) {

    }

    update(node, exp, dir) {
        const fn = this[dir + 'updater']
        fn && fn(node, this.$vm[exp])

        new Watcher(this.$vm, exp, function (val) {
            fn && fn(node, val)
        })
    }

    textUpdater() {
        node.textContent = val
    }

    htmlUpdater() {

    }

    compileText(node) {
        this.update(node, RegExp.$1, 'text')
    }

    compileElement(node) {

    }

    text(node, exp) {

    }

    html(node, exp) {

    }
}
