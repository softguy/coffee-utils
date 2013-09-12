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
		//debug(linenum+"\t"+line);

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
			//fs.writeFile(outfile+".tmp2.js", dst);			
			
			//Now, one problem is that there is two more empty lines after each /** **/
			//var lines=dst.split('\r');	//Not working?
			//var lines = dst.match(/^.*([\n\r]+|$)/gm);
			var lines = dst.split(/\r\n|\r|\n/g);
			
			debug("lines.length="+lines.length);
			var dst2='';
			for (var i = 0; i < lines.length; i++){
				line=lines[i];
				//debug('line='+line);
				var x=line.indexOf('/*');
				var y=line.indexOf('*/');
				//debug('x='+x+',y='+y);
				if (x>=0 && y>0){
					debug('single line comments at:'+i);
					line = line.replace('/*', '//');
					debug('****line='+line);
					line =line.replace('*/', '');
					dst2 += line;
					dst2 += os.EOL;
						
					//skip the next 2 empty lines
					line = lines[++i];
					line = line.trim();
					if (line.length==0){
						line = lines[++i];
						line = line.trim();
						if (line.length==0){
							continue;
						}
					}
					continue;
				}
				dst2 += line;
				dst2 += os.EOL;
			}
			fs.writeFile(outfile, dst2);
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
