//Object.defineProperty()
function observe(obj){
    if(typeof obj!=='object' || obj==null){
        return
    }
    Object.keys(obj).forEach(key=>{
        defineReactive(obj,key,obj[key]);
    })
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
function set(obj,key,val){
    defineReactive(obj,key,val);
}
const obj = {foo:"foo",bar:'bar',baz:{a:1}}
observe(obj);
// defineReactive(obj,'foo','foo')
obj.foo
// obj.foo = 'fooooooo';
// obj.foo

// obj.bar
// obj.bar='barrrrrr'
// obj.bar
// obj.baz.a=10
// obj.baz.a

// obj.baz={a:10}
// obj.baz.a

set(obj,'dong','dong')
obj.dong

//push pop shift unshift splice split 
