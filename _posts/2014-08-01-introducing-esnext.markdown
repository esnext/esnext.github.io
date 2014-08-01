---
layout: post
title:  "Introducing esnext"
date:   2014-08-01 15:14:05
---

### A History

Since JavaScript was first introduced in 1995 it has slowly evolved from basically a toy to what it is today: a language to take seriously and do serious work with. It took some time to get here. For a long time JavaScript progressed little bit by little bit. But in recent years that pace has begun to pick up as new features -- features people have been asking for forever, like "real" classes -- started to really be considered for inclusion in the next version of JavaScript, ES6<sup><a href="#footnote-1">1</a></sup>.

Of course, by that time people had started "transpiling" existing languages<sup><a href="#footnote-2">2</a></sup>, or even entirely new languages such as [CoffeeScript][coffeescript], into JavaScript. The process of transpiling is similar to compiling but, instead of taking source code for a language and turning it into machine code (or byte code, as in Java), the source code is converted into source code for another language. It makes sense that JavaScript would be a popular target for such transpiling techniques because, as the saying goes, you can run any language you want in the browser as long as it's JavaScript.

### Moving the Language Forward

Transpiling can give us more than the ability to run other languages in a JavaScript runtime. It gives us the ability to experiment with new JavaScript language features that are not yet implemented as long as we can find a way to represent the behavior using the language features that exist today. This is what esnext is for<sup><a href="#footnote-3">3</a></sup>.

Developers should be able to try out the proposed features in upcoming versions of JavaScript in their own applications, libraries, etc. Once there is real-world usage we will better understand how the features *should* work before they are set in stone, allowing us to in a real sense help shape the language that we use every day.

### Open Source & Modular

esnext is built in the open [on GitHub][esnext]. It is, in reality, simply a shell that combines many individual projects each meant to transpile a certain aspect of the upcoming ES6 feature set (and, eventually, ES7 and beyond). These individual parts tend to be small and focus on one new syntax, such as [es6-arrow-function][es6-arrow-function]. Quite a few are maintained under the [esnext organization][esnext-org] on GitHub, but a growing number are not. If you'd like to contribute to the project please see the [README][esnext] for our TODO, or submit a Pull Request for a syntax not listed. We use [Esprima][esprima]'s harmony branch to parse ES6 syntax, so anything it knows how to parse is potentially something we can transpile.

### The Future

As features are added and new versions are released we will post updates here. From time to time we will also post related news or generally interesting information related to the project (such as an upcoming series on how esnext works). We hope you'll get involved by [fixing a bug][esnext-issues], adding a new syntax, or just coming and saying hi in the #esnext IRC channel on Freenode. Thanks for helping us shape the future of JavaScript!

<p class="footnotes">
  <sup><a name="footnote-1">1</a></sup>
  ECMAScript 6, ECMAScript being the standardization of JavaScript.
  <br>

  <sup><a name="footnote-2">2</a></sup>
  See <a href="http://int3.github.io/doppio/about.html">Doppio</a>, a JVM in CoffeeScript, <a href="http://opalrb.org/">Opal</a>, a Ruby transpiler, and <a href="https://github.com/jashkenas/coffeescript/wiki/List-of-languages-that-compile-to-JS">others</a>.
  <br>

  <sup><a name="footnote-3">3</a></sup>
  For other projects with a similar aim, see <a href="http://google.github.io/traceur-compiler/">Google's Traceur</a> & <a href="http://sweetjs.org/">Mozilla's Sweet.js</a>.
  <br>
</p>

[coffeescript]: http://coffeescript.org/
[es6-arrow-function]: https://github.com/esnext/es6-arrow-function
[esnext]: https://github.com/esnext/esnext
[esnext-issues]: https://github.com/esnext/esnext/issues
[esnext-org]: https://github.com/esnext
[esprima]: https://github.com/ariya/esprima
