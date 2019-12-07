const assert = require('assert');
const plugin = require('../index');
const match = require('structural-match');

describe(`Adapter Testing ${__filename}`, function(){
	it('should load whole directory with default env set', function(){
		const p = plugin('test/test.dir', 'testing');
		assert.ok(match(p,{
			a:'a.testing.json',
			b:'b.testing.js',
			array:{
				a:['a.1.json','a.2.json','a.3.json'],
				b:['b.2.testing.js','b.testing.1.js']
			},
			aa:{
				a:['a.testing.json','a.testing.js'],
				b:['b.testing.js','b.testing.json'],
				c:['c.js','c.json']
			},
			cc:['bb.testing.1.js','bb.testing.2.json','bb.testing.js'],
			bb:'c.json'
		}));
	});
	it('should load whole directory with given env set', function(){
		const p = plugin('test/test.dir', 'testing', 'testing', 'production');
		assert.ok(match(p,{
			a:'a.testing.json',
			b:'b.testing.js',
			array:{
				a:['a.1.json','a.2.json','a.3.json'],
				b:['b.2.testing.js','b.testing.1.js']
			},
			aa:{
				a:['a.testing.json','a.testing.js'],
				b:['b.testing.js','b.testing.json'],
				c:['c.js','c.json']
			},
			cc:['bb.testing.1.js','bb.testing.2.json','bb.testing.js'],
			bb:'c.json'
		}));
	});
	it('should load symbol link', function(){
		const p = plugin('test/test.dir/linkaa', 'testing');
		assert.ok(match(p, {
			a:['a.testing.json','a.testing.js'],
			b:['b.testing.js','b.testing.json'],
			c:['c.js','c.json']
		}));
	});
	it('should throw error on invalid environment name', function(){
		assert.throws(()=>plugin('test/test.dir', 'testing', 'production'));
	});
	it('should load module', function(){
		const p = plugin.module('test/test.dir');
		assert.ok(match(p, match.function));
		const u = p(undefined, 'linkaa.js', 'testing');
		assert.ok(match(u, match.object));
		assert.ok(match(u, p.linkaa));
		assert.ok(match(u, {
			a:['a.testing.json','a.testing.js'],
			b:['b.testing.js','b.testing.json'],
			c:['c.js','c.json']
		}));
		assert.throws(()=>plugin.module());
	});
});


