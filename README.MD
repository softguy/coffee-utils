## Introduction

Coffee-Utils contains utils that help you better convert coffeescripts to javascripts.

It seems that coffeescript compiler (at least at the year of 2013) will strip out single line comments started with #.

Yes, it can keep the block comments ###...###.

However, not everybody prefer coffeescript syntax. Sometimes, one may prefer to use the converted .js file or read the converted .js file, especially for some java/javascript programmers, they may prefer the .js syntax while browsing/using the source code. 

In those cases, lacking of the original source code may be useful,  as people said
from 

https://github.com/jashkenas/coffee-script/issues/2365

"For this reason I'd find it useful to have certain single-line CoffeeScript comments appear as single-line JavaScript comments in the compiled output. Perhaps something like¡­"

"Please add single line comments to the compiled code. Even if you support some limited syntax of it its fully acceptable. Just support some easy common cases, thats it!

I haven't found old discussions about it, so I just tell what I think why its so important: I am at the point to think about to use cs. To ensure my code will not die if cs will die I need to be sure that generated javascript can be used instead. If all the comments gets dropped away, generated js is only half worth of its original, so I think without single line comments I am LOCKED to coffee script"

"Also people who are not familiar with cs reading generated code without single line comments is much harder."

Also it seems that there might be some difficulties in fixing this immediately in the current version of  coffee-script:
"To summarize: We'd love to do it, but we can't figure out how to parse 'em in order to preserve comment behavior, even in theory."
"Sticking comments to the nearest tokens is easy. Propagating those to AST/compilation is the hard part."

So, here is an alternative way which allows one to compile the coffeescript but keep the original single line comments  - anything after # will be replace to // in the output js file.

## Install

    $ npm install coffee-utils
    
## Usage

		node coffee2js.js FILE1.coffee [ FILE2.coffee .... ]
			or
		coffee2js FILE1.coffee [ FILE2.coffee .... ]
		
## How it is implemented

Rather than dig into the original coffee-script compiler, since current coffee-script compiler supports block comments, so I use a clever approach - pre-process the coffee script and replace single line comments into block comments and feed into the coffeescript compiler, then post-process it to generate the final output. Isn't that interesting ?!

## TODO
	More test cases like edge cases or something like /* */ inside String

