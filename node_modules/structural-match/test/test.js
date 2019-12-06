const match = require('../index');
const assert = require('assert');

describe('Adapter Testing match.js', function(){
	it('should work on primitive vs. primitive', function(){
		assert.ok(!match(1,2));
        assert.ok(match(1,1));
        assert.ok(match(null,match.null));
        assert.ok(!match(undefined,match.null));
        assert.ok(!match({},match.null));
        assert.ok(match(1,match.number));
        assert.ok(match(1,'1'));
		assert.ok(!match(1,'1',true));
		assert.ok(match('a','a'));
		assert.ok(!match('a', 'b'));
        assert.ok(match());
        assert.ok(match(undefined, match.undefined));
		assert.ok(!match(undefined, 1));
		assert.ok(!match(undefined, 'a'));
        assert.ok(match(true, true));
        assert.ok(match(true, match.boolean));
        assert.ok(match(false, match.boolean));
        assert.ok(!match(undefined, match.boolean));
		assert.ok(!match(true, false));
	});
	it('should work on object vs. primitive', function(){
		assert.ok(!match(null, 1));
		assert.ok(!match(null, 'a'));
		assert.ok(!match(null, true));
		assert.ok(!match({}, 1));
		assert.ok(!match({}, 'a'));
		assert.ok(!match({}, true));
	});
	it('should work on array vs. primitive', function(){
		assert.ok(!match([], 1));
		assert.ok(!match([], 'a'));
		assert.ok(!match([], true));
	});

	it('should work on regexp', function(){
		assert.ok(match('POST',/GET|POST|PUT|DELETE|OPTIONS|PATCH|HEAD|TRACE|CONNECT/i));
		assert.ok(match('abc', /[abc]+/));
		assert.ok(!match('abc', /[0-9]+/));
        assert.ok(match(/abc/, /abc/));
        assert.ok(match(/abc/, '/abc/'));
        assert.ok(!match(/abc/, '/ab/'));
        assert.ok(!match(/ac/, /abc/));
        assert.ok(!match({}, /abc/));
        assert.ok(!match([], /abc/));
        assert.ok(!match(1, /abc/));
    });
    it('should work on instanceof', function(){
		function Test(){}
		function Test2(){}
		assert.ok(match(new Test(), match.instanceof(Test)));
		assert.ok(match(new Test(), match.instanceof(Test2, Test)));
    });
    it('should work on empty', function(){
        assert.ok(match(123, match.yes));
        assert.ok(match('123', match.yes));
        assert.ok(match(undefined, match.yes));
        assert.ok(match(true, match.yes));
        assert.ok(match({}, match.yes));
        assert.ok(match([], match.yes));
        assert.ok(!match(123, match.no));
        assert.ok(!match('123', match.no));
        assert.ok(!match(undefined, match.no));
        assert.ok(!match(true, match.no));
        assert.ok(!match({}, match.no));
        assert.ok(!match([], match.no));

        assert.ok(!match(123, match.empty));
        assert.ok(!match('123', match.empty));
        assert.ok(!match(undefined, match.empty));
        assert.ok(!match(true, match.empty));
        assert.ok(!match({a:1}, match.empty));
        assert.ok(!match([1], match.empty));
        assert.ok(match({}, match.empty));
        assert.ok(match([], match.empty));
        
    });
    it('should work on composed predicate', function(){
        assert.ok(match(1,match.not({})));
		assert.ok(match(1,match.or({},1)));
		assert.ok(match(2.0,match.not({})));
        assert.ok(match(undefined,match.optional({})));
        assert.ok(match({},match.optional({})));
        assert.ok(match('a',match.and(match.string, 'a')));
    });
	it('should work on primitive vs. object', function(){
		assert.ok(!match(1,{}));
		assert.ok(!match(2.0,{}));
		assert.ok(!match(true,{}));
		assert.ok(!match('a',{}));
	});
	it('should work on object vs. object', function(){
		assert.ok(match({},{}));
		assert.ok(match(null,null));
		assert.ok(!match(null,{}));
		assert.ok(!match({},null));
		assert.ok(match({a:1},{a:1}));
		assert.ok(match({a:1},{}));
		assert.ok(match({a:1, b:2},{a:1}));
		assert.ok(!match({a:1},{b:1}));
		assert.ok(!match({a:1},{a:1,b:1}));
		assert.ok(!match({a:1},{a:2}));
	});
	it('should work on array vs. object', function(){
		assert.ok(!match([],{}));
		assert.ok(!match([],null));
	});

	it('should work on primitive vs. array', function(){
		assert.ok(!match(1,[]));
		assert.ok(!match(2.0,[]));
		assert.ok(!match(true,[]));
		assert.ok(!match('a',[]));
	});
	it('should work on object vs. array', function(){
		assert.ok(!match({},[]));
		assert.ok(!match(null,[]));
	});
	it('should work on array vs. array', function(){
		assert.ok(match([],[]));
		assert.ok(match([1,2,3],[1,2,3]));
		assert.ok(match([1,2,3],[1,2,3,4]));
		assert.ok(!match([1,2,3],[1,2]));
		assert.ok(match([1,2,3],[()=>true]));
		assert.ok(match([{},2,'a'],[2,'a',{}]));
		assert.ok(!match([{},2,'a'],[2,{}]));
		assert.ok(match([{},2,'a'],[]));
	});
	it('should work on optional predicates', function(){
		assert.ok(match([],[]));
		assert.ok(match([],match.is_array));
		assert.ok(!match(undefined,match.is_array));
		assert.ok(!match(undefined,[]));
		assert.ok(match(undefined,match.optional(match.is_array)));
		assert.ok(match(undefined,match.optional([])));
	});
	it('should work on any and none predicates', function(){
		assert.ok(match([], match.any([], {}, 1, 2)));
		assert.ok(!match([],match.none([], {})));
		assert.ok(match([], match.all(x=>typeof x=='object', match.is_array)));
	});

	it('should work on complex object', function(){
		const obj = [{
			a:[
				{
					a:[1,2,{
						a:1,
						b:'hello',
						c:/abc/
					}],
					b:2
				},
				'element'
			],
			b:1,
			c:'c'
		}, 'hello', 1, true];
		assert.ok(match(obj,[{
			a:['element',{
				a:[1,2,{
					a:1,
					b:/^h.+o$/,
					c:/abc/
				}]
			}]
		},'hello', true, 1]));
		assert.ok(!match(obj,[{
			a:['element',{
				a:[1,2,{
					a:1,
					b:/abc/
				}]
			}]
		},'hello', true, 1]));
	});

	it('should work on anything vs. function', function(){
		assert.ok(!match([], ()=>false));
		assert.ok(!match({}, ()=>false));
		assert.ok(!match(1, ()=>false));
		assert.ok(!match('a', ()=>false));
		assert.ok(!match(true, ()=>false));
		assert.ok(match([], ()=>true));
		assert.ok(match({}, ()=>true));
		assert.ok(match(1, ()=>true));
		assert.ok(match('a', ()=>true));
		assert.ok(match(true, ()=>true));
	});
	it('should work on function vs. anything', function(){
		assert.ok(!match(()=>{}, ()=>{}));
		assert.ok(match(()=>{}, ()=>1));
		assert.ok(!match(()=>{}, ()=>false));
		assert.ok(!match(()=>{}, 1));
		assert.ok(!match(()=>{}, 'a'));
		assert.ok(!match(()=>{}, true));
		assert.ok(!match(()=>{}, {}));
		assert.ok(!match(()=>{}, []));
	});
	it('should pass additional arguments through', function(){
		assert.ok(match({
			name: 'submitOrder',
			request: {
				method: 'POST',
				header: [{
					key: 'Accept',
					value: 'application/json'
				},{
					key: 'Content-Type',
					value: 'application/json'
				}],
				url: {
					protocol: 'http',
					host: ['oc', 'zkungfu','com'],
					port: '9080',
					path: ['gfsoc','api','submitOrder.html'],
					query: [{
						key: 'access_token',
						value: 'Ee79air1187V48516wPd9ppjJ41FLIYMQzWXettK3X19U36PoEpZu7D8d59Uk83j'
					}]
				}
			}
		}, (x, ...rest)=>rest[0], true));
        assert.ok(!match({
			name: 'submitOrder',
			request: {
				method: 'POST',
				header: [{
					key: 'Accept',
					value: 'application/json'
				},{
					key: 'Content-Type',
					value: 'application/json'
				}],
				url: {
					protocol: 'http',
					host: ['oc', 'zkungfu','com'],
					port: '9080',
					path: ['gfsoc','api','submitOrder.html'],
					query: [{
						key: 'access_token',
						value: 'Ee79air1187V48516wPd9ppjJ41FLIYMQzWXettK3X19U36PoEpZu7D8d59Uk83j'
					}]
				}
			}
		}, (x, ...rest)=>rest[0], false));
	});
	it('should work on postman configuration', function(){
		assert.ok(match({
			name: 'submitOrder',
			request: {
				method: 'POST',
				header: [{
					key: 'Accept',
					value: 'application/json'
				},{
					key: 'Content-Type',
					value: 'application/json'
				}],
				url: {
					protocol: 'http',
					host: ['oc', 'zkungfu','com'],
					port: '9080',
					path: ['gfsoc','api','submitOrder.html'],
					query: [{
						key: 'access_token',
						value: 'Ee79air1187V48516wPd9ppjJ41FLIYMQzWXettK3X19U36PoEpZu7D8d59Uk83j'
					}]
				}
			}
		}, {
			name: match.is_string,
			request: {
				method: /GET|POST|PUT|DELETE|OPTIONS|PATCH|HEAD|TRACE|CONNECT/i,
				header: [{
					key: match.is_string,
					value: match.is_string
				}],
				url: {
					raw: match.optional(match.is_string),
					protocol: match.is_string,
					host: [match.is_string],
					port: match.optional(match.is_string),
					path: [match.is_string],
					query: [{
						key: match.is_string,
						value: match.is_string
					}]
				}
			}
		}));
	});
    
});

