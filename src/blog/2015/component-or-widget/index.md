---
title: Component or Widget
template: blogPages
blog:
    published: "2015-06-10"
    modified: "2015-06-24"
    author: harshal
    tags:
        - Architecture
        - Fundamentals
---
When we talk about user interfaces, **components** and **widgets** are the words that are used interchangeably.
So frameworks that claim they are component based frameworks and there are some libraries that claim to be widget toolkits or widget libraries.
But there is little difference between the two.

**Component or more specifically software component** is a very generic term that refers to any reusable entity.
A reusable entity could be a class, web service, module, library, web resource, DLL file, etc.
**A component has well defined interface through which developers can access the functionalities provided by that component.**
Internal details are not visible to user.
In case of web services or distributed objects, component interface is expressed as set of APIs.

Now **widget is essentially a component with a requirement that at one interface of widget should be a graphical user interface with which end user can interact.**
It can also have additional interface though which developer can make it interact with other components.
So every widget is component while not every component is widget.

Finally, there is also a mention of **portlet** in some scenarios.
In my opinion, portlets are also widget and thus ultimately components.
However, word **portlet is used in specific context**.
Most common context is **web portal** which displays aggregated data from different sources and portlets are used to show that aggregated data.
In SharePoint, **webparts** are equivalent of portlets.