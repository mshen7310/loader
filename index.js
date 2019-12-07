const match = require('structural-match');
const fs = require('fs');
const libpath = require('path');


function parse_name(result, filename, envname){
	if(result && filename){
		//started by a js viable/field name, followed by any viable sequence of chars
		const m = filename.match(/^([a-z_$][a-z0-9_$]*)(.*)$/i);
		if(m){
			const ret = {
				base:m[1],
			};
			//search env name
			const ext = m[2].split('.');
			ret.env = ext.filter(x=>envname[x]).reduce((a,c)=>{
				a[c] = true;
				return a;
			}, {});
			ret.file = filename;
			if(!result.hasOwnProperty(ret.base)){
				result[ret.base] = [];
			}
			result[ret.base].push(ret);	
		}
	}
}
function load(fullpath, env, keep_top_level_container, envname){
	const st = fs.lstatSync(fullpath);
	if(st.isFile()){
		return require(fullpath);
	} else if(st.isDirectory()) {
		return walk(fullpath, env, keep_top_level_container, envname);
	} else if(st.isSymbolicLink()){
		let p = fs.readlinkSync(fullpath);
		if(!libpath.isAbsolute(p)){
			p = libpath.resolve(libpath.dirname(fullpath), p);
		}
		return load(p, env, keep_top_level_container, envname);
	}
}
function walk(dir, env, keep_top_level_container, envname){
	const tmp = {};
	for(let f of fs.readdirSync(dir)){
		//deduct filename into base name and env name
		parse_name(tmp, f, envname);
	}
	Object.keys(tmp).forEach(k=>{
		// console.log(tmp[k], 1);
		const env_specific = tmp[k].filter(v=>env ? v.env[env] : match.empty(v.env));
		//  console.log(env_specific, 2);
		if(env_specific.length > 0){
			tmp[k] = env_specific;
		}
		
		tmp[k] = tmp[k].map(v=>load(libpath.resolve(dir,v.file), env, false, envname)).filter(match.not(match.undefined));
		if(tmp[k].length == 1){
//			console.log('reduce single element array to object', k);
			tmp[k] = tmp[k][0];
		}
		if(tmp[k].length == 0){
			// console.log('delete empty slot', k);
			delete tmp[k];
		}
	});
	if(keep_top_level_container){
		// console.log('keep single field object');
		return tmp;
	} else {
		const ks = Object.keys(tmp);
		return ks.length == 1 ? tmp[ks[0]] : tmp;	
	}
}
function loadenv(fullpath, env, ...envname){
	if(envname.length == 0){
		envname = ['production', 'staging', 'testing'];
	} else {
		envname.sort();
	}
	envname = envname.reduce((a,c)=>{
		a[c] = true;
		return a;
	}, {});
	if(!envname[env]){
		throw Error(`${env} is not a valid environment type, possible values are ${Object.keys(envname)}`);
	}
	return load(fullpath, env, loadenv.keep_top_level_container, envname);
}
loadenv.keep_top_level_container = true;

loadenv.module = function (module_dir){
	if(module_dir){
		return function ret(loadfn, file_name, env, ...envname){
			const module_name = libpath.basename(file_name).split('.')[0];
			const path = libpath.resolve(module_dir, module_name);
			const entries = loadenv(path, env ? env : process.env.NODE_ENV, ...envname);
			if(typeof loadfn != 'function'){
				loadfn = a=>a;
			}
			Object.keys(entries).forEach(k=>{
				ret[k] = loadfn(entries[k]);
			});    
			return ret;
		};
	} else {
		throw Error(`Invalid 'module_dir(${module_dir})'`);
	}
};
module.exports = loadenv;


