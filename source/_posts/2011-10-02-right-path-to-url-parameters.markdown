---
layout: post
title: "Right Path to URL Parameters"
date: 2011-10-02 00:40
comments: true
categories: Cocoa Objective-C NSURL
---

It is very common to have to construct URLs in iOS apps. Unfortunately there is no such things as `NSMutableURL`, so we need to come up with our own solution. Most developers seem to take a very pragmatic approach to this. Basically, you take a base URL, append a path and/or parameters to it, and go about your business. Almost, if not all, code I have seen do this make assumptions about the base URL: for example, no query or fragment present in the URL. Sometimes even relying on the other parts of the app always providing text that is safe to use in an URL. It can be quite a safe assumption that this is safe within your app, but I wanted a solution that is safe to use no matter what the base URL looked like, or what text was provided for the parameters.

<!--more-->

### URL Building Blocks
Let's have a quick look at how a URL is constructed. The various parts of an URL are:

    scheme://username:password@domain:port/path?query#fragment

The pragmatic approach works well if the base URL does not contain a path, query and fragment. The presence of a path is usually not a problem, it gets trickier when a query is already present, and most solutions definitely fail when a fragment is present.

The code provided below takes the presence of path, query and/or fragment into account. Don't just take my word for it, you can run the provided unit test to ensure it does it right.

### Path
To replace a path complete, use `- (NSURL *)URLByReplacingPathWithPath:(NSString *)path`. Alternatively, use `- (NSURL *)URLByAppendingPathWithRelativePath:(NSString *)path` if you want to append a relative path. This also allows to you walk up the path using for example `../foo`. The path will get simplified if possible.

### Parameter
The most effective way to add parameters is to use `- (NSURL *)URLByAppendingParameters:(NSDictionary *)parameters`. The dictionary is expected to contain `NSString`s as keys. The corresponding values may be either `NSString`s or should respond to the method `- (NSString *)stringValue`, otherwise the value will default to  `- (NSString *)description`. Both keys and values will get URL escaped.

It is valid in an URL to have a parameter name appear multiple times, unlike it is for keys in `NSDictionary`. You can work around this by calling the method `- (NSURL *)URLByAppendingParameterName:(NSString *)parameter value:(id)value` multiple times with the same parameter name.

### Code
The code is available as a [gist on GitHub](https://gist.github.com/1256354). The license for the code is a simple BSD license. You don't need to attribute me or Koolistov in your app (although appreciated if you do), but you need to leave the copyright notice intact on the source files.

{% gist 1256354 %}

