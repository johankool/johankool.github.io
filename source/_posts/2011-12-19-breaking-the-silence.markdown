---
layout: post
title: "Breaking the Silence"
date: 2011-12-19 13:59
comments: true
categories: 
---

No false illusions, there is no one besides me who noticed the silence on this blog during the last couple of weeks. It was everything but silent behind the curtains however. Mostly rattling of my keyboard…

I have been working hard on one major iPad project together with the awesome people at [Egeniq](http://www.egeniq.com/). My contribution was a significant part of the iPad app coding, but there are way more people involved for design and backend development, and not just at Egeniq either. Last Friday I had the honor of doing the last code review for build 1.0 of the app, and by virtue of approving the merge on GitHub, setting in motion the final build. [Whoot](https://twitter.com/ijansch/status/147726912578531328)!

<!--more-->

The opening of the curtains is planned for January of next year and shouldn't go unnoticed for the Dutch, the target market. There are plans for TV commercials announcing the app, as well as outdoor advertising. Wicked!

### Git, GitHub and code reviews
For me this was the first big project using git. Git combined with GitHub really is a winner. The amount of time I spent on fighting with SCM was significantly lower than when using Subversion. There were some disagreements between me and git, but we worked it out. 

Something that was actually very neat was the strict rule that code was to be reviewed before it got merged into the main repository. If you know it's not just you reading the code it makes that you'd doubly want to commit great code. That only works if the code reviewers have a great competency level too, which luckily was the case. 

We worked from our own forks, then did pull requests via GitHub. Their interface is great and it is generally quite easy to spot issues. Some things did slip through code review though, mainly bugs where the diff snippets in GitHub didn't provide enough context for the reviewer to spot the problem. GitHub lets you click through to the full file, but as this lacks highlighting of the changes, it does little in helping to spot problems. Some Ajax-y way to load more context would be a great enhancement.

One rule that we had for code review was that commented out code was not allowed unless a comment was present explaining the reason. The explanation better be a good one too. This was useful in keeping the code base clean. I have noticed that in earlier projects I have let such commented out code blocks accumulate. Usually it would end up being deleted in the end, or if reinstated not work quite as expected anymore due to changes made elsewhere. This commented out stuff just doesn't belong in your code base. And remember, you are using SCM so you can always get back to it if needed anyway. 

### Pivotal Tracker
Another tool we used was [Pivotal Tracker](http://www.pivotaltracker.com/). I am actually quite enthusiastic about this one. Its strength is its simplicity. You break up what needs to be done in small units of work, stories, and these go through the states: started, finished, delivered and then accepted – or rejected if you messed up. Works fine, though there is one state that I would add: blocked. Too often you run into something where you cannot continue with the work due to a missing image file, specification, backend issue, etc. etc. It would help the project managers to more easily spot where the hold ups are if such stories could be marked as blocked. 

### Fireworks
One thing that didn't quite go so smoothly was the delivery of artwork. The designers used Adobe Fireworks. Quite the misnomer, as there is not much that really works in it. Not that I have been able to find any software that could sensibly be used as its replacement, but still. The designs were sliced to extract the needed artwork, but with every change to the design the slices came out with different names, so yeah that was fun. Also, it must not be straightforward enough in FireWorks to name slices something sensible, as we ended up with a bunch of very similarly named image files. Luckily there is QuickLook, but this still sucked. 

### Third party frameworks
The client wanted integration with some 3rd party services which provided services such as social media, analytics and mobile advertisements. This meant we had to integrate frameworks developed by these parties into the app. Clearly not all frameworks are created equal. We had some excellent ones that were easy to use, and didn't cause any issues. There were some that gave some build warnings, but worked okay otherwise. And then there was the framework that ignored a number of Cocoa conventions and gave us many instability issues.

In my opinion this underlines the importance of not only choosing a service on promised features and pricing, but also needs technical vetting of the provided framework. It only takes one buggy framework to make the whole app prone to crashes. Luckily the respective third party framework developer was responsive and managed to get us an updated framework just in time for our deadline.

### Conclusion
All together it was a fun project to work on, and I am looking forward to its public release. And now I should get back to work: version 1.1 is going to be even better!