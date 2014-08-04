---
layout: post
title:  "Under the Hood: What is an AST?"
date:   2014-08-04 13:00:00
categories: [ast, esprima]
---

*This is the first post in a series about the concepts and tools used by esnext.*

When you write a JavaScript program you are writing plaintext. [esnext][esnext] is able to take plaintext JavaScript written using newer syntax, such as classes, and turn it into different plaintext JavaScript that uses current syntax. However, esnext does not operate directly on plaintext. This post will answer the question of what format esnext uses internally to do what it does.

### An Outline

As you may have guessed from the title of this post, I'll be talking about ASTs, or abstract syntax trees. But what, exactly, is a syntax tree? Think of it as a full representation of your program in outline form. An example will help illustrate this idea.

{% highlight javascript %}

var a = [1, 'n'];

{% endhighlight %}

Conceptually, this is a variable declaration statement that has one variable with a name and an initial value, an array with multiple literal values. So our outline must look something like this:

{% highlight text %}

Program
  statements=
  - Variable
      name=Identifier "a"
      value=
        Array
        - Literal 1
        - Literal "n"

{% endhighlight %}

One important property of our syntax tree is that it should allow us to write, by hand if necessary, a JavaScript program equivalent to the one we started with. So far our outline strategy seems to work reasonably well for basic data and variables, but can we actually model whole programs like this? Control flow, loops, functions, etc? Consider the following function.

{% highlight javascript %}

function fib(n) {
  if (n < 2) {
    return 1;
  } else {
    return fib(n - 2) + fib(n - 1);
  }
}

{% endhighlight %}

We have a function declaration, an `if` statement, an inequality, function calls, several binary operators, and return statements. Think about how you might represent this in the outline form shown above. Remember that an outline, like a tree, represents a hierarchy. Earlier I said that a good outline/syntax tree should allow us to recreate an equivalent JavaScript program. Make sure that every detail of the *semantics* of the function are preserved, even if the exact syntax (whitespace, semi-colons, parentheses, etc) are not.

### Abstract Syntax Tree

Now that you understand how to re-write your code as an outline, imagine converting your outline to a data structure that can be read, written, manipulated, etc. What would that look like? Since this is JavaScript, let's use POJOs in memory and JSON for serializing. Here's our first outline written in this form:

{% highlight javascript %}

{
  "type": "Program",
  "statements": [
    {
      "type": "Variable",
      "name": {
        "type": "Identifier",
        "name": "a"
      },
      "value": {
        "type": "Array",
        "values": [
          {
            "type": "Literal",
            "value": 1
          },
          {
            "type": "Literal",
            "value": "n"
          }
        ]
      }
    }
  ]
}

{% endhighlight %}

Whoa! That's pretty big for such a small initial program, but you can see that all the key information is there and it would allow us to do some pretty interesting things, like determine how many primitive `Literal` values are in a program. Neat!

### Esprima & the Mozilla AST

The JSON shown above is not really something we'd expect humans to write. Turning a JavaScript program into this form is a job for a parser, and fortunately JavaScript has quite a few good ones, including [Esprima][esprima], which itself is written in JavaScript.

Here's how you parse the first program into an AST with Esprima:

{% highlight javascript %}

esprima.parse("var a = [1, 'n'];");

{% endhighlight %}

And here's the resulting AST:

{% highlight javascript %}

{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "a"
          },
          "init": {
            "type": "ArrayExpression",
            "elements": [
              {
                "type": "Literal",
                "value": 1,
                "raw": "1"
              },
              {
                "type": "Literal",
                "value": "n",
                "raw": "'n'"
              }
            ]
          }
        }
      ],
      "kind": "var"
    }
  ]
};

{% endhighlight %}

That looks remarkably like the JSON version of the outline we created! Some of the names are a little different, but the structure is nearly the same. Also, there's more information in this version, presumably there to cover syntax or use cases we haven't thought of yet.

This format was established by Mozilla and more information can be found at their [Parser API][parser-api] page. To try this out yourself, open your browser console for this page and try `esprima.parse("var a = [1, 'n'];")`. What do you get when you parse the `fib` function above? Was it what you expected?

### Doing Something with an AST

Let's see if we can figure out how to solve the problem posed earlier for counting the number of literals used in a program. First we'll need to figure out how to visit all the *nodes* in some given AST. The AST itself is just an object and has no traversal behavior built-in, so we'll need to write our own. Once we have that we need to count how many times we've seen a node whose type is "Literal". We can accomplish that with this:

{% highlight javascript %}

function literalCount(ast) {
  var count = 0;

  visit(ast, function(node) {
    // Called once for every node in the AST.
    if (node.type === 'Literal') {
      count++;
    }
  });

  return count;
}

var ast = esprima.parse("var a = [1, 'n'];");
literalCount(ast); // 2

{% endhighlight %}

That's not too bad. But what does `visit` look like? That's left as an [exercise for the reader][visit-exercise]. What else can you do with the `visit` function once you have it? What would it take to write an interpreter for some subset of JavaScript, like variables and basic math? The next post in this series will cover the tools esnext uses to process the AST once it's been parsed.

[esnext]: https://github.com/esnext/esnext
[esprima]: https://github.com/ariya/esprima.git
[parser-api]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
[visit-exercise]: http://jsbin.com/yimapo/1/edit?js,output

<script type="text/javascript" defer src="/js/esprima.js"></script>
