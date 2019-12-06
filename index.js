const match = require('structural-match');
const fs = require('fs');
const libpath = require('path');


function parse_name(result, filename, envname){
	if(result && filename){
		//started by a viable js field name, followed by any viable sequence of chars
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
		try{
			// console.log('load', fullpath);
			return require(fullpath);

		} catch(err){
			console.error(err);
		}
	} else if(st.isDirectory()) {
		return walk(fullpath, env, keep_top_level_container, envname);
	} else if(st.isSymbolicLink()){
		return load(fs.readlinkSync(fullpath), env, keep_top_level_container, envname);
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
		const env_specific = tmp[k].filter(v=>env ? v.env[env] : match.is_empty(v.env));
		//  console.log(env_specific, 2);
		if(env_specific.length > 0){
			tmp[k] = env_specific;
		}
		
		tmp[k] = tmp[k].map(v=>load(libpath.resolve(dir,v.file), env, false, envname)).filter(match.not(match.is_undefined));
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
loadenv.module_dir = libpath.basename(__filename).split('.')[0];
loadenv.module = function(file_name, env){
	const module_name = libpath.basename(file_name).split('.')[0];
	const path = libpath.resolve(loadenv.module_dir, module_name);
	return loadenv(path, env ? env : process.env.NODE_ENV);
};
module.exports = loadenv;


