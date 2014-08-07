---
layout: post
title:  "Under the Hood: Libraries"
date:   2014-08-07 08:50:00
categories: [libraries, esprima, recast]
---

*This is the second post in a series about the concepts and tools used by esnext.*

In the [last "Under the Hood" post][what-is-an-ast] we answered the question "What is an AST?". This post will discuss the libraries used by [esnext][esnext] and what role each plays in transpilation.

### Pipeline

There are three major stages of the transpilation pipeline:

1. Parse *(Esprima, JS &rarr; AST)*
1. Transform *(es6-\*, AST<sub>ES6</sub> &rarr; AST<sub>ES5</sub>)*
1. Print *(Recast, AST &rarr; JS)*

We'll use the following JavaScript code as an example throughout this post:

{% highlight javascript %}

[1, 2].map(x => x * 2);

{% endhighlight %}

### Parse

We introduced [Esprima][esprima] in ["What is an AST?"][what-is-an-ast]. It handles the first part of the transpilation process: parsing JavaScript source code into a data structure we can easily manipulate, an AST. We must use the [harmony branch of Esprima][esprima-harmony], which understands ES6 syntax. Our example JavaScript code is parsed into the following AST:

{% highlight javascript %}

{
  "type": "Program",
  "body": [
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "CallExpression",
        "callee": {
          "type": "MemberExpression",
          "computed": false,
          "object": {
            "type": "ArrayExpression",
            "elements": [
              {
                "type": "Literal",
                "value": 1,
                "raw": "1"
              },
              {
                "type": "Literal",
                "value": 2,
                "raw": "2"
              }
            ]
          },
          "property": {
            "type": "Identifier",
            "name": "map"
          }
        },
        "arguments": [
          {
            "type": "ArrowFunctionExpression",
            "id": null,
            "params": [
              {
                "type": "Identifier",
                "name": "x"
              }
            ],
            "defaults": [],
            "body": {
              "type": "BinaryExpression",
              "operator": "*",
              "left": {
                "type": "Identifier",
                "name": "x"
              },
              "right": {
                "type": "Literal",
                "value": 2,
                "raw": "2"
              }
            },
            "rest": null,
            "generator": false,
            "expression": true
          }
        ]
      }
    }
  ]
}

{% endhighlight %}

### Transform

At the time of writing, ES6 is the upcoming version of JavaScript that esnext transpiles. As discussed in the [introductory post][introducing-esnext], esnext is built on a collection of transpilers, each focused on one particular syntax. Most of these are named starting with `es6-`, such as [es6-arrow-function][es6-arrow-function], which is the one we'd use to process our example code's AST.

The AST above really only has one AST node that is ES6-only: `ArrowFunctionExpression`. We need something like our `visit` from "What is an AST?" so we can alter the nodes that need to be modified. In this case we know we need to turn `x => x * 2` into the closest ES5 equivalent we can get: `function(x) { return x * 2; }`. Let's look at the AST for that to compare:

{% highlight javascript %}

 {
  "type": "FunctionExpression",
  "id": null,
  "params": [
    {
      "type": "Identifier",
      "name": "x"
    }
  ],
  "defaults": [],
  "body": {
    "type": "BlockStatement",
    "body": [
      {
        "type": "ReturnStatement",
        "argument": {
          "type": "BinaryExpression",
          "operator": "*",
          "left": {
            "type": "Identifier",
            "name": "x"
          },
          "right": {
            "type": "Literal",
            "value": 2,
            "raw": "2"
          }
        }
      }
    ]
  },
  "rest": null,
  "generator": false,
  "expression": false
}

{% endhighlight %}

So the difference is that one is an `ArrowFunctionExpression`, the other a regular `FunctionExpression`, the latter having a `BlockStatement` body and explicit `return`. Assuming we have the `visit` function from "What is an AST?", let's see if we can make this transform work as expected.

{% highlight javascript %}

visit(ast, function(node) {
  if (node.type === 'ArrowFunctionExpression') {
    // First, change the type.
    node.type = 'FunctionExpression';

    // Then, set up the return.
    var returnStatement = {
      type: 'ReturnStatement',
      argument: node.body // i.e. return the BinaryExpression
    };

    // Finally, set up a block statement for the function body.
    node.body = {
      type: 'BlockStatement',
      body: [returnStatement]
    };
  }
});

{% endhighlight %}

This seems right, and we could test it by pretty-printing `ast` as we did before and comparing it. Let's face it, though, ASTs are hard to read. What if we simply generated JavaScript from the AST and compared it to what we expect?

### Print

The library esnext uses to print ASTs as JavaScript is called [recast][recast]. The basic API provided by recast is simple: `parse` takes JavaScript source and delegates to Esprima, doing some post-processing before returning the AST; `print` takes the AST you got, altered by your transforms, and generates JavaScript. The cool part of recast is that it preserves as much of the original formatting as possible. It does this using a feature of Esprima where it can provide location information (e.g. line & column) for each node in the AST, plus some of recast's own special sauce. Let's see what we get running `ast` through recast's `print` function.

{% highlight javascript %}

[1, 2].map(function(x) {
    return x * 2;
});

{% endhighlight %}

Awesome! That's just what we expected. The actual result from `print` is an object with a `code` property containing the generated JavaScript source. If you pass `print` the right options, it will also contain a `map` property with a [source map][source-map] from the original ES6 JavaScript to the generated ES5 JavaScript. This can be useful in debugging as it will let you trace errors back to the original source code.

### Further Reading

Our transform code worked fine on the example we gave at the start of this post, but it will not work for all arrow functions. For example, here's one that already has a block statement body: `x => { console.log(x) }`. In that case there is no implicit return. Can you modify our transform to work with that case?

Here's an even trickier one. Aside from being shorter, one of the main benefits of using arrow functions is that `this` is the same as the lexical parent. This is unlike regular functions where `this` is determined by how the function is invoked. If we modified our example to the following, how would you make that work?

{% highlight javascript %}

this.factor = 2;
[1, 2].map(x => x * this.factor);

{% endhighlight %}

We can't simply transform the function to `function(x) { return x * this.factor; }`. The usual way to solve this problem in non-ES6 JavaScript is to either explicitly bind the function or introduce a local variable to store `this`, usually called `self` or `that`:

{% highlight javascript %}

// These are equivalent in this case:

this.factor = 2;
[1, 2].map(function(x) { return x * this.factor; }.bind(this));

this.factor = 2;
var self = this;
[1, 2].map(function(x) { return x * self.factor; });

{% endhighlight %}

#### Hygiene

What if `self` had already been declared in this scope? We probably would have created a bug! In this case it seems safer to use `bind`, but there are cases in other transforms where we must create local variables. The question is, how do we do so safely? For this, [ast-util][ast-util] has us covered. In this particular case we can use [`injectShared`][injectshared], but this is the subject for another blog post.


#### "Type" Safety

Our transform above is just manipulating plain JavaScript objects without any guarantees that the changes we're making result in a valid AST. What if we typo one of the keys in an object, or the type of a node? We won't know until later, perhaps much later. Fortunately, recast exposes the [ast-types][ast-types] library as `types` and provides a visitor function so we don't have to rely on our (possibly broken) one. This allows us to re-write our transform like so:

{% highlight javascript %}

var b = recast.types.builders;
recast.visit(ast, {
  visitArrowFunctionExpression: function(/* NodePath */path) {
    var node = path.node;

    // First, change the type.
    node.type = 'FunctionExpression';

    // Then, set up the return.
    var returnStatement = b.returnStatement(node.body);

    // Finally, set up a block statement for the function body.
    node.body = b.blockStatement([returnStatement]);
  }
});

{% endhighlight %}

In addition to being shorter, this version will complain immediately if we typo something or try to do something nonsensical, like returning a `var` declaration from a function. ast-types understands all the node types and their relationships, so anything you generate using it is probably a valid AST.

#### Next Time

In the next "Under the Hood" post we'll cover hygiene in more depth: what it is, why it's important, and how ast-util helps to maintain it.

[ast-types]: https://github.com/benjamn/ast-types
[ast-util]: https://github.com/eventualbuddha/ast-util
[esnext]: https://github.com/esnext/esnext
[esprima]: https://github.com/ariya/esprima
[esprima-harmony]: https://github.com/ariya/esprima/tree/harmony
[es6-arrow-function]: https://github.com/esnext/es6-arrow-function
[injectshared]: https://github.com/eventualbuddha/ast-util#user-content-uniqueIdentifier
[introducing-esnext]: {% post_url 2014-08-01-introducing-esnext %}
[recast]: https://github.com/benjamn/recast
[source-map]: http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/
[what-is-an-ast]: {% post_url 2014-08-04-under-the-hood-what-is-an-ast %}
