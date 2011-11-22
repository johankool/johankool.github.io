---
layout: post
title: "A Fresh New Website"
date: 2011-09-17 13:00
comments: true
categories: general website
---

A fresh new website for Koolistov is finally here. As Koolistov recently incorporated in Singapore as a private limited company, an update to its website was more than overdue. The old started to show its age, and although I applied a somewhat fresher CSS style to it, it still didn't feel quite right.

The legendary [Matt Gemmell](http://mattgemmell.com/2011/09/12/blogging-with-octopress/) had been feeling the need to freshen up his personal blog recently too, and this is how I got to learn about [Octopress](http://octopress.org/). Octopress is framework based on [Jekyll](https://github.com/mojombo/jekyll) created by [Brandon Mathis](http://twitter.com/imathis). It provides you with a great looking, HTML5 based blog. You run it locally on your own computer where it creates a static website which can be hosted anywhere. Despite being static, it actually offers quite a nice number of features by wisely letting established third parties take care of those, such as comments and searching. It's quite configurable, and by creating static html you are not getting locked in to one hosting provider. Great stuff!

<!--more-->

Octopress has support for deploying directly to GitHub Pages, or `rsync`-ing to a plain webserver. However, the previous website of Koolistov was running on [Google App Engine](http://code.google.com/appengine/). There are a few features that I implemented there that are in use by some of my apps, and/or that I would not really want to part with. As it turns out, I can have the best of both worlds: keep my website on Google App Engine, and use Octopress.

The first hurdle though was to get Octopress to run locally. The installation isn't particularly difficult but there was one gotcha worth mentioning. The installation instructions assume that you are using the `bash` shell on Mac OS X. If, like me, you have been using a Mac OS X for longer than you can remember, yours may still be the `tcsh` shell. Once I did the installation via a temporary `bash` shell, and also use such a `bash` shell when working with Octopress, all is fine. Maybe someday I'll catch up with the times and change my default shell to `bash`, but that's not for today.

A number of solutions showed up when searching for ways of hosting a static website via Google App Engine. By far the best solution I found made it as easy as putting everything in a folder named `static` and adding a bunch of handlers to `app.yaml`. This solution beats others in that it doesn't require any processing, and that it can serve up the `index.html` of a folder when such folder is accessed without resorting to performing redirect to the `index.html`.

{% gist 873098 app.yaml %}

Now if only Google App Engine would support naked domain names... I guess we need to keep something to dream about.