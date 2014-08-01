---
layout: post
title:  "What is an AST?"
date:   2014-07-31 16:40:05
categories: [ast, esprima]
---

*This is the first post in a series about the concepts and tools used by esnext.*

When you write a JavaScript program you are writing plain text. esnext is able to take plaintext JavaScript writen using newer syntax, such as classes, and turn it into different plaintext JavaScript that uses current syntax. However, esnext does not operate directly on plain text. This post will answer the question of what format esnext uses internally to do what it does.

### An Outline

As you may have guessed from the title of this post, I'll be talking about syntax trees. But what, exactly, is a syntax tree? Think of it as a full representation of your program in outline form. An example will help illustrate this idea.

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

One important property of our syntax tree is that it should allow us to write, by hand if necessary, a JavaScript program equivalent to the one we started with. So far our outline strategy seems to work reasonably well for basic data and variables, but can we actually model whole programs like this? Control flow, loops, functions, etc? Let's try it!

{% highlight javascript %}

function fib(n) {
  if (n < 2) {
    return 1;
  } else {
    return fib(n - 2) + fib(n - 1);
  }
}

{% endhighlight %}

This looks interesting. We have a function, an `if` statement, an inequality, function calls, several binary operators, and return statements. Let's start with a top-level `Program` like we had before, and again we only have one statement:

{% highlight text %}

Program
  statements=
  - Function
      name=Identifier "fib"
      arguments=
      - Identifier "n"
      body=…

{% endhighlight %}

That function was pretty clear -- we only had to deal with a name and one argument. But what about the body of the function? Let's take each level one step at a time. It seems pretty clear that a function body, like the top level program, is just a series of statements. In this case we again have only a single statement, an `if` statement:

{% highlight text %}

body=
- If
    condition=…
    consequent=…
    alternate=…

{% endhighlight %}

Now what do we do with the properties of the `if` statement? Again, let's just look one level down.

{% highlight text %}

If
  condition=
    Operator
      op="+"
      left=Identifier "n"
      right=Literal 2
  consequent=
    Return
      …
  alternate=
    Return
      …

{% endhighlight %}

Remember, earlier I said that a good outline/syntax tree should allow us to recreate an equivalent JavaScript program. Try that with the trees we've generated so far. Do they contain all the information you need? Try writing out the whole outline for the `fib` program yourself.

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

The JSON shown above is not really something we'd expect humans to write. Turning a JavaScript program into this form is a job for a parser, and fortunately JavaScript has quite a few good ones, including [Esprima][esprima].

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

Wow, that looks remarkably like the JSON version of the outline we created! Some of the names are a little different, but the structure is nearly the same. Also, there's more information in this version, presumably there to cover syntax or use cases we haven't thought of yet.

This format was established by Mozilla and more information can be found at their [Parser API][parser-api] page. To try this out yourself, open your browser console for this page and try `esprima.parse("var a = [1, 'n'];")`. What do you get when you parse the `fib` function above?

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

That's not too bad. But what does `visit` look like? That's left as an exercise for the reader. What else can you do with the `visit` function once you have it? The next post in this series will cover the tools esnext uses to process the AST once it's been parsed.

[esprima]: https://github.com/ariya/esprima.git
[parser-api]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API

<script type="text/javascript" defer src="/js/esprima.js"></script>
