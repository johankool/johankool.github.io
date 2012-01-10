---
layout: post
title: "Two Developer Tool Tips"
date: 2012-01-10 20:54
comments: true
categories: programming
---

Two quick tips for fixing some troubles with developer tools. I ran into both today, though they are likely unrelated. I couldn't find much about it online, so here goes.

<!--more-->

## FileMerge won't open for third party app
When trying to view differences using GitBox, nothing would happen. This symptom started after I had installed a beta version of Xcode. Once I realized that GitBox opens FileMerge via the command line utlity `opendiff` the fix was easy: selecting the proper Xcode installation.

This is done as such: 

	xcode-select -switch /path/to/developer-folder
	
## Symbolicating crash logs failed
When trying to symbolicate some crash logs I got this error:

 	Error: Can't run /usr/share/xcode-select/xcrun (no such file).

This was somewhat puzzling, because also on my other Mac, where symbolicating crash logs did work, there was no such file.

The command line utility `xcrun` is by the way what is used by a number of scripts to find out which Developer folder to use. 

Luckily the fix turned out to be quite straightforward: reinstall `xcrun`. Simply reinstalling Xcode does the trick, or you can take the shortcut I took, and go into the Install Xcode bundle to find `xcrun.pkg` in `/Contents/Resources/Packages/`.

Once that installer package was installed, `xcrun` ran happily again.

To symbolicate crash logs you run this command:

	/Developer/Platforms/iPhoneOS.platform/Developer/Library/PrivateFrameworks/DTDeviceKit.framework/Versions/A/Resources/symbolicatecrash /path/to/crash-log
	
(Yes, you probably should use some way to shorten that.)