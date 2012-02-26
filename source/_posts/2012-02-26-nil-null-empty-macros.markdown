---
layout: post
title: "Nil, Null, Empty Macros"
date: 2012-02-26 23:48
comments: true
categories: Cocoa Objective-C NSNull NSString
---

Just a quick note to point out a gist I've made available a couple of days ago with three handy macros to deal with `nil`, `NSNull`, and empty strings (`@""`). 

The first two are very handy when dealing with JSON dictionaries. The last one if you need to replace strings and want to avoid having `(null)` all over the place.

{% gist 1874995 %}