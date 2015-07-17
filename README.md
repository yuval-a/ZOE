# ZOE
ZOE - a lightweight, no HTML, MVC-style, Javascript library.

## Introduction
**ZOE** (stands for Zero html Object Engine) is a lightweight (~3KB minified) "MVC-style" Javascript library that
lets you create reusable "web components" quickly and easily.

**Minium requirements**:
* Google Chrome, any version,
* Firefox, version 4.0 or above,
* Internet Explorer, version 9.0 or above.
(There is a different version of ZOE, which supports IE below 9.0 and FF below 4.0 as well).

## Documentation

### Getting started
To start, add the ZOE source to your html's head:
```html
<head>
    <script type="text/javascript" src="zoe.min.js"></script>
</head>
```

Once you include the source, a ZOE object will be created under the global
scope (window, usually). Anything related to ZOE will be created under that object.

Let's define a ZOE template. This will be a template for a "To Do list" single item.
In ZOE, templates are defined in pure Javascript. You use the template object
to define an HTML "blueprint", a "prototype" for your component.
This also saves the "overhead" of parsing HTML and then creating a Javscript DOM object out of it.

```javascript
var template = {
  element: "div", classes: "todoItem", children: {
    title: { element: "input", attributes: { type:"text" },
	  editButton: { element: "button", content: "Edit" },
	  deleteButton: { element: "button", content: "Delete" }
  }
}
```

Each object in the template defines an HTML element, and can have several properties to define its DOM structure:
* `element`: is used to specify the name of the HTML element.
* `attributes`: is an object containting attributes for the HTML element (in the form of attribtueName:"attributeValue").
* `dattributes`: if you'd like the element to have `data-` attributes, use the `dattributes` object. .e.g `dattributes: {index:"1"}`, will create this attribute on the element: `data-index="1"`.
* `classes`: is used to specify class names for the element (the value for the `class` attribute)
* `children`: is used to define the element's children. You can have as much nested objects as you need.
If the code becomes too cumbersome you can seperate the components into sub objects, and reference them from your template object. For example:
```javascript
var TodoItemContent = {
	title: { element: "input", attributes: { type:"text" },
	editButton: { element: "button", content: "Edit" },
	deleteButton: { element: "button", content: "Delete" }
}

var template = {
   element: "div", classes:"todoItem", children: TodoItemContent 
}
```
* `content`: is used to set the element's text content.
* `helper`: to define a "Helper" function for this element (see below for details).
* `bind`: is used for 2-way data binding (see below).
* `dsrc`: This is a special property you can include inside an `attributes` object, it is used when the `src` attribute of an `img` element contains a dynamic data variable (see below for more information).


As you can see, each element definition must be an object defined under a named property (`title` is the name of the first element, `editButton` is the name of the second and so on), with the exception of the root element. The name of the root element is the name of the component (see below). There should always be exactly one root element.
The `content` property is used to specify the text content of an element.

Except a `template` object, ZOE also requires a `name` for the entire component. The minimum requirement for ZOE to build a component is a `template` and a `name`. As a best practice it is recommended for a compoenent to be defined as a "closure":

```javascript
TodoItem = (function () {

  var template = {
    element: "div", classes: "todoItem", children: {
      title: { element: "input", attributes: { type:"text" }, content: "Description of to do item" },
	    editButton: { element: "button", content: "Edit" },
	    deleteButton: { element: "button", content: "Delete" }
    }
  }

  return {
    name: "TodoItem",
    template: template
  }
})();
```

### Loading the component
You use the `ZOE.load` function to build your component. Pass the closure you defined to the function:
`ZOE.load (TodoItem);`
Once the `TodoItem` component is loaded - there will be a new object under the ZOE object in memory: 
`ZOE.TodoItem`, and under that there will be an `element` object - that element object is a DOM object representing the "prototype" of the component in DOM form, and is used when rendering instances from it to the document.
You can also see the 'render' function, which is used to render an instance of the component to a new DOM element, ready to be attached to your document. Each component will have its own 'render' function.

You can put the definition and load function in the same single file (e.g. `TodoItem.js`), and include it in the head after ZOE. This will (usually) have your component ready for rendering, even before the browser finishes rendering the `body` part of your HTML. For complex components it can take longer.
In any case, you can listen to the `ZOEReady` event, on your document, that will be triggered once the loading is complete.

Let's create an HTML file for our to do list, this will be in the head:
```html
<head>
    <script type="text/javascript" src="zoe.min.js"></script>
    <script type="text/javascript" src="TodoItem.js"></script>
</head>
```

this will be in the body:
```html
<body>
<main>
  <h1> My To Do List </h1>
</main>
</body>
```

Now we add a script to the end of the `body`, to render a `TodoItem`:
```javascript
<script type="text/javascript">
  document.addEventListener("ZOEReady", function () {
         document.querySelector('main').appendChild(ZOE.TodoItem.render());
  });
</script>
```

This waits for the `ZOEReady` event, then render a `TodoItem` instance, and attaches it the `main` element.

In many occasions it is possible for the loading of the component to be finished before reaching the script that adds the event listener for the `ZOEReady` event, in that case the event will not trigger, and the component will not be rendered. To take care of this, you can check if the component was already loaded, by checking if its objects are not undefined:

```javascript
// If component not loaded yet
if (ZOE == undefined || ZOE.TodoItem == undefined || ZOE.TodoItem.render == undefined) {
  // Wait for ZOEReady event to trigger
	document.addEventListener("ZOEReady", function () {
	        document.querySelector('main').appendChild(ZOE.TodoItem.render());
	});
}
else {
 // otherwise just render and attach it.
 document.querySelector('main').appendChild(ZOE.TodoItem.render());
}
```

This will make one TodoItem appear in the document.

### Data 
There will usually be some data involved in your app.
You can pass a "data context" object to the render function of a componenet, as an argument. The object is a simple JS key:value object, that will represent the data.

#### Data binding
In the `template` definition, you can reference values from the data context, by prefixing their property name with an ampersand. e.g. `@todoTitle`, these are *dynamic data variables*.
Data variables can be used inside the template object. They will be "*tokens*" - that will be replaced with their respectful value from the data context once the element is rendered.
Data variables can be used in the `attributes` object and in the `content` property.

(NOTE: to use a dynamic value for the `src` attribute of an `img` element, use the `dsrc` attribute instead - 
otherwise, once the component is loaded in memory and a "prototype" element is created - on some browsers Javascript will try to actually load the image (with its `src` attribute being the unresolved dynamic variable) and the console may yield an "*404 not found*" message. 
Using `dsrc` will make sure the image will only be loaded upon rendering, after the data variable has been resolved).

For example, let's replace the `content` part of the `title` element with a variable:
`title: { element: "input", attributes: { type: "text", readonly: "readonly", value: "@todoTitle"} },`

Now use a data context with the rendering function:

```javascript
var data = {
   todoTitle: "Feed the dog"
}
```
.
.
.
`ZOE.TodoItem.render(data);`

Now when we run our app, we can see the "Feed the dog" text in the title input.


##### Two-way data binding: 
Two way data binding can be implemented by specifing a `bind` property.
The value of the `bind` is a the name of an object defined on the data context of the component.
Whenever the value of the element changes - then it is automatically assigned to a property inside that object. The property name will be the name of the element.

For example, if we would want to automatically save changes in the `title` element to the data context,
we can define inside the data context another empty object, e.g. `updatedItem: {}`,
add the "bind" property to the `title` definition in the template object:
`bind: updatedItem`
Now whenever a change is being made to the value of `title` - the changed value will be updated inside the data context, in `updateItem.title` .


#### More on rendering
If you want the rendering function to not block the execution, and go to the next statement, there is an alternate rendering function called `renderAsync(datacontext, renderCallback)`,
that function will start rendering and immediatly continue (by using `setTimeout({},0)`), use a callback function for the second parameter to be notified once the rendering is complete.

There are also shortcut aliases for the rendering functions:
`$` is an alias for `render` (e.g. `ZOE.TodoItem.$(context)`);
`$$` is an alias for `renderAsync`.


### Events 
To add user interaction to your component, you define an `events` object.
The `events` object is built from standard DOM event names on its "outer layer" and event functions for each component on its "inner layer". The properties for the event functions are the "names" of the elements as defined in the `template` defintion.

for example, to define an event to the `Edit` button:
```javascript
var events = { 
    click: {
         editButton: function() {
             // event code here.
         } 
    }
}
```
Events in ZOE are triggered by auto implementing "Event Delegation". When a component is rendered - only one event handler is created, attached to the root element. On that handler, it is checked what element originated that event - and if a relevant event function was defined it is triggered.

The `this` context inside the event function - is always the target element for the event (the element that triggered the event). The standard Javascript `Event` object is also available, and is passed to the function as the first argument.

When rendered, all elements in the component will always have two special objects, attached to them: 
`ref` and `context`.

`ref` is an object containing references to **ALL** elements in the entire component. This means you can quickly access any other element in the component, without having to call DOM query functions such as
`document.GetElementById`, or `document.querySelector`.

`context` is a reference to the data context used when rendering the component, you can read and write from it.

When defining the events inside a closure, add it the `return` part: 

```javascript
return {
  name: "TodoItem",
  template: template
  events: events
}
```
When you load the component, you will also see the 'events' object under
`ZOE.TodoItem`, in the memory.

For example, let's have the click event for the `Edit` button,  remove the `readonly` attribute from the title element, and let's also add an handler for the `change` event of the `title` element, bringing back the `readonly` attribute once the user has finished editing the text:

```javascript
var events = { 
    click: {
         editButton: function() {
               this.ref.title.removeAttribute("readonly");
         },
        change: {
            title: function () {
                this.setAttribute("readonly", "readonly");
            }
        }

    }
}
```

Note, there is a special event in ZOE, that can be handled in the outer layer of the events object: 
the `created` event. If you define it, it is triggered once the entire component has been created - but just before it is visually rendered. You can put bootstrapping and initialization code in it.
e.g:
```javascript
var events = {
    created: function() {
        // You have access to this, this.ref and this.context
    }
}
```
The `this` inside the function is the entire component element.

Now you can create a Todo List using a an array of data items, and a `for` loop:

```javascript
function renderTodo() {
    var main = document.querySelector('main');
    var todoItems = [
      { todoTitle: "Feed the dog" },
      { todoTitle: "Brush your teeth" },
      { todoTitle: "Takeout garbage" },
      { todoTitle: "Finish article" }
    ];
    
    for (var i = 0, len = todoItems.length; i < len; i++) {
      main.appendChild (ZOE.TodoItem.$(todoItems[i]));
    }
}
```
call `renderTodo`, from the `ZOEReady` event:
`document.addEventListener("ZOEReady", renderTodo);`

There is a more elegant "native" way to achieve this, though:

### Helpers
"*Helpers*" in ZOE are like "plugins", these are functions that anyone can write and extend the ZOE object with.
Execution can be passed to an Helper function - just before an element in the component is being rendered,
thus allowing the function to alter the normal rendering function.

One of the many things you can acheive with it - is to implement a common "Repeater".

this will be our "helper repeater" function:

```javascript
ZOE.helperRepeater = function (repeater, repeaterContext)
{
      var rlen = repeater.children.length, c;
      for (c = 0, clen = repeaterContext.length; c < clen; c++)
        for (var i = 0; i < rlen; i++)
            repeater.appendChild(ZOE.render(repeater.children[i], repeaterContext[c]));

      for (c = 0; c < rlen; c++)
        repeater.removeChild(repeater.firstChild);
}
```
(Explanation for the code is shown later below).
You should define it in your code, before defining your template, by extending the ZOE object,
the name of the function should be 'helper' and then the name of the Helper (a name you decide, and use that name later in the template definition).
a `helper` property can be defined on any element inside the component, by using the `helper` keyword,  and specifying the helper name as the value. e.g.: `"Repeater"`.
Once an helper is defined on an element, when it is rendered (e.g. as part of the rendering process of the entire component, or when using the `rerender` function (see below)) - 
then instead of following the normal rendering execution code, control is passed to the helper function.
Two arguments are passed to the function. The first is the repeater "prototype" DOM element (similar to the `element` object created in memory after loading a component),
and the second is a "sub" data context. This sub data context, is an object that should be defined inside the "global" data context for the component, and its name must be the name of the element where the helper was defined for.

Let's redefine the "to do list" template, to use the helper repeater.
We'll recreate the component, to encapsulate everything related to the app (including the title), and we'll call it `TodoList` this time.

The repeater element will be a `ul` element, with a single `li` child defined.
We'll also add a `dattributes` object (which is used to create `data-` attributes), with an `index` attribute with the value of the dynamic variable `id` (we're going to use it in a little while, when we create the "delete" mechanism)

```javascript
TodoList = (function () {
    var template = {
        element: "div", children: {
            header: { element: "h1", content: "My To Do List" },
            TodoItems: { element: "ul", helper: "Repeater", children: {
                todoItem: { element: "li", dattributes: {index:"@id"},children: {
                    title: { element: "input", attributes: { type: "text", readonly: "readonly", value: "@todoTitle" }, bind: "newtodo" },
                    editButton: { element: "button", content: "Edit" },
                    deleteButton: { element: "button", content: "Delete" }
                }}
            }}
        }
    }

    var events = {
        click: {
            editButton: function () {
                this.ref.title.removeAttribute("readonly");
            }
        },
        change: {
            title: function () {
                this.setAttribute("readonly", "readonly");
            }
        }
    }

    return {
        name: "TodoList",
        template: template,
        events: events
    }

})();

ZOE.load(TodoList);
```

Don't forget that the `ZOE.helperRepeater` function needs to defined before that.
Now, you can include all the data for the repeater, inside the data context, which can look like this now:

```javascript
  var data = {
    TodoItemsData: [
      { id: 0, todoTitle: "Feed the dog" },
      { id: 1, todoTitle: "Brush your teeth" },
      { id: 2, todoTitle: "Takeout garbage" },
      { id: 3, todoTitle: "Finish article" }
    ]
  };
```
Notice the `id` property.

All of the data needed for the repeater is in the array `TodoItemsData` - 
note that you must give it that name, since the name of the repeater element in the template is `TodoItems` - 
ZOE will automatically look for an object called `TodoItemsData` (i.e. [element-name]Data) inside the data context, 
and will use it for the data context of the repeater.

Now you can simply call `render` one time:

`main.appendChild(ZOE.TodoList.$(data));`

When the component is rendered, you can see that a new `li` element was created inside the `ul`, for each item in the `TodoItemsData` - this was implemented by the Repeater function, let's look at it again now:

```javascript
ZOE.helperRepeater = function (repeater, repeaterContext)
{
      var rlen = repeater.children.length, c;
      for (c = 0, clen = repeaterContext.length; c < clen; c++)
        for (var i = 0; i < rlen; i++)
            repeater.appendChild(ZOE.render(repeater.children[i], repeaterContext[c]));

      for (c = 0; c < rlen; c++)
        repeater.removeChild(repeater.firstChild);
}
```
The function gets the repeater `ul` element, and the `TodoItemsData` data context.
For each item in the data context:
 for each of the repeater's children (in this case - one),
    render a new element, and append it as a child to the repeater element.

This works because there is also a `render` function defined under the `ZOE` object, which can receive a DOM element "prototype" as its argument (and a data context as the second), and render an instance of it.
The second loop is for "cleaning up" all the child "prototype" elements.


### Styling the components
You can use the `classes` property in the template and then style normally using style classes.
You can also use an `id`, by putting it inside an `attributes` object (e.g. `attributes: {id:"theid"}` ).
You can also style by the value of `data-name`; When a component is rendered, each of its children will have a data-name attribute with its name as the value.
(WARNING: do not overwrite this attribute yourself in event code or anywhere else!).

Let's style the ul element, to not show bullets in the list:
```css
<style type="text/css">
          ul[data-name="TodoItems"] {
                list-style-type: none;
            }
</style>
```

### `rerender` and `refresh`
There are two "element-level" functions automatically created on each child element of the component:
`rerender` and `refresh`

you can call `rerender` from any element - 
to recreate itself and its children. This is usefull when making changes to the data context, in a way that would affect the actual child elements, and reflecting those changes.

Calling `refresh` - will only affect the text content of the element and its children, and will not rebuild the elements. So if there are changes to variable values that were used in the `content` property of elements in the template - the text content will "refresh" with their new values.

Let's update our app to enable users to delete items from the list:
We'll add a `click` event for the `Delete` button:


```javascript
            deleteButton: function () {
                var i = parseInt(this.parentNode.dataset.index),
                    items = this.context.TodoItemsData;
                this.context.TodoItemsData = items.filter(function (item) {
                    return item.id !== i;
                });
                console.log(this.context);
                this.ref.TodoItems.rerender();
            }
```

We use the `data-index` attribute to filter out the equavelent item (according to its `id` property) from the `TodoItemsData` array, and then `rerender` the `TodoItems` element to reflect the changes.


Now, an "Add item" mechanism can also easily be added to the app.


## More examples
For a more complex demonstration of ZOE abilities, see 
http://www.yfactor.co.il/crowdplaylist/

It's a "playlist manager", data bound to a Google Spreadsheet document. Tt supports searching through the playlist, 
and allows anyone to add new items to the playlist.


