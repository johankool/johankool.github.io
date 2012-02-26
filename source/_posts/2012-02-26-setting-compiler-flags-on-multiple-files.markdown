---
layout: post
title: "Setting Compiler Flags on Multiple Files"
date: 2012-02-26 21:37
comments: true
categories: Cocoa Objective-C Xcode
---

This snippet of golden Xcode knowledge was tweeted by colleague [Thijs Damen](http://twitter.com/thijsdamen/) last Friday:

{% blockquote %}
"Selecting multiple files under 'Build Phases' and pressing enter sets multiple compiler flags at once. Timesaver! #ios"
{% endblockquote %}

Xcode lets you set compiler flags per file in the 'Compile Sources' build phase. A very common need these days it so have to set ` -fno-objc-arc` when code is not yet readied for ARC. More often than not this involves a bunch of files. Repeating the process of setting this flag for a bunch of files gets old really quick.

<!-- more -->

So here is what you do:

1. Select the files in the 'Compile Sources' build phase
2. Press enter
3. Enter the compiler flags in the popup
4. Press done

As I said: golden!