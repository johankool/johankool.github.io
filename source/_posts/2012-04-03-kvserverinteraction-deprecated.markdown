---
layout: post
title: "KVServerInteraction deprecated"
date: 2012-04-03 23:04
comments: true
categories: Cocoa Objective-C
---

As of today I am deprecating [KVServerInteraction](https://github.com/Koolistov/Server-Interaction). It has served its purpose as a generic network solution for a number of apps that I have worked on. However, it was a bit too simplistic in its approach. 

My recommendation is to switch to [MKNetworkKit](https://github.com/MugunthKumar/MKNetworkKit) by [Mugunth Kumar](http://blog.mugunthkumar.com/). It follows a very similar approach. It too has a central service controller (a.k.a. network engine) that performs the service requests (a.k.a. network operations).

<!-- more -->

Where MKNetworkKit shines is that is much further fleshed out. For example, it adjusts the number of active connections to match the current network condition. It comes with support for caching, as well as freezing active requests. The cURL-able debug lines are nice touch too. From what I have seen so far everything that KVServerInteraction could do, can be done with MKNetworkKit as well.

It is quite straightforward to convert your code from KVServerInteraction to MKNetworkKit. Below are two snippets that shows how a service request (a.k.a. network operation) is done. Both methods would live on your custom subclass of your service controller (a.k.a. network engine).

{% codeblock KVServerInteractiom lang:objc %}

- (KVServiceRequest *)fetchGuestbookEntriesOnPage:(NSUInteger)pageIndex completionHandler:(KVRequestCompletionBlock)completionHandler {
    NSURL *URL = [self.baseURL URLByAppendingPathWithRelativePath:@"entries"];
    URL = [URL URLByAppendingParameterName:@"page" value:[NSNumber numberWithUnsignedInteger:pageIndex]];
    return [self performRequestWithURL:URL HTTPMethod:@"GET" bodyData:nil requiresToken:YES allowCaching:YES forceRefresh:NO completionHandler:completionHandler];
}

{% endcodeblock %}

{% codeblock MKNetworkKit lang:objc %}

- (MKNetworkOperation *)fetchGuestbookEntriesOnPage:(NSUInteger)pageIndex completionHandler:(void (^)(id result))completionHandler {
    NSMutableDictionary *params = [NSMutableDictionary dictionaryWithObject:[NSNumber numberWithUnsignedInteger:pageIndex] forKey:@"page"];
    MKNetworkOperation *operation = [self operationWithPath:@"entries" params:params httpMethod:@"GET"];
    [operation onCompletion:^(MKNetworkOperation *completedOperation) {
        completionHandler(completedOperation.responseJSON);
    } onError:^(NSError *error) {
        completionHandler(nil);
    }];
    [self enqueueOperation:operation];
    return operation;
}

{% endcodeblock %}