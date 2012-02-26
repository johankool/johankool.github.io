---
layout: post
title: "Dismissing Modal View Controller Advice"
date: 2012-02-26 21:00
comments: true
categories: Cocoa Objective-C 
---

Earlier today [Mugunth Kumar](http://twitter.com/mugunthkumar/) blogged about [some advice about dismissing modal view controllers](http://blog.mugunthkumar.com/articles/ownership-of-presented-view-controllers-with-and-without-arc/) to further explain his tweets from Saturday:

{% blockquote %}
"The controller that presents a modal controller should dismiss it. Don't do [self dismissModalViewControllerAnimated:NO] in the child."
{% endblockquote %}

and:

{% blockquote %}
"Calling [self dismissModalViewControllerAnimated:NO] on child is like committing seppuku. A child shouldn't kill itself."
{% endblockquote %}

He does have a good point saying the presenting view controller should also be the one deciding when the modal view controller should disappear. However, it is not too far fetched to say that the modal view controller itself can determine best when its time has come.

<!--more-->

I am uncertain wether we can deduct from Apple's sample code and/or API which approach they recommend. Even if all sample code lets the presenting view controller decide (I haven't checked this), the API clearly allows the modal view controller to dismiss itself. 

My biggest objection though arises as he next attempts to explain that under ARC it is not possible to have proper memory management simultaneously with letting the modal view controller dismiss itself. This is just false.

In his non-ARC examples in both cases he retains the modal view controller before presenting it. This may be useful on occasion, but there is no need for it. The modal view controller is namely already retained when the `-[presentModalViewController:animated:]` method gets called. It is perfectly valid to pass an autoreleased view controller to that method. That would also avoid the ugly memory management that he uses in his second method. (There is BTW also a memory leak when he assigns the modal view controller to its property.) On `-[dismissModalViewControllerAnimated:]` the modal view controller gets released again.

There is nothing in this that changes under ARC vs. non-ARC. In both cases this works fine, wether you let the presenting or the modal view controller dismiss doesn't matter. So this only leaves the 'purity' of which way is cleaner. That is a debatable issue.

So, I'd conclude, feel free to do it in the way that makes sense to you. Keep an eye on your memory management, also with ARC, but either way can work.

**Update:** [Mugunth Kumar](http://twitter.com/mugunthkumar/):

{% blockquote %}
"@johankool Good, but you still haven't shown a ARC example."
{% endblockquote %}

Okay, fair enough. The below is a sample of how I would do this with ARC. As I said, there doesn't really change anything in ARC vs. non-ARC.

{% codeblock Presenting View Controller lang:objc %}
- (void)showModalViewController {
    SomeViewController *someViewController = [[SomeViewController] alloc] initWithNibName:@"SomeViewController" bundle:nil];
    // Note: under non-ARC I would call autorelease on someViewController
#if DELEGATE
    someViewController.delegate = self;
#elif COMPLETION_BLOCK
    someViewController.completionBlock = ^(NSUInteger result) {
        self.result = result;
        // Note: there isn't really any need to reference someViewController in this block
    };
#endif
    [self presentModalViewController:someViewController animated:YES];
}

#if DELEGATE
- (void)someViewController:(SomeViewController *)controller pickedResult:(NSUInteger)result {
    self.result = result;
}
#endif
{% endcodeblock %}

{% codeblock Modal View Controller lang:objc %}
- (void)pickedResult:(NSUInteger)result {
#if DELEGATE
    [self.delegate someViewController:self pickedResult:result];
#elif COMPLETION_BLOCK
    if (self.completionBlock) {
        self.completionBlock(result);
    }
#endif
    [self dismissModalViewControllerAnimated:YES];
}
{% endcodeblock %}