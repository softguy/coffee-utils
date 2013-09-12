var debug=require('debug')('coffee2jskeepcomments')
	,fs=require('fs')
	//,carrier = require('carrier')
	,cs=require('coffee-script')
	,os=require('os')
;

var path = require('path');  
var lineReader = require('line-reader');

/*
process.stdin.resume();
carrier.carry(process.stdin, function(line) {
    console.log('got one line: ' + line);
});
*/

function help(){
	console.log('Usage: xxx file1.coffee file2.coffee');
}

function compilefile(p){

	var inblockcmts=false;
	
	var outfile=path.dirname(p)+path.sep+path.basename(p,path.extname(p))+ '.js';
	debug('outfile='+ outfile);
	//var fout=fs.createWriteStream(p);
	var src='';
	
	var linenum=0;
	
	lineReader.eachLine(p, function(line, last) {
		linenum ++;
		console.log(linenum+"\t"+line);

		//block comment always start from 0?
		var i=line.indexOf('###');
		if (i>=0){
			inblockcmts = !inblockcmts;
			debug('in comments, linenum='+linenum+',inblockcmts='+inblockcmts);
			if (i===0){
				i=line.indexOf('###', 3);	//oneline block comments
				if (i>0){
					inblockcmts = !inblockcmts;
					debug('oneline block comments, linenum='+linenum+',inblockcmts='+inblockcmts);
				}
			}
		} else
		if (!inblockcmts && line.indexOf('#') ===0 ){
			debug('singleline comments, linenum='+linenum+',inblockcmts='+inblockcmts);
			//oneline comments
			line = line.replace('#', ' ');
			line = '###' + line + '###';
		}
		src += line;
		src += os.EOL;
				
		if(last){
			// or check if it's the last one
			//for debugging purpose
			//fs.writeFile(p+'.tmp.coffee', src);
			
			var dst='';
			try {
				dst=cs.compile(src);
			} catch (e){
				console.log(e);
			}
			//debug('dst=' + dst);
			fs.writeFile(outfile, dst);
		}
	});
}

function main(){
	// print process.argv
	//console.log(process.argv.length);
	if (process.argv.length <=2){
		help();
		return;
	}

	process.argv.slice(2).forEach(function (val, index, array) {
		console.log('Compiling:'+ index + ': ' + val);
		compilefile(val);
	});
}

main();
