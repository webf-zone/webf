---
title: Do browsers really need doctype?
template: blogPages
blog:
    published: "2015-06-28"
    modified: "2015-06-30"
    author: harshal
    tags:
        - HTML
        - Fundamentals
---
**The simple answer is "no".** Theoretically, the browser does not care about Doctype declaration on HTML page.
Having said that, let's try to explore what I really mean by that.

When web started, it was all the rush.
Everyone was building HTML pages to go online. There were no standards.
As HTML was simple to use, everyone tried to use.
There were no sophisticated tools available and everyone hand-coded the HTML which many not be necessarily accurate.
As HTML was fault tolerant, the errors like missing closing tags, bad nesting, etc. were automatically corrected by the the browsers and so such were the early days of web.
But this introduced many problems. Every browser tried to handle errors in their own way.
And again, HTML was going through revisions like HTML 3, HTML 3.2, HTML 4 and so on.

So in order for pages to be as good quality as possible, **W3C introduced page validators** that would check for the common HTML errors mentioned above.
But again, there was a problem. Against which version should the page validator validate the page?
Should it be version 3, 3.2 or 4? How would a validator come to know? And it is not just about validators.
There are many user agents out there that may need HTML page version information.
Browser is just one of them. Another user agent, say search bot/crawler may use HTML version information to rank the web page for their date preference.

Finally, a solution was devised. The solution was to **put XML like Doctype declaration as the very first line of any HTML page.**
This line would not affect the rendering of HTML page instead it shall provide the meta information about the page against which validators can validate.
And so is the main motivation behind Doctype declaration in HTML pages.

Little fast forward in time, W3C established new standards including CSS.
But browser vendors had implemented CSS standards that was not compatible with W3C standard.
If browser vendors followed this new rendering mode, the old web pages would simply break and number of web pages was in millions if not in billions.
So, **the question for browsers was to be backward compatible and at the same time provide support for new standards.**
So how to solve the problem?

If I can recall it correctly, Internet Explorer devised a clever mechanism to this problem.
As old pages did not have Doctype declaration, it assumed that a page without Doctype would be coded using old techniques and thus should be rendered in quirks mode.
While the presence of Doctype would mean that the page should be rendered as per new standards and thus in standards mode.
Soon, this technique was adopted by other browsers too. Thus, the Doctype was forever tied to browser.

The immediate thing to note is that **browser only cares for presence or absence of Doctype and not the version number.**
Here is a little question. If you use, say, Doctype for HTML 4 and try to include HTML5 audio or video tag and try to display the page on HTML5 capable browser, will it work?
The answer is certainly yes. It won't care for Doctype version. This will work even if Doctype is absent; just the thing is it shall render it in quirks mode.

That's about Doctypes...