function observe(obj) {
    if (typeof obj !== 'object' || obj == null) {
        return
    }

    new Observe(obj)
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

function proxy(vm, data) {
    Object.keys(vm[data]).forEach(key => {
        Object.defineProperty(vm, key, {
            get() {
                return vm[data][key]
            },
            set(newVal) {
                vm[data][key] = newVal
            }
        })
    })
}
class KVue {
    constructor(options) {
        this.$options = options
        this.$data = options.data

        observe(this.$data)

        proxy(this, '$data')

        new Compile(options.el, this)
    }
}

// 分辨响应式数据是对象还是数组
class Observe {
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
                // 编译元素
                this.compileElement(node)
            } else if (this.isInter(node)) {
                // 编译插值
                this.compileText(node)
            }

            node.childNodes && this.compile(node)
        })

    }

    isElement(node) {
        return node.nodeType === 1
    }

    isInter(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }

    isDir(attr) {
        return attr.indexOf('k-') === 0
    }

    compileElement(node) {
        const nodeAttrs = node.attributes

        Array.from(nodeAttrs).forEach(attr => {
            let attrName = attr.name
            let exp = attr.value

            if (this.isDir(attrName)) {
                let dir = attrName.substring(2)
                this[dir] && this[dir](node, exp)
            }
        })
    }

    compileText(node) {
        this.update(node, RegExp.$1, 'text')
    }

    textUpdater(node, val) {
        node.textContent = val
    }

    update(node, exp, dir) {
        const fn = this[dir + 'Updater']

        fn && fn(node, this.$vm[exp])

        new Watcher(this.$vm, exp, function (val) {
            fn && fn(node, val)
        })
    }

    text(node, exp) {
        this.update(node, exp, 'text')
    }

    html(node, exp) {
        this.update(node, exp, 'html')
    }

    htmlUpdater(node, val) {
        node.innerHTML = val
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
